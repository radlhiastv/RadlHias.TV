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
Rendert standardmaessig OHNE Ton (Original-Tonspur wird verworfen).

Verwendung:
    python3 make_list_reel.py <video.mp4> <output.mp4> <blocks.json>

blocks.json:
    [
      {"start": 0.0, "lines": ["dein Zahnarzt:", "„Du putzt falsch“"]},
      {"start": 2.6, "lines": ["dein Arzt:", "„Du isst falsch“"]},
      {"start": 8.2, "lines": ["Was sagst Du dazu?"], "cta": true}
    ]
    "start" = Sekunde, ab der der Block erscheint (bleibt bis Videoende stehen).
    "lines" = vorformatierte Zeilen (werden zusaetzlich automatisch umgebrochen,
              falls eine Zeile breiter als der sichere Textbereich ist). Die
              ERSTE Zeile eines Blocks gilt als Label (Orange), alle weiteren
              als Aussage/Zitat (Navy). Bei nur einer Zeile: Navy.
    "cta"   = optional, true fuer den Call-to-Action-Block am Ende (z.B. die
              Abschlussfrage) - bekommt zusaetzlichen Abstand nach oben
              (CTA_EXTRA_GAP), damit er sich sichtbar vom Hauptteil absetzt.
    "color" = optional, "orange" oder "navy" - erzwingt die Farbe fuer ALLE
              Zeilen dieses Blocks (z.B. um den Hook-Satz orange hervorzu-
              heben, auch wenn er nur eine Zeile hat und sonst als Aussage
              in Navy gelten wuerde). Ohne "color" gilt die normale Label/
              Aussage-Logik oben.

Optionaler Serien-Sticker (--badge "TEIL 1"):
    Zeigt ein verspieltes, leicht gedrehtes Orange-Sticker oben rechts in
    der Ecke (z.B. fuer eine mehrteilige Reel-Serie), statt eine eigene
    Textzeile im Hauptblock zu belegen.

Assets (im selben Skill-Ordner):
    BarlowCondensed-Bold.ttf
    radlhias_logo_watermark.png
