#!/usr/bin/env python3
"""
RadlHias Reel-Vorlage - AUFBAUENDE LISTE
==========================================
Zweite Reel-Vorlage neben radlhias_yepp_subtitle: mehrere Text-Bloecke
erscheinen nacheinander (Zeile fuer Zeile getimt) und bleiben stehen,
statt wie beim Yepp-Stil wortweise zu pulsieren. Look angelehnt an ein
Vorbild-Reel: weisse Schrift mit kraeftiger schwarzer Kontur, zentriert,
kein Filmkorn, keine Neigung. Jeder Block waechst von oben nach unten
in die Mitte des sicheren Textbereichs.

Verwendung:
    python3 make_list_reel.py <video.mp4> <output.mp4> <blocks.json>

blocks.json:
    [
      {"start": 0.0, "lines": ["dein Zahnarzt:", "„Du putzt falsch“"]},
      {"start": 2.6, "lines": ["dein Arzt:", "„Du isst falsch“"]}
    ]
    "start" = Sekunde, ab der der Block erscheint (bleibt bis Videoende stehen).
    "lines" = vorformatierte Zeilen (werden zusaetzlich automatisch umgebrochen,
              falls eine Zeile breiter als der sichere Textbereich ist).

Assets (im selben Skill-Ordner):
    Barlow-ExtraBold.ttf
"""
import os
import sys
import json
import argparse
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 24
SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(SKILL_ROOT, "assets", "Barlow-ExtraBold.ttf")

CREAM = (0xF5, 0xF1, 0xEB, 255)
DARK = (0x0A, 0x0A, 0x0A, 255)

MAX_TEXT_W = 900
TOP_Y = 160
FONT_SIZE = 58
STROKE_W = 9
LINE_GAP = 14
BLOCK_GAP = 46
FADE_IN = 0.18


def wrap_line(line, font, max_w):
    words = line.split()
    if not words:
        return [line]
    out, cur = [], words[0]
    for w in words[1:]:
        cand = cur + " " + w
        if font.getlength(cand) <= max_w:
            cur = cand
        else:
            out.append(cur)
            cur = w
    out.append(cur)
    return out


def build_layout(blocks, font):
    """Berechnet fuer jeden Block seine (umgebrochenen) Zeilen + Gesamthoehe."""
    asc, desc = font.getmetrics()
    line_h = asc + desc
    laid_out = []
    for b in blocks:
        lines = []
        for raw in b["lines"]:
            lines.extend(wrap_line(raw, font, MAX_TEXT_W))
        block_h = len(lines) * line_h + (len(lines) - 1) * LINE_GAP
        laid_out.append({"start": b["start"], "lines": lines, "h": block_h})
    return laid_out, line_h, asc


def draw_line(draw, text, cy, font, asc, fill_alpha):
    w = font.getlength(text)
    x = (W - w) / 2
    fill = (*CREAM[:3], fill_alpha)
    stroke = (*DARK[:3], fill_alpha)
    draw.text((x, cy), text, font=font, fill=fill, stroke_width=STROKE_W, stroke_fill=stroke)


def render_frame(t, laid_out, line_h, asc):
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    y = TOP_Y
    for block in laid_out:
        if t < block["start"]:
            continue
        age = t - block["start"]
        alpha = int(255 * min(max(age / FADE_IN, 0), 1))
        for line in block["lines"]:
            draw_line(draw, line, y, font=block_font, asc=asc, fill_alpha=alpha)
            y += line_h + LINE_GAP
        y += BLOCK_GAP - LINE_GAP
    return frame


def main():
    global block_font
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("output")
    ap.add_argument("blocks_json")
    args = ap.parse_args()

    with open(args.blocks_json, encoding="utf-8") as f:
        blocks = json.load(f)
    blocks.sort(key=lambda b: b["start"])

    workdir = os.path.dirname(os.path.abspath(args.output)) or "."
    tmp = os.path.join(workdir, "_list_reel_tmp")
    frames_dir = os.path.join(tmp, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", args.video],
        capture_output=True, text=True, check=True).stdout.strip())

    block_font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    laid_out, line_h, asc = build_layout(blocks, block_font)

    print(f"Frames rendern ({dur:.1f}s @ {FPS}fps, {len(laid_out)} Bloecke)...")
    total_frames = int(round(dur * FPS))
    for n in range(total_frames):
        t = n / FPS
        frame = render_frame(t, laid_out, line_h, asc)
        frame.save(f"{frames_dir}/frame_{n:05d}.png")
        if n % 100 == 0:
            print(f"  frame {n}/{total_frames}")

    print("Basisclip skalieren...")
    base_clip = os.path.join(tmp, "base_clip.mp4")
    subprocess.run(["ffmpeg", "-i", args.video, "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS}",
                     "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "192k", base_clip, "-y"], capture_output=True, check=True)

    print("Zusammensetzen (Text-Overlay)...")
    cmd = [
        "ffmpeg", "-i", base_clip,
        "-framerate", str(FPS), "-i", f"{frames_dir}/frame_%05d.png",
        "-filter_complex", "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0[vout]",
        "-map", "[vout]", "-map", "0:a",
        "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        args.output, "-y",
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print("Fertig:", args.output)


if __name__ == "__main__":
    main()
