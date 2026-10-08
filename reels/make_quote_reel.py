#!/usr/bin/env python3
"""RadlHias Zitat-Reel (Navy-Layout wie "Jeder Idiot kann Rad fahren ...").

Aufbau: Logo oben, gebogene Headline, Rennrad-Grafik, grosse Zeile, danach
Zeilen, die nacheinander einpoppen. Timing/Animation nach dem Vorbild-Reel.
Verwendung: python3 make_quote_reel.py <audio_quelle.mp4|-> <output.mp4>
"""
import math, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, DUR = 1080, 1920, 30, 5.4
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "assets", "BarlowCondensed-Bold.ttf")
LOGO = os.path.join(HERE, "..", "RadlHias_Logo_freigestellt_cream.png")
BG, CREAM, ORANGE = (26, 50, 70), (244, 240, 234), (223, 102, 32)
MAXW = 904

def font(sz): return ImageFont.truetype(FONT, int(sz))

def runs_width(runs, f, track):
    return sum(f.getlength(t) + track * len(t) for t, _ in runs)

def line_layer(runs, size, track=0, maxw=MAXW, dashes=False):
    """runs = [(text, color)]; Schrift wird auf maxw begrenzt."""
    f = font(size)
    while runs_width(runs, f, track) > maxw and size > 20:
        size -= 2; f = font(size)
    w = int(runs_width(runs, f, track)); h = int(size * 1.0)
    lay = Image.new("RGBA", (W, h + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x = x0 = (W - w) / 2
    for t, c in runs:
        for ch in t:
            d.text((x, 10), ch, font=f, fill=c + (255,)); x += f.getlength(ch) + track
    if dashes:  # Gedankenstriche links/rechts wie im Vorbild
        y0 = int(10 + size * 0.5 - 3)
        d.rectangle([x0 - 90, y0, x0 - 40, y0 + 6], fill=CREAM + (255,))
        d.rectangle([x0 + w + 40, y0, x0 + w + 90, y0 + 6], fill=CREAM + (255,))
    return lay

def arch_layer(text, size, radius, track=4):
    """Text entlang eines Kreisbogens (Mitte oben)."""
    f = font(size)
    widths = [f.getlength(c) + track for c in text]
    total = sum(widths); ang_total = total / radius
    lay = Image.new("RGBA", (W, 700), (0, 0, 0, 0))
    cx, cy = W / 2, radius + 40
    a = -ang_total / 2
    for c, wd in zip(text, widths):
        mid = a + wd / radius / 2
        g = Image.new("RGBA", (int(size * 2), int(size * 2)), (0, 0, 0, 0))
        ImageDraw.Draw(g).text((g.width / 2, g.height / 2), c, font=f, fill=CREAM + (255,), anchor="mm")
        g = g.rotate(-math.degrees(mid), resample=Image.BICUBIC)
        px = cx + (radius - size * 0.35) * math.sin(mid); py = cy - (radius - size * 0.35) * math.cos(mid)
        lay.alpha_composite(g, (int(px - g.width / 2), int(py - g.height / 2)))
        a += wd / radius
    return lay

def ease_out(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3
def pop(t):  # kurzer Overshoot
    t = max(0, min(1, t)); return 1 - (1 - t) ** 3 + 0.08 * math.sin(math.pi * t) * (1 - t)

def paste(base, lay, x, y, alpha=1.0, scale=1.0, center=None):
    if alpha <= 0.01: return
    if scale != 1.0:
        lay = lay.resize((int(lay.width * scale), int(lay.height * scale)), Image.BICUBIC)
        if center: x, y = int(center[0] - lay.width / 2), int(center[1] - lay.height / 2)
    if alpha < 1: 
        a = lay.getchannel("A").point(lambda v: int(v * alpha)); lay = lay.copy(); lay.putalpha(a)
    base.alpha_composite(lay, (int(x), int(y))) if -lay.width < x < W and -lay.height < y < H and x >= 0 and y >= 0 else \
        base.alpha_composite(lay.crop((max(0, -int(x)), max(0, -int(y)), min(lay.width, W - int(x)), min(lay.height, H - int(y)))),
                             (max(0, int(x)), max(0, int(y)))) if int(x) < W and int(y) < H and int(x) + lay.width > 0 else None

def main(audio_src, out):
    logo = Image.open(LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox()); logo = logo.resize((int(logo.width * 130 / logo.height * 1.0), 130)) if False else logo.resize((int(130 * logo.width / logo.height), 130), Image.LANCZOS)
    bike = Image.open(os.path.join(HERE, "assets", "bike_cream.png"))
    head = arch_layer("NICHTS IST VERGLEICHBAR", 96, 1000, track=3)
    big = line_layer([("MIT DER EINFACHEN", CREAM)], 190, track=2)
    l2 = line_layer([("FREUDE,", ORANGE)], 175, track=2)
    l3 = line_layer([("RAD ", CREAM), ("ZU ", ORANGE), ("FAHREN", CREAM)], 175, track=2)
    l4 = line_layer([("JOHN F. KENNEDY", CREAM)], 76, track=3, dashes=True)
    ys = dict(logo=115, head=345, bike=535, big=990, l2=1175, l3=1345, l4=1545)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio_src != "-": cmd += ["-i", audio_src, "-map", "0:v", "-map", "1:a", "-c:a", "copy"]
    cmd += ["-t", str(DUR), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart", "-shortest", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        t = i / FPS
        fr = Image.new("RGBA", (W, H), BG + (255,))
        paste(fr, logo, (W - logo.width) / 2, ys["logo"], alpha=min(1, t / 0.3) * 0.95)
        paste(fr, head, 0, ys["head"] - 40, alpha=max(0, min(1, (t - 0.2) / 0.25)))
        sx = 1100 * (1 - ease_out((t - 0.4) / 1.1))
        if t >= 0.4:
            paste(fr, bike, (W - bike.width) / 2 + sx, ys["bike"])
            paste(fr, big, sx, ys["big"] - 10)
        for lay, key, t0, sc in ((l2, "l2", 1.9, 1), (l3, "l3", 2.5, 1), (l4, "l4", 3.3, 1)):
            if t >= t0:
                k = (t - t0) / 0.2
                paste(fr, lay, 0, ys[key] - 10, alpha=min(1, k * 1.3), scale=0.88 + 0.12 * pop(k),
                      center=(W / 2, ys[key] - 10 + lay.height / 2))
        p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()

if __name__ == "__main__": main(sys.argv[1], sys.argv[2])