"""
import os
import json
import shutil
import argparse
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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
TOP_Y = 400          # Text beginnt deutlich unter dem Logo

BADGE_FONT_SIZE = 64
BADGE_PAD_X = 44
BADGE_PAD_Y = 26
BADGE_TILT_DEG = 8       # verspielte Neigung
BADGE_MARGIN = (30, 30)  # Abstand vom rechten/oberen Rand
FONT_SIZE = 72        # Barlow Condensed ist schmaler als Barlow ExtraBold -
                       # deshalb etwas groesser fuer vergleichbare Lesbarkeit
STROKE_DARK = 10
STROKE_CREAM = 6
LINE_GAP = 16
BLOCK_GAP = 48
CTA_EXTRA_GAP = 170    # zusaetzlicher Abstand vor einem "cta"-Block
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
        forced_color = b.get("color")
        for i, raw in enumerate(b["lines"]):
            if forced_color:
                is_label = (forced_color == "orange")
            else:
                is_label = (i == 0 and len(b["lines"]) > 1)
            for wrapped in wrap_line(raw, font, MAX_TEXT_W):
                lines.append((wrapped, is_label))
        laid_out.append({"start": b["start"], "lines": lines, "cta": bool(b.get("cta"))})
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
        if block["cta"]:
            y += CTA_EXTRA_GAP
        age = t - block["start"]
        alpha = int(255 * min(max(age / FADE_IN, 0), 1))
        for text, is_label in block["lines"]:
            color = ORANGE if is_label else NAVY
            draw_line(draw, text, y, font, color, alpha)
            y += line_h + LINE_GAP
        y += BLOCK_GAP - LINE_GAP
    return frame


def build_badge_image(text, out_path):
    """Verspieltes, leicht gedrehtes Orange-Sticker (z.B. "TEIL 1") als
    eigenstaendiges PNG - wird wie das Logo per ffmpeg-overlay eingeblendet,
    statt eine Zeile im Hauptblock zu belegen."""
    font = ImageFont.truetype(FONT_PATH, BADGE_FONT_SIZE)
    bbox = font.getbbox(text)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    box_w = text_w + BADGE_PAD_X * 2
    box_h = text_h + BADGE_PAD_Y * 2
    pad = 40  # Puffer, damit die Drehung nichts abschneidet
    canvas = Image.new("RGBA", (box_w + pad * 2, box_h + pad * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    rect = [pad, pad, pad + box_w, pad + box_h]
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [rect[0] + 6, rect[1] + 8, rect[2] + 6, rect[3] + 8], radius=box_h // 2, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    canvas = Image.alpha_composite(canvas, shadow)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(rect, radius=box_h // 2, fill=ORANGE, outline=CREAM, width=5)
    draw.text((pad + BADGE_PAD_X - bbox[0], pad + BADGE_PAD_Y - bbox[1]), text, font=font, fill=CREAM)
    rotated = canvas.rotate(BADGE_TILT_DEG, expand=True, resample=Image.BICUBIC)
    rotated.save(out_path)
    return rotated.size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("output")
    ap.add_argument("blocks_json")
    ap.add_argument("--badge", default=None, help='Serien-Sticker oben rechts, z.B. "TEIL 1"')
    args = ap.parse_args()

    with open(args.blocks_json, encoding="utf-8") as f:
        blocks = json.load(f)
    blocks.sort(key=lambda b: b["start"])

    workdir = os.path.dirname(os.path.abspath(args.output)) or "."
    tmp = os.path.join(workdir, "_list_reel_tmp")
    frames_dir = os.path.join(tmp, "frames")
    # Frames-Ordner IMMER frisch anlegen: ffmpeg liest frame_%05d.png als
    # lueckenlose Sequenz, unabhaengig davon, wie viele Frames dieser Lauf
    # tatsaechlich schreibt. Bleiben von einem frueheren, laengeren Render
    # noch hoehere Frame-Nummern liegen, haengt ffmpeg sie klaglos ans Ende
    # des neuen (kuerzeren) Videos an - genau das fuehrte zu einem Frame aus
    # einem vorherigen Reel am Ende eines neuen, kuerzeren Reels.
    shutil.rmtree(frames_dir, ignore_errors=True)
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

    print("Basisclip skalieren (ohne Ton)...")
    base_clip = os.path.join(tmp, "base_clip.mp4")
    # Erst auf Zielhoehe skalieren (Seitenverhaeltnis erhalten), dann mittig auf
    # Zielbreite zuschneiden - verzerrt Quer-/Breitbildmaterial nicht wie ein
    # reines scale=W:H es taete (das wuerde stur strecken/stauchen).
    crop_filter = f"scale=-2:{H}:flags=lanczos,crop={W}:{H},fps={FPS}"
    subprocess.run(["ffmpeg", "-i", args.video, "-vf", crop_filter,
                     "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                     base_clip, "-y"], capture_output=True, check=True)

    print("Zusammensetzen (Text-Overlay + Logo)...")
    filter_complex = (
        "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0[bg];"
        f"[bg][2:v]overlay=(W-w)/2:{LOGO_Y}[bg2]"
    )
    cmd = [
        "ffmpeg", "-i", base_clip,
        "-framerate", str(FPS), "-i", f"{frames_dir}/frame_%05d.png",
        "-loop", "1", "-t", str(dur), "-i", LOGO_PATH,
    ]
    if args.badge:
        badge_path = os.path.join(tmp, "badge.png")
        build_badge_image(args.badge, badge_path)
        mx, my = BADGE_MARGIN
        filter_complex += f";[bg2][3:v]overlay=W-w-{mx}:{my}[vout]"
        cmd += ["-loop", "1", "-t", str(dur), "-i", badge_path]
    else:
        filter_complex += ";[bg2]copy[vout]"
    cmd += [
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18",
        "-movflags", "+faststart",
        args.output, "-y",
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print("Fertig:", args.output)


if __name__ == "__main__":
    main()
