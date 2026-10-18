"""Zeichnen der einzelnen Frames mit Pillow.

Wichtig fuer den Trick: jeder Frame wird komplett eigenstaendig gezeichnet.
Es gibt keine Interpolation, keine Ueberblendung und keinen Motion-Blur
ueber mehrere Frames. Gleicher Frame-Index -> immer identisches Bild
(die Schraegstellung der Labels haengt nur am Seed, nicht am Zufall).
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFont

from .config import resolve_font_path
from .geometry import angle_delta, norm180, norm360


class Renderer:
    """Haelt Schrift, Zeigergrafik und vorberechnete Werte - einmal bauen, oft nutzen."""

    def __init__(self, cfg):
        self.cfg = cfg
        self.width = int(cfg["video"]["width"])
        self.height = int(cfg["video"]["height"])
        self.cx = self.width / 2.0
        self.cy = self.height / 2.0 + float(cfg["layout"]["center_y_offset"])
        self.radius = float(cfg["layout"]["radius"])

        font_path = resolve_font_path(cfg)
        self.font = ImageFont.truetype(font_path, int(cfg["font"]["size"]))
        self.small_font = ImageFont.truetype(font_path, max(18, int(cfg["font"]["size"] * 0.38)))

        self.target_color = cfg["font"]["color"]
        self.decoy_color = cfg["font"].get("decoy_color") or cfg["font"]["color"]

        # decoy_label darf ein String oder eine Liste sein. Eine Liste wird
        # reihum auf die Koeder-Plaetze verteilt.
        decoys = cfg["decoy_label"]
        self.decoy_labels = list(decoys) if isinstance(decoys, (list, tuple)) else [decoys]

        # Ueberschrift
        hcfg = cfg["headline"]
        self.headline_font = None
        if hcfg.get("text"):
            self.headline_font = ImageFont.truetype(
                hcfg.get("font_path") or font_path, int(hcfg["size"])
            )

        # Statische Grafik in der Bildmitte (z.B. Logo)
        self.center_image = None
        if cfg["center_image"].get("path"):
            image = Image.open(cfg["center_image"]["path"]).convert("RGBA")
            target_w = int(cfg["center_image"]["width"])
            if target_w and target_w != image.width:
                scale = target_w / image.width
                image = image.resize(
                    (target_w, max(1, int(image.height * scale))), Image.LANCZOS
                )
            self.center_image = image

        # Schraegstellung je Label-Identitaet vorberechnen: stabil ueber alle Frames.
        self._tilts = {}
        rnd = random.Random(int(cfg["seed"]))
        jitter = bool(cfg["font"]["jitter"])
        jmax = float(cfg["font"]["jitter_max"])
        for kind in ("target", "decoy"):
            count = int(cfg["target_count"] if kind == "target" else cfg["decoy_count"])
            for index in range(count):
                self._tilts[(kind, index)] = rnd.uniform(-jmax, jmax) if jitter else 0.0

        # Fertige Label-Bilder zwischenspeichern (Text + Drehung aendern sich
        # nur ueber den Winkel, der Text selbst nie).
        self._label_cache = {}
        self._pointer_png = self._load_pointer_png() if cfg["pointer"]["type"] == "png" else None

    def decoy_text(self, index):
        """Text des Koeder-Labels Nr. index (Liste wird reihum durchgegangen)."""
        return self.decoy_labels[index % len(self.decoy_labels)]

    # ------------------------------------------------------------------
    # Hilfsgeometrie
    # ------------------------------------------------------------------
    def point_at(self, angle_deg, radius=None):
        """Winkel (0 = oben, im Uhrzeigersinn) -> Pixelkoordinate."""
        r = self.radius if radius is None else radius
        rad = math.radians(angle_deg)
        return self.cx + r * math.sin(rad), self.cy - r * math.cos(rad)

    def _text_rotation(self, angle_deg):
        """Drehung des Textes in Grad gegen den Uhrzeigersinn (fuer PIL.rotate)."""
        orientation = self.cfg["font"]["orientation"]
        if orientation == "upright":
            rot = 0.0
        elif orientation == "tangential":
            rot = -angle_deg
        else:  # radial: Text laeuft entlang des Radius nach aussen
            rot = 90.0 - angle_deg
        # Gedaempfte Drehung: 1.0 = voll, 0.0 = alles waagrecht.
        rot *= float(self.cfg["font"].get("orientation_strength", 1.0))
        # Lesbarkeit: nie auf dem Kopf stehen lassen.
        if abs(norm180(rot)) > 90.0:
            rot += 180.0
        return norm180(rot)

    # ------------------------------------------------------------------
    # Labels
    # ------------------------------------------------------------------
    def _label_image(self, text, color, rotation):
        """Textbild rendern und drehen (mit Cache, Drehung auf 0,5 Grad gerundet)."""
        key = (text, color, round(rotation * 2) / 2.0)
        cached = self._label_cache.get(key)
        if cached is not None:
            return cached

        stroke = int(self.cfg["font"]["stroke_width"])
        pad = stroke * 2 + 8
        # Textgroesse messen
        probe = Image.new("RGBA", (8, 8))
        box = ImageDraw.Draw(probe).multiline_textbbox(
            (0, 0), text, font=self.font, stroke_width=stroke, align="center"
        )
        w = int(box[2] - box[0]) + 2 * pad
        h = int(box[3] - box[1]) + 2 * pad

        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(layer).multiline_text(
            (pad - box[0], pad - box[1]),
            text,
            font=self.font,
            fill=color,
            align="center",
            stroke_width=stroke,
            stroke_fill=self.cfg["font"]["stroke_color"],
        )
        if abs(rotation) > 0.01:
            layer = layer.rotate(rotation, resample=Image.BICUBIC, expand=True)

        self._label_cache[key] = layer
        return layer

    def _paste_label(self, canvas, text, color, angle_deg, tilt):
        """Label mittig auf der Ringposition absetzen."""
        rotation = self._text_rotation(angle_deg) + tilt
        layer = self._label_image(text, color, rotation)
        x, y = self.point_at(angle_deg)
        canvas.alpha_composite(
            layer, (int(round(x - layer.width / 2)), int(round(y - layer.height / 2)))
        )

    # ------------------------------------------------------------------
    # Zeiger
    # ------------------------------------------------------------------
    def _load_pointer_png(self):
        """PNG laden, skalieren und so einbetten, dass der Drehpunkt in der Bildmitte liegt."""
        pcfg = self.cfg["pointer"]
        img = Image.open(pcfg["png"]).convert("RGBA")
        scale = float(pcfg.get("png_scale", 1.0) or 1.0)
        pivot_x, pivot_y = (float(v) for v in pcfg["pivot"])
        if scale != 1.0:
            img = img.resize(
                (max(1, int(img.width * scale)), max(1, int(img.height * scale))),
                Image.LANCZOS,
            )
            pivot_x *= scale
            pivot_y *= scale

        # Leinwand in Videogroesse, Grafik so verschoben, dass der Drehpunkt
        # genau auf der Bildmitte sitzt. Danach kann um die Mitte gedreht werden.
        layer = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        layer.alpha_composite(
            img, (int(round(self.cx - pivot_x)), int(round(self.cy - pivot_y)))
        )
        return layer

    def _arrow_shape(self):
        """Eckpunkte des Pfeils relativ zum Drehpunkt (zeigt nach oben)."""
        if getattr(self, "_arrow_cache", None) is not None:
            return self._arrow_cache
        pcfg = self.cfg["pointer"]
        length = float(pcfg["length"])
        tail = float(pcfg["tail"])
        half = float(pcfg["width"]) / 2.0
        head_half = float(pcfg["head_width"]) / 2.0
        head_len = float(pcfg["head_length"])

        tip_y = -length
        base_y = tip_y + head_len          # Uebergang Schaft -> Spitze
        self._arrow_cache = [
            (0.0, tip_y),
            (head_half, base_y),
            (half, base_y),
            (half, tail),
            (-half, tail),
            (-half, base_y),
            (-head_half, base_y),
        ]
        return self._arrow_cache

    def _draw_pointer(self, canvas, angle_deg):
        """Zeiger um die Bildmitte drehen und aufsetzen."""
        pcfg = self.cfg["pointer"]
        rot = angle_deg - float(pcfg.get("base_angle", 0.0) or 0.0)

        if pcfg["type"] == "png":
            # PIL dreht gegen den Uhrzeigersinn, unsere Winkel laufen im Uhrzeigersinn.
            rotated = self._pointer_png.rotate(
                -rot, resample=Image.BICUBIC, center=(self.cx, self.cy)
            )
            canvas.alpha_composite(rotated, (0, 0))
        else:
            # Pfeil wird direkt als gedrehtes Polygon gezeichnet: schneller und
            # kantenschaerfer als eine Bilddrehung.
            rad = math.radians(rot)
            sin_a, cos_a = math.sin(rad), math.cos(rad)
            points = [
                (self.cx + x * cos_a - y * sin_a, self.cy + x * sin_a + y * cos_a)
                for x, y in self._arrow_shape()
            ]
            ImageDraw.Draw(canvas).polygon(points, fill=pcfg["color"])

        hub = float(pcfg.get("hub_radius", 0) or 0)
        if hub > 0:
            ImageDraw.Draw(canvas).ellipse(
                [self.cx - hub, self.cy - hub, self.cx + hub, self.cy + hub],
                fill=pcfg["hub_color"],
            )

    # ------------------------------------------------------------------
    # Frame
    # ------------------------------------------------------------------
    def render(self, layout, overlay=False):
        """Einen Frame aus einem FrameLayout zeichnen und als RGB-Bild zurueckgeben."""
        canvas = Image.new("RGBA", (self.width, self.height), self.cfg["background"])
        draw = ImageDraw.Draw(canvas)

        if self.cfg["layout"]["show_ring"]:
            r = self.radius
            draw.ellipse(
                [self.cx - r, self.cy - r, self.cx + r, self.cy + r],
                outline=self.cfg["layout"]["ring_color"],
                width=int(self.cfg["layout"]["ring_width"]),
            )

        # Koeder zuerst, Ziel danach - so liegt das Ziel bei Beruehrung obenauf.
        for i, angle in enumerate(layout.decoys):
            self._paste_label(
                canvas, self.decoy_text(i), self.decoy_color, angle,
                self._tilts.get(("decoy", i), 0.0),
            )
        for i, angle in enumerate(layout.targets):
            self._paste_label(
                canvas, self.cfg["target_label"], self.target_color, angle,
                self._tilts.get(("target", i), 0.0),
            )

        self._draw_pointer(canvas, layout.pointer)

        # Logo o.ae. liegt ueber dem Zeiger: der Pfeil kommt dahinter hervor.
        if self.center_image is not None:
            canvas.alpha_composite(
                self.center_image,
                (int(round(self.cx - self.center_image.width / 2)),
                 int(round(self.cy - self.center_image.height / 2))),
            )

        if self.headline_font is not None:
            self._draw_headline(canvas)

        if overlay:
            self._draw_overlay(canvas, layout)

        return canvas.convert("RGB")

    def _draw_headline(self, canvas):
        """Ueberschrift zentriert oben ins Bild setzen."""
        hcfg = self.cfg["headline"]
        ImageDraw.Draw(canvas).multiline_text(
            (self.width / 2, float(hcfg["y"])),
            hcfg["text"],
            font=self.headline_font,
            fill=hcfg["color"],
            anchor="ma",                     # waagrecht zentriert, oben verankert
            align="center",
            spacing=float(hcfg["line_spacing"]),
            stroke_width=int(hcfg["stroke_width"]),
            stroke_fill=hcfg["stroke_color"],
        )

    def _draw_overlay(self, canvas, layout):
        """Messhilfe fuer die Kontroll-PNGs: Zeigerstrahl, Frame-Nr., Abweichung."""
        draw = ImageDraw.Draw(canvas)
        x, y = self.point_at(layout.pointer, self.radius * 1.45)
        draw.line([(self.cx, self.cy), (x, y)], fill="#00A000", width=3)

        best = min(
            ((angle_delta(layout.pointer, a), a) for a in layout.targets),
            default=(float("nan"), float("nan")),
        )
        nearest_decoy = min(
            (angle_delta(layout.pointer, a) for a in layout.decoys), default=None
        )
        lines = [
            f"Frame {layout.index}",
            f"Zeiger {layout.pointer:7.2f} Grad",
            f"Ziel   {best[1]:7.2f} Grad",
            f"Abweichung {best[0]:.3f} Grad",
        ]
        if nearest_decoy is not None:
            lines.append(f"naechster Koeder {nearest_decoy:.2f} Grad")
        text = "\n".join(lines)
        draw.rectangle([24, 24, 24 + 560, 24 + 26 * len(lines) + 24], fill="#FFFFFF")
        draw.multiline_text((44, 44), text, font=self.small_font, fill="#000000", spacing=8)


def check_label_overlap(renderer, layout):
    """Grobe Pruefung, ob sich Labels auf dem Ring ueberlappen.

    Gerechnet wird mit der tangentialen Ausdehnung der fertig gedrehten
    Textbilder: ueberlappen zwei benachbarte Labels, liegt ihre Winkeldistanz
    unter der Summe ihrer halben Winkelbreiten. Rueckgabe: Warntext oder None.
    """
    cfg = renderer.cfg
    items = [(a, cfg["target_label"]) for a in layout.targets]
    items += [(a, renderer.decoy_text(i)) for i, a in enumerate(layout.decoys)]
    if len(items) < 2:
        return None

    spans = []
    for angle, text in items:
        rotation = renderer._text_rotation(angle)
        image = renderer._label_image(
            text,
            renderer.target_color if text == cfg["target_label"] else renderer.decoy_color,
            rotation,
        )
        # Ausdehnung quer zum Radius (tangential) bestimmt den Platzbedarf im Ring.
        rad = math.radians(angle)
        extent = image.width * abs(math.cos(rad)) + image.height * abs(math.sin(rad))
        half_deg = math.degrees(math.atan2(extent / 2.0, renderer.radius))
        spans.append((norm360(angle), half_deg))

    spans.sort(key=lambda s: s[0])
    worst = None
    for i, (angle, half) in enumerate(spans):
        next_angle, next_half = spans[(i + 1) % len(spans)]
        gap = norm360(next_angle - angle) or 360.0
        overlap = (half + next_half) - gap
        if overlap > 0 and (worst is None or overlap > worst):
            worst = overlap

    if worst is None:
        return None
    return (
        f"Labels ueberlappen sich um bis zu {worst:.1f} Grad. Abhilfe: "
        "font.size verkleinern, layout.radius erhoehen, decoy_count senken "
        "oder font.orientation auf 'radial' stellen."
    )
