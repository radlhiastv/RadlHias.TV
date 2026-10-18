"""Pruefung: zeigt der Zeiger in JEDEM Frame auf ein Ziel-Label?

Geprueft wird gegen die beim Rendern gespeicherten Winkel (angles.json).
Zusaetzlich werden Stichproben als PNG exportiert, damit man es auch mit
eigenen Augen kontrollieren kann.
"""

from __future__ import annotations

import json
import os
import random

from .geometry import FrameLayout, angle_delta


def load_angles(path):
    """angles.json einlesen."""
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def save_angles(path, cfg, layouts, frame_count):
    """Winkel aller Frames speichern - Grundlage fuer die Pruefung."""
    data = {
        "meta": {
            "mode": cfg["mode"],
            "direction": cfg["direction"],
            "fps": cfg["video"]["fps"],
            "duration": cfg["video"]["duration"],
            "frame_count": frame_count,
            "width": cfg["video"]["width"],
            "height": cfg["video"]["height"],
            "target_label": cfg["target_label"],
            "decoy_label": cfg["decoy_label"],
            "target_count": cfg["target_count"],
            "decoy_count": cfg["decoy_count"],
            "tolerance": cfg["check"]["tolerance"],
        },
        "frames": [layout.to_dict() for layout in layouts],
    }
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=1)
    return path


def check_angles(data, tolerance, clearance):
    """Alle Frames rechnerisch pruefen.

    Rueckgabe: dict mit Fehlerlisten und Kennzahlen.
    """
    miss = []        # Zeiger zeigt auf kein Ziel
    ambiguous = []   # ein Koeder liegt zu nah am Zeiger
    worst = (-1.0, None)

    for frame in data["frames"]:
        pointer = frame["pointer"]
        targets = frame["targets"]
        decoys = frame.get("decoys") or []

        best = min((angle_delta(pointer, a) for a in targets), default=999.0)
        if best > worst[0]:
            worst = (best, frame["index"])
        if best > tolerance:
            miss.append((frame["index"], best))

        if decoys:
            nearest_decoy = min(angle_delta(pointer, a) for a in decoys)
            if nearest_decoy < clearance or nearest_decoy <= best:
                ambiguous.append((frame["index"], nearest_decoy))

    return {
        "frame_count": len(data["frames"]),
        "miss": miss,
        "ambiguous": ambiguous,
        "worst_deviation": worst[0],
        "worst_frame": worst[1],
        "tolerance": tolerance,
        "clearance": clearance,
    }


def export_samples(cfg, data, out_dir, count, overlay=True, seed=None):
    """count zufaellige Frames neu rendern und als PNG ablegen.

    Das Rendern ist deterministisch (nur Seed, keine Laufzeit-Zufaelle),
    die Stichproben zeigen also exakt das, was im Video steckt.
    """
    from .render import Renderer      # spaeter importieren: Pillow nur wenn gebraucht

    frames = data["frames"]
    if not frames:
        return []
    rnd = random.Random(cfg["seed"] if seed is None else seed)
    picks = sorted(rnd.sample(range(len(frames)), min(count, len(frames))))

    os.makedirs(out_dir, exist_ok=True)
    renderer = Renderer(cfg)
    written = []
    for index in picks:
        frame = frames[index]
        layout = FrameLayout(
            frame["index"], frame["pointer"], frame["targets"], frame.get("decoys") or []
        )
        path = os.path.join(out_dir, f"check_{frame['index']:06d}.png")
        renderer.render(layout, overlay=overlay).save(path)
        written.append(path)
    return written


def report(result, sample_paths):
    """Ergebnis im Terminal ausgeben. Rueckgabe: True = alles in Ordnung."""
    ok = not result["miss"] and not result["ambiguous"]
    print("")
    print("Pruefung")
    print("--------")
    print(f"Frames geprueft:      {result['frame_count']}")
    print(f"Toleranz:             {result['tolerance']} Grad")
    print(f"Mindestabstand Koeder: {result['clearance']} Grad")
    print(
        f"groesste Abweichung:  {result['worst_deviation']:.4f} Grad "
        f"(Frame {result['worst_frame']})"
    )

    if result["miss"]:
        print(f"\nFEHLER: {len(result['miss'])} Frame(s) ohne Ziel unter dem Zeiger:")
        _print_frames(result["miss"])
    if result["ambiguous"]:
        print(f"\nFEHLER: {len(result['ambiguous'])} Frame(s), in denen ein Koeder zu nah liegt:")
        _print_frames(result["ambiguous"])

    if sample_paths:
        print(f"\n{len(sample_paths)} Stichproben-PNG(s) geschrieben:")
        for path in sample_paths:
            print(f"  {path}")

    print("\n" + ("ERGEBNIS: OK - der Zeiger trifft in jedem Frame ein Ziel-Label."
                  if ok else
                  "ERGEBNIS: FEHLGESCHLAGEN - siehe Frame-Liste oben."))
    return ok


def _print_frames(items, limit=25):
    for index, value in items[:limit]:
        print(f"  Frame {index}: {value:.3f} Grad")
    if len(items) > limit:
        print(f"  ... und {len(items) - limit} weitere")


def auto_clearance(cfg):
    """Mindestabstand Zeiger <-> Koeder: aus Config oder automatisch."""
    configured = cfg["check"].get("decoy_clearance")
    if configured:
        return float(configured)
    return max(float(cfg["check"]["tolerance"]) * 2.0, 8.0)
