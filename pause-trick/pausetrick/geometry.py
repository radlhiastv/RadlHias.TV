"""Winkelmathematik: Geschwindigkeitskurve, Zeigerwinkel, Label-Positionen.

Winkelkonvention im gesamten Projekt:
  0 Grad  = 12 Uhr (oben)
  positiv = im Uhrzeigersinn
Umrechnung in Pixel passiert erst in render.py.

Hier entsteht der "Vertrag" des Tricks: fuer jeden Frame wird ein Layout
gebaut, in dem der Zeigerwinkel per Konstruktion mit einem Ziel-Label
zusammenfaellt. Dieselben Daten landen in angles.json und werden vom
Pruefskript unabhaengig nachgerechnet.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict


@dataclass
class FrameLayout:
    """Alles, was ein einzelner Frame geometrisch braucht."""
    index: int
    pointer: float                       # Zeigerwinkel in Grad
    targets: list = field(default_factory=list)   # Winkel der Ziel-Labels
    decoys: list = field(default_factory=list)    # Winkel der Koeder-Labels

    def to_dict(self):
        return asdict(self)


def norm180(angle):
    """Winkel auf das Intervall (-180, 180] normieren."""
    angle = (angle + 180.0) % 360.0 - 180.0
    return angle + 360.0 if angle <= -180.0 else angle


def norm360(angle):
    """Winkel auf [0, 360) normieren."""
    return angle % 360.0


def angle_delta(a, b):
    """Kleinster absoluter Winkelabstand zwischen a und b in Grad."""
    return abs(norm180(a - b))


# ---------------------------------------------------------------------------
# Geschwindigkeitskurve
# ---------------------------------------------------------------------------
def speed_at(curve, t):
    """Grad pro Sekunde zum normierten Zeitpunkt t (0..1), linear interpoliert."""
    points = sorted(((float(p["t"]), float(p["dps"])) for p in curve), key=lambda p: p[0])
    if t <= points[0][0]:
        return points[0][1]
    if t >= points[-1][0]:
        return points[-1][1]
    for (t0, v0), (t1, v1) in zip(points, points[1:]):
        if t0 <= t <= t1:
            if t1 == t0:
                return v1
            share = (t - t0) / (t1 - t0)
            return v0 + (v1 - v0) * share
    return points[-1][1]


# ---------------------------------------------------------------------------
# Zeigerwinkel pro Frame
# ---------------------------------------------------------------------------
def pointer_angles(cfg, frame_count):
    """Liste der Zeigerwinkel je Frame plus Warnhinweise.

    Rueckgabe: (angles, warnings)
    """
    fps = float(cfg["video"]["fps"])
    sign = 1.0 if cfg["direction"] == "cw" else -1.0
    curve = cfg["speed_curve"]
    warnings = []

    angle = float(cfg["start_angle"])
    angles = []

    if cfg["mode"] == "follow":
        # Kontinuierliche Drehung: Winkel wird Frame fuer Frame aufintegriert.
        for i in range(frame_count):
            angles.append(norm360(angle))
            t = i / max(frame_count - 1, 1)
            angle += sign * speed_at(curve, t) / fps
        return angles, warnings

    # Modus "jump": der Zeiger darf nur auf Ziel-Rastern stehen.
    slot = 360.0 / int(cfg["target_count"])
    min_step = int(cfg.get("jump_min_step", 1))
    too_slow = []
    exact = angle          # ungerasterter Winkel, nur zum Mitzaehlen
    hold = 0               # wie lange steht der Zeiger schon auf demselben Raster
    longest_hold = 0
    last = None
    for i in range(frame_count):
        if min_step >= 1:
            angles.append(norm360(angle))
        else:
            # Kurve exakt verfolgen und auf das naechste Ziel-Raster runden:
            # dadurch darf der Zeiger auch mal 2-3 Frames stehen bleiben.
            snapped = round(exact / slot) * slot
            angles.append(norm360(snapped))
            hold = hold + 1 if snapped == last else 1
            longest_hold = max(longest_hold, hold)
            last = snapped

        t = i / max(frame_count - 1, 1)
        wanted_step = speed_at(curve, t) / fps      # gewuenschter Schritt in Grad
        exact += sign * wanted_step
        steps = int(round(wanted_step / slot))
        if steps < min_step:
            # Weniger als ein Sprung pro Frame wuerde den Trick auffliegen lassen:
            # der Zeiger wuerde sichtbar stehen bleiben. Wir erzwingen min_step.
            steps = min_step
            too_slow.append(i)
        angle += sign * steps * slot

    if min_step < 1:
        # Kein erzwungener Sprung: stattdessen warnen, wenn er zu lange steht.
        too_slow = []
        if longest_hold > 3:
            warnings.append(
                f"Modus 'jump' mit jump_min_step: 0 - der Zeiger steht bis zu "
                f"{longest_hold} Frames auf derselben Position. Ab etwa 4 Frames "
                "sieht man das Stehenbleiben. Abhilfe: speed_curve am Ende "
                "erhoehen oder jump_min_step auf 1 setzen."
            )

    if too_slow:
        warnings.append(
            "Modus 'jump': die Geschwindigkeitskurve verlangt in "
            f"{len(too_slow)} von {frame_count} Frames weniger als einen Sprung "
            f"pro Frame (Rasterweite {slot:.1f} Grad bei {cfg['target_count']} "
            f"Ziel-Labels, erster betroffener Frame: {too_slow[0]}). "
            "Es wird auf 1 Sprung pro Frame aufgerundet - der Zeiger springt "
            "dort schneller als gewuenscht. Abhilfe: speed_curve erhoehen "
            f"(mindestens {slot * float(cfg['video']['fps']):.0f} dps) oder "
            "target_count erhoehen."
        )
    return angles, warnings


# ---------------------------------------------------------------------------
# Label-Positionen
# ---------------------------------------------------------------------------
def _spread_decoys(target_angles, decoy_count, min_separation):
    """Koeder gleichmaessig in die Luecken zwischen den Zielen legen.

    Rueckgabe: (decoy_angles, kleinster_abstand_zu_einem_ziel)
    """
    if decoy_count <= 0:
        return [], None

    ordered = sorted(norm360(a) for a in target_angles)
    # Luecken zwischen aufeinanderfolgenden Zielen (zyklisch).
    gaps = []
    for i, start in enumerate(ordered):
        end = ordered[(i + 1) % len(ordered)]
        size = norm360(end - start) or 360.0
        gaps.append((start, size))

    # Koeder per Round-Robin auf die Luecken verteilen (grosse Luecken zuerst).
    order = sorted(range(len(gaps)), key=lambda i: -gaps[i][1])
    per_gap = [0] * len(gaps)
    for n in range(decoy_count):
        per_gap[order[n % len(order)]] += 1

    decoys = []
    smallest = 360.0
    for (start, size), count in zip(gaps, per_gap):
        if count == 0:
            continue
        step = size / (count + 1)        # Luecke in count+1 gleiche Teile
        smallest = min(smallest, step)
        for j in range(count):
            decoys.append(norm360(start + step * (j + 1)))
    return decoys, smallest


def build_layouts(cfg, angles):
    """Fuer jeden Frame ein FrameLayout bauen. Rueckgabe: (layouts, warnings)."""
    warnings = []
    target_count = int(cfg["target_count"])
    decoy_count = int(cfg["decoy_count"])
    min_sep = float(cfg["layout"]["min_separation"])
    base = float(cfg["layout"]["base_offset"])
    layouts = []

    if cfg["mode"] == "jump":
        # Feste Ziel-Raster, Koeder fest in den Luecken. Der Zeiger steht
        # immer exakt auf einem Rasterpunkt (siehe pointer_angles).
        slot = 360.0 / target_count
        targets = [norm360(base + i * slot) for i in range(target_count)]
        decoys, smallest = _spread_decoys(targets, decoy_count, min_sep)
        if smallest is not None and smallest < min_sep:
            warnings.append(
                f"Modus 'jump': Koeder liegen nur {smallest:.1f} Grad von den "
                f"Zielen entfernt (gefordert: {min_sep:.1f} Grad). "
                "decoy_count senken oder target_count erhoehen."
            )
        for i, pointer in enumerate(angles):
            layouts.append(FrameLayout(i, pointer, list(targets), list(decoys)))
        return layouts, warnings

    # Modus "follow": das Ziel-Label wandert exakt mit dem Zeiger.
    if cfg["layout"]["decoy_mode"] == "ring":
        # Ziele gleichmaessig verteilt, erstes Ziel genau unter dem Zeiger;
        # Koeder wandern in den Luecken mit -> garantiert keine Ueberlappung.
        spacing = 360.0 / target_count
        smallest_seen = 360.0
        for i, pointer in enumerate(angles):
            targets = [norm360(pointer + k * spacing) for k in range(target_count)]
            decoys, smallest = _spread_decoys(targets, decoy_count, min_sep)
            if smallest is not None:
                smallest_seen = min(smallest_seen, smallest)
            layouts.append(FrameLayout(i, pointer, targets, decoys))
        if decoy_count and smallest_seen < min_sep:
            warnings.append(
                f"Modus 'follow': Koeder liegen nur {smallest_seen:.1f} Grad vom "
                f"Ziel entfernt (gefordert: {min_sep:.1f} Grad). "
                "decoy_count senken oder target_count erhoehen."
            )
        return layouts, warnings

    # decoy_mode = "fixed": Koeder stehen auf festen Rasterplaetzen und werden
    # nur weggeschoben, wenn das wandernde Ziel-Label ihnen zu nahe kommt.
    slots = target_count + decoy_count
    spacing = 360.0 / max(slots, 1)
    fixed = [norm360(base + k * spacing) for k in range(decoy_count)]
    if decoy_count and spacing < min_sep:
        warnings.append(
            f"Modus 'follow'/fixed: Rasterweite {spacing:.1f} Grad liegt unter "
            f"min_separation {min_sep:.1f} Grad - Koeder werden sichtbar "
            "verschoben. decoy_count senken."
        )
    extra_spacing = 360.0 / target_count
    for i, pointer in enumerate(angles):
        targets = [norm360(pointer + k * extra_spacing) for k in range(target_count)]
        decoys = []
        for slot_angle in fixed:
            angle = slot_angle
            for target in targets:
                delta = norm180(angle - target)
                if abs(delta) < min_sep:
                    # auf die gleiche Seite, aber auf Mindestabstand schieben
                    push = min_sep if delta >= 0 else -min_sep
                    angle = norm360(target + push)
            decoys.append(angle)
        layouts.append(FrameLayout(i, pointer, targets, decoys))
    return layouts, warnings


def frame_count(cfg):
    """Anzahl der Frames aus Dauer und fps."""
    return max(1, int(round(float(cfg["video"]["duration"]) * float(cfg["video"]["fps"]))))
