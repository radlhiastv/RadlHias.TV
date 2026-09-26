#!/usr/bin/env python3
"""
RadlHias Reel-Vorlage - AUFBAUENDE LISTE
==========================================
Zweite Reel-Vorlage neben radlhias_yepp_subtitle: mehrere Text-Bloecke
erscheinen nacheinander (Zeile fuer Zeile getimt) und bleiben stehen,
statt wie beim Yepp-Stil wortweise zu pulsieren. Aufbau je Block:
erste Zeile = Label (z.B. "dein Zahnarzt:") in Orange, restliche Zeilen
= Zitat/Aussage in Navy - beides in Barlow Condensed Bold mit
Doppelkontur (Dunkel + Creme), im RadlHias-Markenstil. Logo-Wasserzeichen
oben, Text beginnt deutlich darunter. Kein Filmkorn, keine Neigung -
bei mehreren gleichzeitig sichtbaren Bloecken bleibt es sonst zu unruhig.

Verwendung:
    python3 make_list_reel.py <video.mp4> <output.mp4> <blocks.json>

blocks.json:
    [
      {"start": 0.0, "lines": ["dein Zahnarzt:", "„Du putzt falsch“"]},
      {"start": 2.6, "lines": ["dein Arzt:", "„Du isst falsch“"]}
    ]
    "start" = Sekunde, ab der der Block erscheint (bleibt bis Videoende stehen).
    "lines" = vorformatierte Zeilen (werden zusaetzlich automatisch umgebrochen,
              falls eine Zeile breiter als der sichere Textbereich ist). Die
              ERSTE Zeile eines Blocks gilt als Label (Orange), alle weiteren
              als Aussage/Zitat (Navy). Bei nur einer Zeile: Navy.

Assets (im selben Skill-Ordner):
    BarlowCondensed-Bold.ttf
    radlhias_logo_watermark.png
"""
import os
import json
import argparse
import subprocess
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 24
SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(SKILL_ROOT, "assets", "BarlowCondensed-Bold.ttf")
LOGO_PATH = os.path.join(SKILL_ROOT, "assets", "radlhias_logo_watermark.png")

NAVY = (0x1B, 0x2E, 0x45, 255)
ORANGE = (0xBC, 0x54, 0x12, 255)
CREAM = (0xF5, 0xF0, 0xE6, 255)
DARK = (0x0A, 0x0A, 0x0A, 255)

LOGO_Y = 60
MAX_TEXT_W = 940
TOP_Y = 480          # Text beginnt deutlich unter dem Logo
FONT_SIZE = 66        # Barlow Condensed ist schmaler als Barlow ExtraBold -
                       # deshalb etwas groesser fuer vergleichbare Lesbarkeit
STROKE_DARK = 9
STROKE_CREAM = 5
LINE_GAP = 16
BLOCK_GAP = 50
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
    """Berechnet fuer jeden Block seine (umgebrochenen) Zeilen inkl. Rolle
    (Label = erste Rohzeile, Aussage = Rest) + Gesamthoehe."""
    asc, desc = font.getmetrics()
    line_h = asc + desc
    laid_out = []
    for b in blocks:
        lines = []  # Liste von (text, ist_label)
        for i, raw in enumerate(b["lines"]):
            is_label = (i == 0 and len(b["lines"]) > 1)
            for wrapped in wrap_line(raw, font, MAX_TEXT_W):
                lines.append((wrapped, is_label))
        laid_out.append({"start": b["start"], "lines": lines})
    return laid_out, line_h, asc


def draw_line(draw, text, cy, font, fill_rgb, fill_alpha):
    w = font.getlength(text)
    x = (W - w) / 2
    dark = (*DARK[:3], fill_alpha)
    cream = (*CREAM[:3], fill_alpha)
    fill = (*fill_rgb[:3], fill_alpha)
    draw.text((x, cy), text, font=font, fill=dark, stroke_width=STROKE_DARK, stroke_fill=dark)
    draw.text((x, cy), text, font=font, fill=cream, stroke_width=STROKE_CREAM, stroke_fill=cream)
    draw.text((x, cy), text, font=font, fill=fill, stroke_width=0)


def render_frame(t, laid_out, line_h, font):
    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    y = TOP_Y
    for block in laid_out:
        if t < block["start"]:
            continue
        age = t - block["start"]
        alpha = int(255 * min(max(age / FADE_IN, 0), 1))
        for text, is_label in block["lines"]:
            color = ORANGE if is_label else NAVY
            draw_line(draw, text, y, font, color, alpha)
            y += line_h + LINE_GAP
        y += BLOCK_GAP - LINE_GAP
    return frame


def main():
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

    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    laid_out, line_h, asc = build_layout(blocks, font)

    print(f"Frames rendern ({dur:.1f}s @ {FPS}fps, {len(laid_out)} Bloecke)...")
    total_frames = int(round(dur * FPS))
    for n in range(total_frames):
        t = n / FPS
        frame = render_frame(t, laid_out, line_h, font)
        frame.save(f"{frames_dir}/frame_{n:05d}.png")
        if n % 100 == 0:
            print(f"  frame {n}/{total_frames}")

    print("Basisclip skalieren...")
    base_clip = os.path.join(tmp, "base_clip.mp4")
    subprocess.run(["ffmpeg", "-i", args.video, "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS}",
                     "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "192k", base_clip, "-y"], capture_output=True, check=True)

    print("Zusammensetzen (Text-Overlay + Logo)...")
    filter_complex = (
        "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0[bg];"
        f"[bg][2:v]overlay=(W-w)/2:{LOGO_Y}[vout]"
    )
    cmd = [
        "ffmpeg", "-i", base_clip,
        "-framerate", str(FPS), "-i", f"{frames_dir}/frame_%05d.png",
        "-loop", "1", "-t", str(dur), "-i", LOGO_PATH,
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-map", "0:a",
        "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        args.output, "-y",
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print("Fertig:", args.output)


if __name__ == "__main__":
    main()
