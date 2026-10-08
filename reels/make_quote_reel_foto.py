#!/usr/bin/env python3
"""Foto-Variante des Zitat-Reels: Foto unten sichtbar, oben Navy-Flaeche mit Text.
Verwendung: python3 make_quote_reel_foto.py <foto.jpg> <audio_quelle.mp4|-> <output.mp4>
Das Foto darf kein Logo/Text im unteren Teil haben; im Moment wird oben (bis ~Bildmitte)
alles verdeckt und unten 30 px abgeschnitten (Bildnachweis-Zeile)."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageFilter
import make_quote_reel as q
from make_quote_reel import W, H, FPS, DUR, BG, CREAM, ORANGE, paste, pop, ease_out

def main(foto, audio_src, out):
    src = Image.open(foto).convert("RGB"); src = src.crop((0, 0, src.width, src.height - 30))
    cw = int(src.height * 9 / 16); cx = 342
    src = src.crop((cx - cw // 2, 0, cx + cw // 2, src.height)).resize((W, H), Image.LANCZOS)
    src = src.filter(ImageFilter.GaussianBlur(0.8))
    # Navy-Verlauf: oben (Logo/Zitat im Foto) nahezu deckend, ab Hoehe 1170 ausblenden
    ov = Image.new("L", (1, H))
    for y in range(H):
        a = 1.0 if y < 1185 else max(0.0, 1 - (y - 1185) / 85)
        ov.putpixel((0, y), int(255 * a))
    ov = ov.resize((W, H))
    navy = Image.new("RGB", (W, H), BG)
    base_full = Image.composite(navy, src, ov).convert("RGBA")
    logo = Image.open(q.LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox())
    logo = logo.resize((int(130 * logo.width / logo.height), 130), Image.LANCZOS)
    head = q.arch_layer("NICHTS IST VERGLEICHBAR", 96, 1000, track=3)
    big = q.line_layer([("MIT DER EINFACHEN", CREAM)], 190, track=2)
    l2 = q.line_layer([("FREUDE,", ORANGE)], 175, track=2)
    l3 = q.line_layer([("RAD ", CREAM), ("ZU ", ORANGE), ("FAHREN", CREAM)], 175, track=2)
    l4 = q.line_layer([("JOHN F. KENNEDY", CREAM)], 76, track=3, dashes=True)
    items = [(big, 560, 0.5), (l2, 745, 1.2), (l3, 915, 1.9), (l4, 1090, 3.0)]
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio_src != "-": cmd += ["-i", audio_src, "-map", "0:v", "-map", "1:a", "-c:a", "copy"]
    cmd += ["-t", str(DUR), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart", "-shortest", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        t = i / FPS
        z = 1.0 + 0.05 * t / DUR  # langsamer Zoom um die Bildunterkante
        zw, zh = int(W * z), int(H * z)
        bg = base_full.resize((zw, zh), Image.BICUBIC).crop(((zw - W) // 2, zh - H, (zw - W) // 2 + W, zh))
        fr = Image.new("RGBA", (W, H), BG + (255,))
        fr = Image.blend(fr, bg, min(1, t / 0.4))
        paste(fr, logo, (W - logo.width) / 2, 115, alpha=min(1, t / 0.3) * 0.95)
        paste(fr, head, 0, 305, alpha=max(0, min(1, (t - 0.2) / 0.25)))
        for lay, y, t0 in items:
            if t >= t0:
                k = (t - t0) / 0.2
                paste(fr, lay, 0, y, alpha=min(1, k * 1.3), scale=0.88 + 0.12 * pop(k),
                      center=(W / 2, y + lay.height / 2))
        p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()

if __name__ == "__main__": main(*sys.argv[1:4])
