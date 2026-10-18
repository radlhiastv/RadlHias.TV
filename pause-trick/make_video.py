#!/usr/bin/env python3
"""Pause-Trick-Video fuer Instagram Reels bauen.

Aufruf:
    python make_video.py --config config.yaml

Ablauf:
    1. Config laden und pruefen
    2. Zeigerwinkel je Frame aus der Geschwindigkeitskurve berechnen
    3. Label-Positionen je Frame bestimmen (Ziel liegt immer unter dem Zeiger)
    4. Frames einzeln rendern (keine Interpolation, kein Blur)
    5. Winkel nach output/angles.json schreiben
    6. MP4 per ffmpeg exportieren
    7. Pruefung laufen lassen (Winkelkontrolle + Stichproben-PNGs)
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time

from pausetrick.config import load_config, warn
from pausetrick.geometry import build_layouts, frame_count, pointer_angles
from pausetrick.render import Renderer, check_label_overlap
from pausetrick.verify import (
    auto_clearance, check_angles, export_samples, report, save_angles,
)
from pausetrick.video import encode


def parse_args():
    parser = argparse.ArgumentParser(
        description="Pause-Trick-Video (9:16) rendern und als MP4 exportieren."
    )
    parser.add_argument("--config", default="config.yaml", help="Pfad zur config.yaml")
    parser.add_argument("--out", default=None, help="Ziel-MP4 (Standard: output/pause_trick.mp4)")
    parser.add_argument("--no-encode", action="store_true",
                        help="nur Frames rendern, kein ffmpeg-Export")
    parser.add_argument("--no-check", action="store_true",
                        help="Pruefung nach dem Rendern ueberspringen")
    parser.add_argument("--keep-frames", action="store_true",
                        help="PNG-Sequenz nach dem Export behalten")
    return parser.parse_args()


def main():
    args = parse_args()
    cfg = load_config(args.config)

    out_dir = cfg["output_dir"]
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    # Alte Frames weg, sonst mischt ffmpeg Reste eines laengeren Durchlaufs dazu.
    for name in os.listdir(frames_dir):
        if name.startswith("frame_") and name.endswith(".png"):
            os.remove(os.path.join(frames_dir, name))

    total = frame_count(cfg)
    print(f"Modus: {cfg['mode']}, Drehrichtung: {cfg['direction']}")
    print(f"{total} Frames bei {cfg['video']['fps']} fps "
          f"({cfg['video']['duration']} s, "
          f"{cfg['video']['width']}x{cfg['video']['height']})")

    # 2 + 3: Winkel und Layouts
    angles, angle_warnings = pointer_angles(cfg, total)
    layouts, layout_warnings = build_layouts(cfg, angles)
    for message in angle_warnings + layout_warnings:
        warn(message)

    # 4: Frames rendern
    renderer = Renderer(cfg)

    # Stichprobenartig pruefen, ob sich Labels ins Gehege kommen.
    for probe in {0, total // 2, total - 1}:
        message = check_label_overlap(renderer, layouts[probe])
        if message:
            warn(message)
            break

    started = time.time()
    for layout in layouts:
        image = renderer.render(layout)
        image.save(os.path.join(frames_dir, f"frame_{layout.index:06d}.png"))
        if layout.index % 30 == 0 or layout.index == total - 1:
            done = layout.index + 1
            print(f"  Frame {done}/{total} ({done * 100 // total} %)", end="\r", flush=True)
    print(f"\nRendern fertig in {time.time() - started:.1f} s")

    # 5: Winkel sichern (Basis der Pruefung)
    angles_path = save_angles(os.path.join(out_dir, "angles.json"), cfg, layouts, total)
    print(f"Winkel gespeichert: {angles_path}")

    # 6: Export
    out_path = args.out or os.path.join(out_dir, "pause_trick.mp4")
    if args.no_encode:
        print("ffmpeg-Export uebersprungen (--no-encode).")
    else:
        encode(cfg, frames_dir, out_path, total)
        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        print(f"Video geschrieben: {out_path} ({size_mb:.1f} MB)")
        if not args.keep_frames:
            shutil.rmtree(frames_dir, ignore_errors=True)

    # 7: Pruefung
    if args.no_check:
        print("Pruefung uebersprungen (--no-check). "
              "Bitte spaeter: python check_frames.py --config config.yaml")
        return 0

    data = {
        "meta": {"frame_count": total},
        "frames": [layout.to_dict() for layout in layouts],
    }
    result = check_angles(
        data, float(cfg["check"]["tolerance"]), auto_clearance(cfg)
    )
    samples = export_samples(
        cfg, data, os.path.join(out_dir, "check"),
        int(cfg["check"]["sample_count"]), overlay=bool(cfg["check"]["overlay"]),
    )
    return 0 if report(result, samples) else 1


if __name__ == "__main__":
    sys.exit(main())
