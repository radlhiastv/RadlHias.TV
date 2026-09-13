#!/usr/bin/env python3
"""
RadlHias Reel-Vorlage
======================
Nimmt ein Rohvideo + eine SRT-Datei (z.B. aus VN exportiert, Text vorher korrigiert)
und erzeugt automatisch das fertige Reel im RadlHias-Stil:
- Wort-fuer-Wort-Untertitel, aktuelles Wort wird groesser/orange (Karaoke-Puls)
- Navy/Orange/Creme-Farbschema, Doppelkontur-Look, Schatten, Filmkorn, -2.5 Grad Neigung
- Logo-Wasserzeichen oben, Fade-to-Black am Ende

Verwendung:
    python3 make_reel.py <video.mp4> <untertitel.srt> <output.mp4>

Voraussetzungen im selben Ordner:
    BarlowCondensed-Bold.ttf
    logo_watermark.png   (500x500 o.ae. RadlHias-Logo, transparent, wird automatisch skaliert)

Workflow für Mathias:
    1. In VN: Auto-Untertitel erzeugen (lokaler Modus, kostenlos), Text korrigieren, als SRT exportieren.
    2. SRT-Datei + Originalvideo hierher kopieren (oder mir schicken).
    3. python3 make_reel.py mein_video.mp4 meine_untertitel.srt reel_fertig.mp4
"""
import sys
import os
import re
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# STYLE PRESET - RadlHias Reel-Vorlage (aus STYLE_GUIDE.md abgeleitet)
# ---------------------------------------------------------------------------
W, H = 1080, 1920
FPS = 24
_SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(_SKILL_ROOT, "assets", "BarlowCondensed-Bold.ttf")
LOGO_PATH = os.path.join(_SKILL_ROOT, "assets", "radlhias_logo_watermark.png")

NAVY = (0x1B, 0x2E, 0x45, 255)
ORANGE = (0xBC, 0x54, 0x12, 255)
CREAM = (0xF5, 0xF0, 0xE6, 255)
DARK = (0x0A, 0x0A, 0x0A, 255)

LEFT_SAFE = 80
MAX_TEXT_W = 940
TOP_SAFE = 250
BOTTOM_ANCHOR = 1650

DARK_EXTRA = 2
SHADOW_OFFSET = (0, 6)
SHADOW_BLUR = 6
SHADOW_ALPHA = 150
TILT_DEG = -2.5
BLOCK_OPACITY = 0.93
GRAIN_STRENGTH = 0.16
PULSE_AMOUNT = 0.25
BASE_FONT_SIZE = 80
MAX_LINES = 2
MAX_WORDS_PER_BLOCK = 8   # dichte SRT-Bloecke automatisch aufteilen, damit Text nicht ueberladen wirkt
MIN_WORD_DUR = 0.22
FADE_TO_BLACK = 1.0       # Sekunden am Ende

# ---------------------------------------------------------------------------
# 1. SRT PARSEN
# ---------------------------------------------------------------------------
def srt_time_to_sec(t):
    h, m, rest = t.split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000

def parse_srt(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    blocks = re.split(r"\n\s*\n", content.strip())
    out = []
    for b in blocks:
        lines = [l for l in b.strip().splitlines() if l.strip()]
        if len(lines) < 2:
            continue
        time_line_idx = 1 if re.match(r"^\d+$", lines[0].strip()) else 0
        m = re.match(r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})", lines[time_line_idx])
        if not m:
            continue
        start, end = srt_time_to_sec(m.group(1)), srt_time_to_sec(m.group(2))
        text = " ".join(lines[time_line_idx + 1:]).strip()
        if text:
            out.append((start, end, text))
    return out

def clean_word(w):
    return "".join(c for c in w if c.isalnum() or c in "ÄÖÜäöüß").upper()

# ---------------------------------------------------------------------------
# 2. AUDIO-ENERGIE-ANALYSE fuer Wort-Timing innerhalb eines SRT-Blocks
# ---------------------------------------------------------------------------
def load_rms(audio_path):
    import librosa
    y, sr = librosa.load(audio_path, sr=16000, mono=True)
    hop, frame = 80, 320
    rms = librosa.feature.rms(y=y, frame_length=frame, hop_length=hop)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    kernel = np.ones(3) / 3
    rms_s = np.convolve(rms, kernel, mode="same")
    return times, rms_s

