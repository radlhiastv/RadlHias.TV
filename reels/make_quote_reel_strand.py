#!/usr/bin/env python3
"""Foto-Variante 2 (Strandfoto, Querformat): Foto unten, Navy-Flaeche + Text oben.
Verwendung: python3 make_quote_reel_strand.py <foto.jpg> <audio_quelle.mp4|-> <output.mp4>
Verpixelt Aufdruck/Telefonnummer auf Hemd und Kiste des Fahrers."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageFilter
import make_quote_reel as q
from make_quote_reel import W, H, FPS, DUR, BG, CREAM, ORANGE, paste, pop

BLUR_BOXES = [(1518, 884, 1610, 922), (1488, 1020, 1554, 1048)]  # Quellkoordinaten (3000x2000)
CROP_X = 495  # 1620 px breiter Ausschnitt -> beide Raeder im Bild

def main(foto, audio_src, out):
    src = Image.open(foto).convert("RGB")
    for b in BLUR_BOXES:  # Aufdruck mit Umgebungsfarbe (Median vom Rand) uebermalen
        x0, y0, x1, y1 = b; m = 8
        ring = [src.getpixel((x, y)) for x in range(x0 - m, x1 + m, 2) for y in (y0 - m, y0 - 3, y1 + 3, y1 + m)]
        ring += [src.getpixel((x, y)) for y in range(y0, y1, 2) for x in (x0 - m, x0 - 3, x1 + 3, x1 + m)]
        col = tuple(sorted(c[i] for c in ring)[len(ring) // 2] for i in range(3))
        patch = Image.new("RGB", (x1 - x0, y1 - y0), col)
        mask = Image.new("L", patch.size, 255).filter(ImageFilter.GaussianBlur(1))
        src.paste(patch, (x0, y0)); 
        reg = (x0 - 6, y0 - 6, x1 + 6, y1 + 6)
        src.paste(src.crop(reg).filter(ImageFilter.GaussianBlur(3)), reg[:2])
    ph = src.crop((CROP_X, 0, CROP_X + 1620, 2000)).resize((W, 1333), Image.LANCZOS)
    top = H - 1333
    ov = Image.new("L", (1, 1333))
    for y in range(1333):
        g = y + top
        a = 1.0 if g < 640 else (1 - 0.15 * (g - 640) / 390 if g < 1030 else max(0.0, 0.85 * (1 - (g - 1030) / 90)))
        ov.putpixel((0, y), int(255 * a))
    ph = Image.composite(Image.new("RGB", (W, 1333), BG), ph, ov.resize((W, 1333)))
    base_full = Image.new("RGB", (W, H), BG); base_full.paste(ph, (0, top)); base_full = base_full.convert("RGBA")
    logo = Image.open(q.LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox())
    logo = logo.resize((int(110 * logo.width / logo.height), 110), Image.LANCZOS)
    head = q.arch_layer("NICHTS IST VERGLEICHBAR", 96, 1000, track=3)
    big = q.line_layer([("MIT DER EINFACHEN", CREAM)], 190, track=2)
    l2 = q.line_layer([("FREUDE,", ORANGE)], 175, track=2)
    l3 = q.line_layer([("RAD ", CREAM), ("ZU ", ORANGE), ("FAHREN", CREAM)], 175, track=2)
    l4 = q.line_layer([("JOHN F. KENNEDY", CREAM)], 72, track=3, dashes=True)
    items = [(big, 455, 0.5), (l2, 630, 1.2), (l3, 790, 1.9), (l4, 960, 3.0)]
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio_src != "-": cmd += ["-i", audio_src, "-map", "0:v", "-map", "1:a", "-c:a", "copy"]
    cmd += ["-t", str(DUR), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart", "-shortest", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        t = i / FPS
        z = 1.0 + 0.05 * t / DUR
        zw, zh = int(W * z), int(H * z)
        bg = base_full.resize((zw, zh), Image.BICUBIC).crop(((zw - W) // 2, zh - H, (zw - W) // 2 + W, zh))
        fr = Image.blend(Image.new("RGBA", (W, H), BG + (255,)), bg, min(1, t / 0.4))
        paste(fr, logo, (W - logo.width) / 2, 85, alpha=min(1, t / 0.3) * 0.95)
        paste(fr, head, 0, 215, alpha=max(0, min(1, (t - 0.2) / 0.25)))
        for lay, y, t0 in items:
            if t >= t0:
                k = (t - t0) / 0.2
                paste(fr, lay, 0, y, alpha=min(1, k * 1.3), scale=0.88 + 0.12 * pop(k), center=(W / 2, y + lay.height / 2))
        p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()

if __name__ == "__main__": main(*sys.argv[1:4])
