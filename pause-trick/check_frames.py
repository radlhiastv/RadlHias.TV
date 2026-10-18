#!/usr/bin/env python3
"""Pruefskript: kontrolliert jeden Frame anhand der gespeicherten Winkel.

Aufruf:
    python check_frames.py --config config.yaml

Geprueft wird:
  1. Liegt in JEDEM Frame ein Ziel-Label innerhalb der Toleranz unter dem Zeiger?
  2. Liegt kein Koeder-Label zu nah am Zeiger (sonst waere die Sache zweideutig)?
Zusaetzlich werden zufaellige Frames als PNG nach output/check/ exportiert.
Rueckgabewert: 0 = alles in Ordnung, 1 = Fehler (Frame-Nummern stehen im Bericht).
"""

from __future__ import annotations

import argparse
import os
import sys

from pausetrick.config import load_config
from pausetrick.verify import (
    auto_clearance, check_angles, export_samples, load_angles, report,
)


def main():
    parser = argparse.ArgumentParser(description="Pause-Trick-Video pruefen.")
    parser.add_argument("--config", default="config.yaml", help="Pfad zur config.yaml")
    parser.add_argument("--angles", default=None,
                        help="Pfad zu angles.json (Standard: output/angles.json)")
    parser.add_argument("--tolerance", type=float, default=None,
                        help="Toleranz in Grad (ueberschreibt die Config)")
    parser.add_argument("--samples", type=int, default=None,
                        help="Anzahl der Stichproben-PNGs")
    parser.add_argument("--no-overlay", action="store_true",
                        help="Stichproben ohne Messlinie und Zahlen rendern")
    args = parser.parse_args()

    cfg = load_config(args.config)
    angles_path = args.angles or os.path.join(cfg["output_dir"], "angles.json")
    if not os.path.isfile(angles_path):
        print(f"FEHLER: {angles_path} fehlt. Bitte erst make_video.py laufen lassen.",
              file=sys.stderr)
        return 2

    data = load_angles(angles_path)
    tolerance = args.tolerance if args.tolerance is not None else float(cfg["check"]["tolerance"])
    result = check_angles(data, tolerance, auto_clearance(cfg))

    samples = export_samples(
        cfg, data, os.path.join(cfg["output_dir"], "check"),
        args.samples if args.samples is not None else int(cfg["check"]["sample_count"]),
        overlay=not args.no_overlay and bool(cfg["check"]["overlay"]),
    )
    return 0 if report(result, samples) else 1


if __name__ == "__main__":
    sys.exit(main())