def local_minimum_near(times, rms_s, target_t, seg_start, seg_end, search_radius=0.28, min_gap=0.08):
    lo = max(seg_start + min_gap, target_t - search_radius)
    hi = min(seg_end - min_gap, target_t + search_radius)
    if hi <= lo:
        return None
    mask = (times >= lo) & (times <= hi)
    idxs = np.where(mask)[0]
    if len(idxs) < 3:
        return None
    seg_t, seg_r = times[idxs], rms_s[idxs]
    win, best = 2, None
    for i in range(win, len(seg_r) - win):
        window = seg_r[i - win:i + win + 1]
        if seg_r[i] == window.min():
            depth = np.mean(window) - seg_r[i]
            if depth <= 0:
                continue
            score = depth - 0.15 * abs(seg_t[i] - target_t)
            if best is None or score > best[0]:
                best = (score, seg_t[i])
    return best[1] if best else None

def find_speech_subchunks(times, rms_s, start, end, noise_db=-24, min_silence=0.12, edge_pad=0.03):
    """Findet echte Mikro-Sprechpausen INNERHALB eines SRT-Blocks (per Audio-Energie,
    Schwelle relativ zum Block-eigenen Pegel-Peak - funktioniert also auch bei leiseren
    Aufnahmen). Ein SRT-Block ist oft ein ganzer Satz (mehrere Sekunden); ohne diese
    Unterteilung schaetzt words_for_block Wort-Grenzen rein proportional zur Wortlaenge
    ueber den GANZEN Block, was bei laengeren Bloecken zu spuerbarer Drift zwischen
    Untertitel-Tempo und tatsaechlichem Mund/Sprechtempo fuehrt. Mit den echten
    Mikropausen als zusaetzliche Anker bleibt die Verschiebung auf wenige Woerter
    zwischen zwei echten Pausen begrenzt statt sich ueber den ganzen Satz aufzusummieren.
    """
    mask = (times >= start) & (times <= end)
    t, r = times[mask], rms_s[mask]
    if len(r) < 5:
        return [(start, end)]
    peak = np.percentile(r, 95) + 1e-9
    thresh = peak * (10 ** (noise_db / 20))
    is_silence = r < thresh
    silences, i, n = [], 0, len(t)
    while i < n:
        if is_silence[i]:
            j = i
            while j < n and is_silence[j]:
                j += 1
            dur = t[j - 1] - t[i] if j > i else 0
            if dur >= min_silence:
                silences.append((t[i], t[j - 1]))
            i = j
        else:
            i += 1
    subchunks, cur = [], start
    for s0, s1 in silences:
        if s0 > cur + edge_pad:
            subchunks.append((cur, s0))
        cur = max(cur, s1)
    if cur < end - edge_pad:
        subchunks.append((cur, end))
    return subchunks if subchunks else [(start, end)]

def _proportional_bounds(words, subchunks, start, end):
    """Verteilt Woerter gewichtet nach Zeichenlaenge ueber die gegebenen (echten)
    Sprechabschnitte hinweg (Pausen dazwischen werden uebersprungen)."""
    weights = [len(w) + 2 for w in words]
    total_w = sum(weights)
    total_dur = sum(e - s for s, e in subchunks) or (end - start)
    cum, cum_bounds = 0, [0.0]
    for wt in weights:
        cum += wt
        cum_bounds.append(total_dur * (cum / total_w))

    def speech_to_real(tt):
        acc = 0.0
        for cs, ce in subchunks:
            d = ce - cs
            if acc + d >= tt or (cs, ce) == subchunks[-1]:
                return cs + (tt - acc)
            acc += d
        return subchunks[-1][1]

    bounds = [speech_to_real(b) for b in cum_bounds]
    bounds[0], bounds[-1] = start, end
    for i in range(1, len(bounds)):
        if bounds[i] <= bounds[i - 1]:
            bounds[i] = bounds[i - 1] + 0.05
    return bounds

