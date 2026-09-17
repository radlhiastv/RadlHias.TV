#!/usr/bin/env python3
"""
RadlHias Reel-Vorlage
======================
Nimmt ein Rohvideo + entweder (a) eine SRT-Datei (z.B. aus VN exportiert, Text
vorher korrigiert) oder (b) eine timing.json aus dem Reel-Timing-Tool (siehe
references/reel_timing.md) und erzeugt automatisch das fertige Reel im
RadlHias-Stil:
- Wort-fuer-Wort-Untertitel, aktuelles Wort wird groesser/orange (Karaoke-Puls)
- Navy/Orange/Creme-Farbschema, Doppelkontur-Look, Schatten, Filmkorn, -2.5 Grad Neigung
- Logo-Wasserzeichen oben, Fade-to-Black am Ende

Verwendung:
    python3 make_reel.py <video.mp4> <untertitel.srt|timing.json> <output.mp4>

Voraussetzungen im selben Ordner:
    BarlowCondensed-Bold.ttf
    logo_watermark.png   (500x500 o.ae. RadlHias-Logo, transparent, wird automatisch skaliert)

Workflow für Mathias (empfohlen - exaktes Timing, kein Schaetzen aus der Tonspur):
    1. Reel-Timing-Artefakt oeffnen, Rohvideo + reinen Text (ohne Zeitstempel)
       laden, im Sprechtempo durchtippen, "Fuer Claude speichern" druecken.
    2. Claude liest die getappten Zeitstempel (timing.json) zurueck und ruft
       python3 make_reel.py mein_video.mp4 timing.json reel_fertig.mp4 auf.

Alternativ-Workflow (Text-Timing aus Audio-Energie-Analyse geschaetzt):
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
SPACE_FACTOR = 1.3        # Wortabstand als Vielfaches der Leerzeichenbreite
BASE_FONT_SIZE = 92
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

def detect_silences(audio_path, noise_db=-24, min_dur=0.12):
    """Ruft ffmpegs eigene silencedetect-Analyse EINMAL auf die ganze Tonspur auf und
    liefert alle (start,end)-Stille-Intervalle. Das ist deutlich zuverlaessiger als ein
    selbstgebauter RMS-Schwellenwert: eine Schwelle relativ zum Pegel-Peak versagt naemlich,
    sobald der Grundrauschpegel der Aufnahme fast so hoch liegt wie die Schwelle selbst
    (bei -24dB Peak-relativ z.B. kein einziges Frame mehr darunter) - ffmpegs Implementierung
    ist dagegen abgehangen und in der Praxis getestet."""
    out = subprocess.run(
        ["ffmpeg", "-i", audio_path, "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}",
         "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\-0-9.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\-0-9.]+)", out)]
    return list(zip(starts, ends[:len(starts)]))

def find_speech_subchunks(silences, start, end, min_dur=0.15, edge_pad=0.03, merge_gap=0.05):
    """Schneidet die global erkannten Stille-Intervalle auf einen SRT-Block zu und liefert
    die dazwischenliegenden echten Sprechabschnitte. Ein SRT-Block ist oft ein ganzer Satz
    (mehrere Sekunden); ohne diese Unterteilung schaetzt words_for_block Wort-Grenzen rein
    proportional zur Wortlaenge ueber den GANZEN Block, was bei laengeren Bloecken zu
    spuerbarer Drift zwischen Untertitel-Tempo und tatsaechlichem Mund/Sprechtempo fuehrt.
    Mit den echten Mikropausen als zusaetzliche Anker bleibt die Verschiebung auf wenige
    Woerter zwischen zwei echten Pausen begrenzt statt sich ueber den ganzen Satz
    aufzusummieren. Sehr kurze/schwache Stille-Kandidaten (<min_dur) werden ignoriert,
    dicht aufeinanderfolgende (<merge_gap Abstand) verschmolzen."""
    local = [(max(s, start), min(e, end)) for s, e in silences if e > start and s < end]
    local = [(s, e) for s, e in local if e - s >= min_dur]
    local.sort()
    merged = []
    for s, e in local:
        if merged and s - merged[-1][1] < merge_gap:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    subchunks, cur = [], start
    for s0, s1 in merged:
        if s0 > cur + edge_pad:
            subchunks.append((cur, s0))
        cur = max(cur, s1)
    if cur < end - edge_pad:
        subchunks.append((cur, end))
    return subchunks if subchunks else [(start, end)]

def _single_span_words(words, times, rms_s, start, end):
    """Verteilt Woerter proportional zur Zeichenlaenge ueber EINE zusammenhaengende
    Zeitspanne, verfeinert per lokaler Energie-Minima-Suche. Das ist der Kern-Algorithmus
    fuer eine Zeitspanne OHNE bekannte interne Pausen (kurzer Block, oder ein einzelner
    Sprechabschnitt innerhalb eines groesseren Blocks)."""
    n = len(words)
    if n == 1:
        return [(words[0], start, end)]
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

def words_for_block(times, rms_s, silences, start, end, text):
    words = [clean_word(w) for w in text.split()]
    n = len(words)
    if n == 0:
        return []
    if n == 1:
        return [(words[0], start, end)]

    subchunks = find_speech_subchunks(silences, start, end)
    if len(subchunks) <= 1:
        # Fallback: keine internen Pausen gefunden (kurzer oder durchgehend
        # gesprochener Block) -> wie bisher ueber den GANZEN Block schaetzen.
        return _single_span_words(words, times, rms_s, start, end)

    # Bevorzugter Pfad: echte Mikropausen im Block gefunden. WICHTIG: die Woerter
    # werden zuerst den einzelnen Sprechabschnitten zugeteilt (kumulatives Gewicht
    # ~ kumulative Sprechdauer) und DANN innerhalb jedes Abschnitts fuer sich
    # aufgeteilt - nur so bleiben die echten Pausen zwischen den Woertern als
    # Luecke erhalten. Eine einzige durchgehende Zeitachse ueber alle Abschnitte
    # hinweg (wie im ersten Anlauf) kann eine Pause zwischen zwei Woertern
    # grundsaetzlich nicht abbilden, weil das End-des-einen-/Start-des-naechsten-
    # Wortes im Datenmodell derselbe Zeitpunkt ist.
    weights = [len(w) + 2 for w in words]
    total_w = sum(weights)
    total_dur = sum(e - s for s, e in subchunks)
    cum, cum_targets = 0, []
    for wt in weights:
        cum += wt
        cum_targets.append(total_dur * (cum / total_w))
    sub_cum_end, running = [], 0.0
    for cs, ce in subchunks:
        running += ce - cs
        sub_cum_end.append(running)
    assign, ci = [], 0
    for tgt in cum_targets:
        while ci < len(subchunks) - 1 and tgt > sub_cum_end[ci] + 1e-9:
            ci += 1
        assign.append(ci)

    result = []
    for ci_target, (cs, ce) in enumerate(subchunks):
        idxs = [i for i, a in enumerate(assign) if a == ci_target]
        if not idxs:
            continue
        chunk_words = [words[i] for i in idxs]
        result.extend(_single_span_words(chunk_words, times, rms_s, cs, ce))
    return result

def _enforce_min_duration_run(seg_words, min_dur):
    """Wie enforce_min_duration, aber fuer einen garantiert LUECKENLOSEN Wort-Lauf
    (Wort i endet exakt dort, wo Wort i+1 beginnt)."""
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

def enforce_min_duration(seg_words, min_dur=MIN_WORD_DUR, gap_eps=0.02):
    """Zieht zu kurze Wort-Anzeigedauern auseinander - aber NUR innerhalb eines
    zusammenhaengenden Laufs ohne echte Pause. Ein Block kann (dank Mikropausen-
    Erkennung) aus mehreren durch echte Sprechpausen getrennten Wort-Laeufen
    bestehen; wuerde man die ganze Liste am Stueck bearbeiten, wie urspruenglich,
    wuerden diese Pausen faelschlich mit-eingeebnet."""
    if len(seg_words) <= 1:
        return seg_words
    runs, cur = [], [seg_words[0]]
    for prev, w in zip(seg_words, seg_words[1:]):
        if w[1] - prev[2] > gap_eps:
            runs.append(cur)
            cur = [w]
        else:
            cur.append(w)
    runs.append(cur)
    out = []
    for run in runs:
        out.extend(_enforce_min_duration_run(run, min_dur))
    return out

# ---------------------------------------------------------------------------
# 2b. WORT-TIMING AUS DEM WORT-TAKTGEBER-TOOL (manuell getappte Zeitstempel)
# ---------------------------------------------------------------------------
def interpolate_from_anchors(words, anchors, duration=None):
    """Rechnet aus Stuetzstellen (Ankern) die Zeit JEDES Wortes aus.

    Der Yepp-Timer laesst Mathias nicht mehr jedes einzelne Wort setzen,
    sondern nur noch rund ein Viertel davon - die Woerter dazwischen fallen
    hier an. Gemessen an seinem Material spricht er gleichmaessig genug,
    dass eine Verteilung nach Zeichenlaenge innerhalb eines Ankerabstands
    von ~2 Sekunden traegt (laengere Woerter dauern laenger als kurze).

    `anchors`: [{"i": <Wortindex>, "t": <Sekunde>}, ...]
    Rueckgabe: Liste der Startzeiten, eine je Wort."""
    n = len(words)
    if n == 0:
        return []
    weights = [max(1, len(clean_word(w))) for w in words]
    # kumulierte Gewichtung vor Wort i - damit laesst sich zwischen zwei
    # Ankern proportional statt stur gleichmaessig verteilen
    cum = [0.0] * (n + 1)
    for i, g in enumerate(weights):
        cum[i + 1] = cum[i] + g

    anchors = sorted(anchors, key=lambda a: a["i"])
    anchors = [a for a in anchors if 0 <= a["i"] < n]
    if not anchors:
        raise ValueError("Timing-Datei enthaelt keine brauchbaren Anker")

    times = [None] * n
    for a in anchors:
        times[a["i"]] = float(a["t"])

    def fill(i0, t0, i1, t1):
        """Woerter zwischen zwei Ankern proportional zur Zeichenlaenge."""
        span = cum[i1] - cum[i0]
        if span <= 0:
            return
        for i in range(i0 + 1, i1):
            times[i] = t0 + (t1 - t0) * (cum[i] - cum[i0]) / span

    for a, b in zip(anchors, anchors[1:]):
        fill(a["i"], float(a["t"]), b["i"], float(b["t"]))

    # Vor dem ersten und nach dem letzten Anker mit dem Tempo des
    # angrenzenden Abschnitts weiterrechnen.
    first, last = anchors[0], anchors[-1]
    if len(anchors) >= 2:
        rate_head = (float(anchors[1]["t"]) - float(first["t"])) / max(
            1e-6, cum[anchors[1]["i"]] - cum[first["i"]])
        rate_tail = (float(last["t"]) - float(anchors[-2]["t"])) / max(
            1e-6, cum[last["i"]] - cum[anchors[-2]["i"]])
    else:
        rate_head = rate_tail = 0.25 / max(1, sum(weights) / n)

    for i in range(first["i"] - 1, -1, -1):
        times[i] = max(0.0, float(first["t"]) - (cum[first["i"]] - cum[i]) * rate_head)
    for i in range(last["i"] + 1, n):
        times[i] = float(last["t"]) + (cum[i] - cum[last["i"]]) * rate_tail
    if duration:
        times = [min(float(duration), t) for t in times]

    # Monotonie sichern - eine Rundung darf die Reihenfolge nicht drehen
    for i in range(1, n):
        if times[i] < times[i - 1]:
            times[i] = times[i - 1]
    return times


def parse_word_timings_json(path, gap_break=0.5, tail_dur=0.45):
    """Liest die vom Yepp-Timer exportierten Zeitstempel ein.

    Zwei Formate, am Inhalt von "words" unterschieden:

    * **Anker** (aktuell): {"words": ["Wort", ...],
      "anchors": [{"i": 0, "t": 0.83}, ...]} - Mathias setzt nur
      Stuetzstellen, die Woerter dazwischen rechnet
      `interpolate_from_anchors` aus.
    * **Ein Stempel je Wort** (aelter): {"words": [{"w": "...", "t": 1.23}]}

    Jedes Wort dauert bis zum naechsten; das letzte bekommt `tail_dur`
    Sekunden. Eine Luecke > gap_break trennt zwei Anzeige-Bloecke (eine
    echte Sprechpause)."""
    import json
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    raw = data.get("words") or []
    if raw and isinstance(raw[0], str):
        # Ankerformat
        words = raw
        times = interpolate_from_anchors(words, data.get("anchors") or [],
                                         data.get("duration"))
        taps = [{"w": w, "t": t} for w, t in zip(words, times)]
    else:
        taps = sorted(raw, key=lambda w: w["t"])

    n = len(taps)
    if n == 0:
        raise ValueError("Timing-Datei enthaelt keine Woerter")
    starts = [t["t"] for t in taps]
    ends = starts[1:] + [starts[-1] + tail_dur]
    words_wbounds = [(clean_word(taps[i]["w"]), starts[i], ends[i]) for i in range(n)]

    blocks, cur = [], []
    for wb in words_wbounds:
        if cur and (wb[1] - cur[-1][2] > gap_break or len(cur) >= MAX_WORDS_PER_BLOCK):
            blocks.append(enforce_min_duration(cur))
            cur = []
        cur.append(wb)
    if cur:
        blocks.append(enforce_min_duration(cur))
    return blocks

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
        space_w = font.getlength(" ") * SPACE_FACTOR
        lines, cur, cur_w = [], [], 0
        for w in words:
            ww = font.getlength(w) * (1 + PULSE_AMOUNT)
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
    space_w = font.getlength(" ") * SPACE_FACTOR
    positions, idx, y = {}, 0, 0
    for line in lines:
        x = 0
        for w in line:
            ww = font.getlength(w)
            extra = ww * PULSE_AMOUNT
            x += extra / 2
            positions[idx] = (x, y, w)
            x += ww + extra / 2 + space_w
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

    if srt_path.lower().endswith(".json"):
        print("Getappte Wort-Zeitstempel einlesen (Reel-Timing)...")
        word_blocks = parse_word_timings_json(srt_path)
    else:
        print("SRT einlesen...")
        srt_blocks = parse_srt(srt_path)
        times, rms_s = load_rms(audio_path)
        silences = detect_silences(audio_path)

        print("Wort-Timing pro Block ermitteln (Audio-Energie-Analyse)...")
        word_blocks = []
        for start, end, text in srt_blocks:
            wb = words_for_block(times, rms_s, silences, start, end, text)
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
        print("Verwendung: python3 make_reel.py <video.mp4> <untertitel.srt|timing.json> <output.mp4>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2], sys.argv[3])
