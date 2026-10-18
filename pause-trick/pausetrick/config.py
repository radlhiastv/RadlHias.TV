"""Laden, Ergaenzen und Pruefen der Konfiguration (config.yaml).

Die Konfiguration wird einmal geladen und als verschachteltes dict
weitergegeben. Fehlende Werte werden mit den Standardwerten aus DEFAULTS
aufgefuellt, damit die config.yaml kurz bleiben darf.
"""

from __future__ import annotations

import copy
import os
import sys

import yaml

# ---------------------------------------------------------------------------
# Standardwerte. Alles, was in der config.yaml fehlt, kommt von hier.
# ---------------------------------------------------------------------------
DEFAULTS = {
    # Texte und Anzahl der Labels
    "target_label": "TREFFER",
    # Koeder-Text: ein String oder eine Liste; eine Liste wird der Reihe nach
    # auf die Koeder-Plaetze verteilt (z.B. zwei verschiedene Koeder-Texte).
    "decoy_label": "DANEBEN",
    "target_count": 1,
    "decoy_count": 7,

    # Video
    "video": {
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "duration": 8.0,          # Sekunden
        "crf": 18,                # H.264 Qualitaet (kleiner = besser)
        "preset": "medium",
        "audio": None,            # Pfad zu einer Audiodatei oder null
        "audio_bitrate": "192k",
    },

    # Bewegung
    "mode": "follow",             # "follow" oder "jump"
    # Modus "jump": Mindestzahl an Rasterspruengen pro Frame. 1 = der Zeiger
    # springt garantiert jeden Frame weiter. 0 = er darf auf einem Ziel stehen
    # bleiben (wie in vielen Vorlagen-Videos) - der Trick haelt trotzdem.
    "jump_min_step": 1,
    "direction": "cw",            # "cw" (im Uhrzeigersinn) oder "ccw"
    "start_angle": 0.0,           # 0 Grad = 12 Uhr
    # Geschwindigkeitskurve: Stuetzpunkte ueber die normierte Zeit t (0..1),
    # Wert in Grad pro Sekunde. Zwischen den Punkten wird linear interpoliert.
    "speed_curve": [
        {"t": 0.0, "dps": 1440},
        {"t": 0.55, "dps": 1080},
        {"t": 1.0, "dps": 220},
    ],

    # Ring / Layout
    "layout": {
        "radius": 360,            # Abstand Labelmitte zur Bildmitte in Pixel
        "center_y_offset": 0,     # Ring nach oben/unten verschieben
        "min_separation": 14.0,   # Mindestabstand Koeder <-> Ziel in Grad
        "decoy_mode": "ring",     # "ring" (Koeder wandern mit) oder "fixed"
        "base_offset": 0.0,       # Grunddrehung des Label-Rings in Grad
        "show_ring": False,       # dezenten Kreis mitzeichnen
        "ring_color": "#DDDDDD",
        "ring_width": 4,
    },

    # Zeiger
    "pointer": {
        "type": "arrow",          # "arrow" oder "png"
        "png": None,              # Pfad zur PNG mit transparentem Hintergrund
        "pivot": [0, 0],          # Drehpunkt in Pixelkoordinaten der PNG
        "png_scale": 1.0,         # PNG skalieren
        "base_angle": 0.0,        # Grad, um die die PNG-Grafik schon gedreht ist
        "length": 300,            # Pfeillaenge in Pixel (nur "arrow")
        "tail": 60,               # Laenge hinter der Mitte (nur "arrow")
        "width": 34,              # Schaftbreite (nur "arrow")
        "head_width": 96,         # Breite der Pfeilspitze (nur "arrow")
        "head_length": 110,       # Laenge der Pfeilspitze (nur "arrow")
        "color": "#EC5323",
        "hub_radius": 26,         # Kreis in der Mitte, 0 = aus
        "hub_color": "#0D62A8",
    },

    # Typografie
    "font": {
        "path": None,             # TTF-Pfad; null = Automatik-Fallback
        "size": 64,
        "color": "#1a1a1a",
        "decoy_color": None,      # null = gleiche Farbe wie Ziel
        "stroke_width": 0,
        "stroke_color": "#FFFFFF",
        "orientation": "radial",  # "radial", "tangential" oder "upright"
        "orientation_strength": 1.0,  # 0 = komplett waagrecht, 1 = volle Drehung
        "jitter": True,           # leichte Schraegstellung fuer Handmade-Look
        "jitter_max": 6.0,        # maximale Schraegstellung in Grad
    },

    # Ueberschrift oben im Bild (null = keine)
    "headline": {
        "text": None,
        "font_path": None,        # eigener TTF-Pfad; null = font.path
        "size": 96,
        "color": "#1a1a1a",
        "y": 300,                 # Oberkante in Pixel
        "line_spacing": 10,
        "stroke_width": 0,
        "stroke_color": "#FFFFFF",
    },

    # Statische Grafik in der Bildmitte (z.B. Logo), liegt ueber dem Zeiger
    "center_image": {
        "path": None,
        "width": 260,             # Zielbreite in Pixel (Hoehe proportional)
    },

    "background": "#F5F3F1",
    "seed": 42,                   # Zufallsbasis fuer die Schraegstellung

    # Pruefung
    "check": {
        "tolerance": 3.0,         # erlaubte Abweichung Zeiger <-> Ziel in Grad
        "decoy_clearance": None,  # Mindestabstand Zeiger <-> Koeder; null = auto
        "sample_count": 10,       # Anzahl der PNG-Stichproben
        "overlay": True,          # Messlinie + Werte in die Stichproben zeichnen
    },

    "output_dir": "output",
}