def words_for_block(times, rms_s, start, end, text):
    words = [clean_word(w) for w in text.split()]
    n = len(words)
    if n == 0:
        return []
    if n == 1:
        return [(words[0], start, end)]

    subchunks = find_speech_subchunks(times, rms_s, start, end)
    if len(subchunks) > 1:
        # Bevorzugter Pfad: echte Mikropausen im Block gefunden -> Woerter darauf
        # verteilen statt ueber den ganzen (womoeglich mehrsekuendigen) Block zu raten.
        bounds = _proportional_bounds(words, subchunks, start, end)
        return [(words[i], bounds[i], bounds[i + 1]) for i in range(n)]

    # Fallback: keine internen Pausen gefunden (kurzer oder durchgehend gesprochener
    # Block) -> wie bisher rein proportional + lokale Energie-Minima-Suche.
    weights = [len(w) + 2 for w in words]
    total_w = sum(weights)
    t, prop_bounds = start, []
    for wt in weights[:-1]:
        t += (end - start) * (wt / total_w)
        prop_bounds.append(t)
    bounds = [start]
    for pb in prop_bounds:
        found = local_minimum_near(times, rms_s, pb, start, end)
        if found is not None and found > bounds[-1] + 0.06:
            bounds.append(found)
        else:
            bounds.append(pb if pb > bounds[-1] + 0.06 else bounds[-1] + 0.06)
    bounds.append(end)
    for i in range(1, len(bounds)):
        if bounds[i] <= bounds[i - 1]:
            bounds[i] = bounds[i - 1] + 0.05
    bounds[-1] = end
    return [(words[i], bounds[i], bounds[i + 1]) for i in range(n)]

def enforce_min_duration(seg_words, min_dur=MIN_WORD_DUR):
    if len(seg_words) <= 1:
        return seg_words
    start, end = seg_words[0][1], seg_words[-1][2]
    bounds = [start] + [w[2] for w in seg_words]
    bounds[-1] = end
    n = len(seg_words)
    for _ in range(3):
        changed = False
        for i in range(1, n):
            dur = bounds[i] - bounds[i - 1]
            if dur < min_dur:
                deficit = min_dur - dur
                if i - 1 > 0:
                    bounds[i - 1] -= deficit / 2
                bounds[i] += deficit / 2
                changed = True
        if not changed:
            break
    bounds[0], bounds[-1] = start, end
    for i in range(1, n):
        if bounds[i] <= bounds[i - 1]:
            bounds[i] = bounds[i - 1] + 0.05
    bounds[-1] = end
    if bounds[-2] >= bounds[-1]:
        bounds[-2] = bounds[-1] - 0.05
    return [(seg_words[i][0], bounds[i], bounds[i + 1]) for i in range(n)]

# ---------------------------------------------------------------------------
# 3. DICHTE BLOECKE AUTOMATISCH AUFTEILEN (max. MAX_WORDS_PER_BLOCK Woerter)
# ---------------------------------------------------------------------------
def split_dense_blocks(word_blocks):
    out = []
    for block in word_blocks:
        n = len(block)
        if n <= MAX_WORDS_PER_BLOCK:
            out.append(block)
            continue
        n_parts = math.ceil(n / MAX_WORDS_PER_BLOCK)
        size = math.ceil(n / n_parts)
        for i in range(0, n, size):
            out.append(block[i:i + size])
    return out

# ---------------------------------------------------------------------------
# 4. RENDERING (Doppelkontur, Schatten, Filmkorn, Neigung, Karaoke-Puls)
# ---------------------------------------------------------------------------
def fit_and_wrap(words, base_size, max_w, max_lines=MAX_LINES):
    size = base_size
    lines = [words]
    while size > 28:
        font = ImageFont.truetype(FONT_PATH, size)
        space_w = font.getlength(" ") * 2.6
        lines, cur, cur_w = [], [], 0
        for w in words:
            ww = font.getlength(w)
            add = ww if not cur else space_w + ww
            if cur_w + add <= max_w or not cur:
                cur.append(w)
                cur_w += add
            else:
                lines.append(cur)
                cur = [w]
                cur_w = ww
        if cur:
            lines.append(cur)
        if len(lines) <= max_lines:
            return font, lines, size
        size -= 2
    font = ImageFont.truetype(FONT_PATH, size)
    return font, lines, size

def layout_block(seg_words):
    words = [w for w, _, _ in seg_words]
    font, lines, size = fit_and_wrap(words, BASE_FONT_SIZE, MAX_TEXT_W)
    asc, desc = font.getmetrics()
    line_h = asc + desc
    line_gap = int(line_h * 0.55)
    space_w = font.getlength(" ") * 2.6
    positions, idx, y = {}, 0, 0
    for line in lines:
        x = 0
        for w in line:
            positions[idx] = (x, y, w)
            x += font.getlength(w) + space_w
            idx += 1
        y += line_h + line_gap
    total_h = y - line_gap
    return {"font": font, "size": size, "positions": positions, "line_h": line_h,
            "asc": asc, "desc": desc, "total_h": total_h}

def make_grain(size, strength, rng):
    noise = rng.integers(0, 255, (size[1], size[0]), dtype=np.uint8)
    return Image.fromarray(noise, mode="L")

def _scaled_font(word, font, scale, base_size):
    eff_size = max(8, int(round(base_size * scale)))
    return ImageFont.truetype(FONT_PATH, eff_size) if eff_size != font.size else font

def draw_word(draw, x, y_baseline_offset, word, font, fill, scale, base_size):
    f2 = _scaled_font(word, font, scale, base_size)
    bbox = f2.getbbox(word)
    dx = (f2.getlength(word) - font.getlength(word)) / 2
    cream_w = max(2, int(round(3 * scale)))
    dark_w = cream_w + DARK_EXTRA
    yy = y_baseline_offset - bbox[1] - (f2.size - font.size) * 0.5
    xx = x - dx
    draw.text((xx, yy), word, font=f2, fill=DARK, stroke_width=dark_w, stroke_fill=DARK)
    draw.text((xx, yy), word, font=f2, fill=CREAM, stroke_width=cream_w, stroke_fill=CREAM)
    draw.text((xx, yy), word, font=f2, fill=fill, stroke_width=0)

def draw_word_shadow(draw, x, y_baseline_offset, word, font, scale, base_size):
    f2 = _scaled_font(word, font, scale, base_size)
    bbox = f2.getbbox(word)
    dx = (f2.getlength(word) - font.getlength(word)) / 2
    yy = y_baseline_offset - bbox[1] - (f2.size - font.size) * 0.5
    xx = x - dx
    draw.text((xx + SHADOW_OFFSET[0], yy + SHADOW_OFFSET[1]), word, font=f2, fill=(0, 0, 0, SHADOW_ALPHA))

def render_frame(t, blocks, layouts, rng):
    seg_idx = None
    for i, (start, end) in enumerate([(b[0][1], b[-1][2]) for b in blocks]):
        if start <= t <= end:
            seg_idx = i
            break
    if seg_idx is None:
        return None
    seg_words = blocks[seg_idx]
    layout = layouts[seg_idx]
    font, base_size, asc = layout["font"], layout["size"], layout["asc"]

    active_idx, scale_for = None, {}
    for i, (w, wstart, wend) in enumerate(seg_words):
        if wstart <= t < wend:
            active_idx = i
            local = (t - wstart) / max(wend - wstart, 0.001)
            scale_for[i] = 1.0 + PULSE_AMOUNT * math.sin(math.pi * min(max(local, 0), 1))

    start, end = seg_words[0][1], seg_words[-1][2]
    fade, fin, fout = 1.0, 0.18, 0.18
    if t < start + fin:
        fade = (t - start) / fin
    elif t > end - fout:
        fade = (end - t) / fout
    fade = min(max(fade, 0), 1)

    pad = 70
    canvas_w = int(MAX_TEXT_W + pad * 2)
    canvas_h = int(layout["total_h"] + pad * 2 + 40)
    shadow_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    text_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    ds, dt = ImageDraw.Draw(shadow_layer), ImageDraw.Draw(text_layer)

    for idx, (x, y, w) in layout["positions"].items():
        scale = scale_for.get(idx, 1.0)
        fill = ORANGE if idx == active_idx else NAVY
        xx, yy = pad + x, pad + y + asc
        draw_word_shadow(ds, xx, yy, w, font, scale, base_size)
        draw_word(dt, xx, yy, w, font, fill, scale, base_size)

    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    composed = Image.alpha_composite(shadow_layer, text_layer)
    alpha = composed.split()[3]
    grain = make_grain(composed.size, GRAIN_STRENGTH, rng)
    grain_rgba = Image.merge("RGBA", (grain, grain, grain, alpha.point(lambda p: int(p * GRAIN_STRENGTH))))
    composed = Image.alpha_composite(composed, grain_rgba)
    r, g, b, a = composed.split()
    a = a.point(lambda p: int(p * BLOCK_OPACITY * fade))
    composed.putalpha(a)
    rotated = composed.rotate(-TILT_DEG, expand=True, resample=Image.BICUBIC)

    frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bx = LEFT_SAFE - pad
    by = max(BOTTOM_ANCHOR - rotated.height, TOP_SAFE)
    frame.alpha_composite(rotated, (max(bx, 0), by))
    return frame