# Schriften, die als Notnagel probiert werden, wenn font.path leer ist.
FONT_FALLBACKS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def _merge(base, override):
    """Rekursives Zusammenfuehren zweier dicts (override gewinnt)."""
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = value
    return out


def load_config(path):
    """config.yaml einlesen, mit Standardwerten auffuellen und pruefen."""
    with open(path, "r", encoding="utf-8") as handle:
        user_cfg = yaml.safe_load(handle) or {}
    if not isinstance(user_cfg, dict):
        raise ValueError(f"{path}: oberste Ebene muss ein YAML-Mapping sein.")

    cfg = _merge(DEFAULTS, user_cfg)

    # Pfade relativ zur config.yaml aufloesen, damit der Aufruf von ueberall klappt.
    cfg_dir = os.path.dirname(os.path.abspath(path))
    cfg["_config_dir"] = cfg_dir
    cfg["output_dir"] = _resolve(cfg_dir, cfg["output_dir"])
    if cfg["video"].get("audio"):
        cfg["video"]["audio"] = _resolve(cfg_dir, cfg["video"]["audio"])
    if cfg["pointer"].get("png"):
        cfg["pointer"]["png"] = _resolve(cfg_dir, cfg["pointer"]["png"])
    if cfg["font"].get("path"):
        cfg["font"]["path"] = _resolve(cfg_dir, cfg["font"]["path"])
    if cfg["headline"].get("font_path"):
        cfg["headline"]["font_path"] = _resolve(cfg_dir, cfg["headline"]["font_path"])
    if cfg["center_image"].get("path"):
        cfg["center_image"]["path"] = _resolve(cfg_dir, cfg["center_image"]["path"])

    _validate(cfg)
    return cfg


def _resolve(base_dir, path):
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(base_dir, path))


def _validate(cfg):
    """Harte Fehler sofort melden, weiche Sachen als Warnung ausgeben."""
    if cfg["mode"] not in ("follow", "jump"):
        raise ValueError("mode muss 'follow' oder 'jump' sein.")
    if cfg["direction"] not in ("cw", "ccw"):
        raise ValueError("direction muss 'cw' oder 'ccw' sein.")
    if int(cfg["target_count"]) < 1:
        raise ValueError("target_count muss mindestens 1 sein.")
    if int(cfg["decoy_count"]) < 0:
        raise ValueError("decoy_count darf nicht negativ sein.")
    if cfg["layout"]["decoy_mode"] not in ("ring", "fixed"):
        raise ValueError("layout.decoy_mode muss 'ring' oder 'fixed' sein.")
    if cfg["font"]["orientation"] not in ("radial", "tangential", "upright"):
        raise ValueError("font.orientation muss 'radial', 'tangential' oder 'upright' sein.")
    if cfg["pointer"]["type"] not in ("arrow", "png"):
        raise ValueError("pointer.type muss 'arrow' oder 'png' sein.")
    center = cfg["center_image"].get("path")
    if center:
        if not os.path.isfile(center):
            warn(f"center_image nicht gefunden, wird weggelassen: {center}")
            cfg["center_image"]["path"] = None
    if cfg["pointer"]["type"] == "png":
        png = cfg["pointer"].get("png")
        if not png:
            raise ValueError("pointer.type = png verlangt pointer.png (Pfad zur Grafik).")
        if not os.path.isfile(png):
            raise FileNotFoundError(f"Zeiger-Grafik nicht gefunden: {png}")
    if cfg["video"]["fps"] <= 0 or cfg["video"]["duration"] <= 0:
        raise ValueError("video.fps und video.duration muessen groesser 0 sein.")

    curve = cfg["speed_curve"]
    if not curve:
        raise ValueError("speed_curve darf nicht leer sein.")
    for point in curve:
        if "t" not in point or "dps" not in point:
            raise ValueError("Jeder speed_curve-Punkt braucht 't' und 'dps'.")

    audio = cfg["video"].get("audio")
    if audio and not os.path.isfile(audio):
        warn(f"Audiodatei nicht gefunden, Video wird ohne Ton gebaut: {audio}")
        cfg["video"]["audio"] = None


def resolve_font_path(cfg):
    """TTF-Pfad bestimmen: erst Config, dann Fallback-Liste."""
    wanted = cfg["font"].get("path")
    if wanted:
        if os.path.isfile(wanted):
            return wanted
        warn(f"Schriftart nicht gefunden ({wanted}) - suche Ersatz.")
    for candidate in FONT_FALLBACKS:
        if os.path.isfile(candidate):
            if wanted:
                warn(f"Ersatzschrift wird verwendet: {candidate}")
            return candidate
    raise FileNotFoundError(
        "Keine TTF-Schrift gefunden. Bitte font.path in der config.yaml setzen."
    )


def warn(message):
    """Warnung nach stderr - faellt im Terminal auf, bricht aber nichts ab."""
    print(f"WARNUNG: {message}", file=sys.stderr)