# ---------------------------------------------------------------------------
# 5. HAUPTABLAUF
# ---------------------------------------------------------------------------
def main(video_path, srt_path, out_path):
    workdir = os.path.dirname(os.path.abspath(out_path)) or "."
    tmp = os.path.join(workdir, "_reel_tmp")
    os.makedirs(tmp, exist_ok=True)
    frames_dir = os.path.join(tmp, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    audio_path = os.path.join(tmp, "audio.wav")
    subprocess.run(["ffmpeg", "-i", video_path, "-vn", "-ar", "16000", "-ac", "1",
                     "-c:a", "pcm_s16le", audio_path, "-y"], capture_output=True, check=True)

    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", video_path],
        capture_output=True, text=True).stdout.strip())

    print("SRT einlesen...")
    srt_blocks = parse_srt(srt_path)
    times, rms_s = load_rms(audio_path)

    print("Wort-Timing pro Block ermitteln (Audio-Energie-Analyse)...")
    word_blocks = []
    for start, end, text in srt_blocks:
        wb = words_for_block(times, rms_s, start, end, text)
        wb = enforce_min_duration(wb)
        if wb:
            word_blocks.append(wb)

    print("Dichte Bloecke aufteilen (max. %d Woerter)..." % MAX_WORDS_PER_BLOCK)
    word_blocks = split_dense_blocks(word_blocks)

    print("Layout berechnen...")
    layouts = [layout_block(b) for b in word_blocks]

    print("Frames rendern (%d Bloecke)..." % len(word_blocks))
    rng = np.random.default_rng(42)
    total_frames = int(round(dur * FPS))
    for n in range(total_frames):
        t = n / FPS
        frame = render_frame(t, word_blocks, layouts, rng)
        if frame is None:
            frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        frame.save(f"{frames_dir}/frame_{n:05d}.png")
        if n % 100 == 0:
            print(f"  frame {n}/{total_frames}")

    print("Basisclip skalieren...")
    base_clip = os.path.join(tmp, "base_clip.mp4")
    subprocess.run(["ffmpeg", "-i", video_path, "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS}",
                     "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "192k", base_clip, "-y"], capture_output=True, check=True)

    print("Zusammensetzen (Untertitel + Logo + Fade)...")
    fade_start = max(dur - FADE_TO_BLACK, 0)
    filter_complex = (
        "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0[bg];"
        "[bg][2:v]overlay=(W-w)/2:140[vout_pre];"
        f"[vout_pre]fade=t=out:st={fade_start}:d={FADE_TO_BLACK}:color=black[vout]"
    )
    cmd = [
        "ffmpeg", "-i", base_clip,
        "-framerate", str(FPS), "-i", f"{frames_dir}/frame_%05d.png",
        "-loop", "1", "-t", str(dur), "-i", LOGO_PATH,
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-map", "0:a",
        "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        out_path, "-y",
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print("Fertig:", out_path)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Verwendung: python3 make_reel.py <video.mp4> <untertitel.srt> <output.mp4>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2], sys.argv[3])
