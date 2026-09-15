#!/usr/bin/env python3
"""
RadlHias Reel-Vorschaubild (Cover)
===================================
Baut aus einem Motiv (Foto oder generiertes Bild) ein Cover im selben
Markenstil wie die Reels: Barlow Condensed Bold in Versalien, Creme-Text
mit dunkler Kontur, ein oranges Akzentwort, Balken mit der Unterzeile,
Logo, Filmkorn, -2,5 Grad Neigung.

WARUM KEIN VIDEOFRAME
---------------------
Im Instagram-Grid stehen die Cover nebeneinander. Ein Standbild aus dem
Video zeigt dort nur ein Gesicht ohne Kontext - ein gesetztes Cover sagt
auf einen Blick, worum es geht, und haelt das Grid ruhig.

GRID-SICHERER BEREICH
---------------------
Das Cover ist 1080x1920 (Reel-Format), aber im Profil-Grid zeigt Instagram
nur den mittigen 4:5-Ausschnitt (y 285-1635). Alles Wichtige liegt deshalb
innerhalb von GRID_OBEN..GRID_UNTEN.

AUFRUF
------
    python3 make_cover.py <motiv.jpg> <cover.jpg> "ZEILE EINS|AKZENTWORT" "UNTERZEILE" [versatz] [unten|oben]

Das Wort nach dem senkrechten Strich wird orange gesetzt. `versatz` (-1 bis 1)
verschiebt den Bildausschnitt, falls das Motiv nicht mittig sitzt. Das letzte
Argument setzt den Textblock nach oben, wenn das Motiv unten im Bild liegt
(dann wandert auch das Logo nach unten).
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# STYLE PRESET - dieselben Werte wie make_reel.py
# ---------------------------------------------------------------------------
W, H = 1080, 1920
_SKILL_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(_SKILL_ROOT, "assets", "BarlowCondensed-Bold.ttf")
LOGO_PATH = os.path.join(_SKILL_ROOT, "assets", "radlhias_logo_watermark.png")

NAVY = (0x1B, 0x2E, 0x45, 255)
ORANGE = (0xBC, 0x54, 0x12, 255)
CREAM = (0xF5, 0xF0, 0xE6, 255)
DARK = (0x0A, 0x0A, 0x0A, 255)

GRID_OBEN, GRID_UNTEN = 285, 1635   # im Profil-Grid sichtbarer 4:5-Ausschnitt
SEITE = 70                          # Seitenrand fuer den Text
TILT_DEG = -2.5
GRAIN_STRENGTH = 0.16
KONTUR = 9                          # dunkle Aussenkontur der Headline
SCHATTEN = (0, 8)
SCHATTEN_BLUR = 10
SCHATTEN_ALPHA = 170

HEAD_SIZE = 168                     # Startgroesse, wird passend verkleinert
UNTER_SIZE = 58
BALKEN_PAD = (34, 18)
LOGO_Y = 330                        # innerhalb des Grid-Ausschnitts
ABDUNKLUNG = 0.78                   # Verlauf von unten - traegt die Headline
KOPF_ABDUNKLUNG = 0.5               # Verlauf von oben - gibt dem Logo Halt
KOPF_BIS = 700                      # bis wohin der obere Verlauf reicht
LOGO_Y_UNTEN = 1420                 # Logo-Position, wenn der Text oben steht


def motiv_einpassen(pfad, versatz=0.0):
    """Motiv auf 1080x1920 bringen - beschnitten, nichts verzerrt.

    `versatz` verschiebt den Ausschnitt (-1 ganz nach oben, +1 ganz nach
    unten), falls das Wesentliche nicht in der Bildmitte liegt."""
    bild = Image.open(pfad).convert("RGB")
    ziel = W / H
    b, h = bild.size
    if b / h > ziel:
        neu_b = int(h * ziel)
        links = int((b - neu_b) / 2 * (1 + versatz))
        links = max(0, min(links, b - neu_b))
        bild = bild.crop((links, 0, links + neu_b, h))
    else:
        neu_h = int(b / ziel)
        oben = int((h - neu_h) / 2 * (1 + versatz))
        oben = max(0, min(oben, h - neu_h))
        bild = bild.crop((0, oben, b, oben + neu_h))
    return bild.resize((W, H), Image.LANCZOS).convert("RGBA")


def abdunkeln_oben(bild, bis_y, staerke=ABDUNKLUNG):
    """Spiegelbild von `abdunkeln` fuer Entwuerfe mit Text im oberen Drittel.

    Sinnvoll, wenn das Wesentliche des Motivs unten liegt und vom Text sonst
    verdeckt wuerde."""
    maske = Image.new("L", (1, H), 0)
    px = maske.load()
    for y in range(H):
        oben = staerke * min((bis_y - y) / max(bis_y, 1) * 1.9, 1.0) if y < bis_y else 0
        unten = 0.35 * (y - (H - 420)) / 420 if y > H - 420 else 0
        px[0, y] = int(255 * min(max(oben, unten, 0), 1.0))
    maske = maske.resize((W, H))
    dunkel = Image.new("RGBA", (W, H), (0x0A, 0x14, 0x1E, 255))
    dunkel.putalpha(maske)
    return Image.alpha_composite(bild, dunkel)


def abdunkeln(bild, ab_y, staerke=ABDUNKLUNG):
    """Nach unten hin abdunkeln, damit die Headline sicher steht.

    Ohne das steht der Text auf dem unruhigen Werkstatthintergrund und wird
    im Grid zur Unruhe - mit Verlauf liest er sich auf einen Blick."""
    maske = Image.new("L", (1, H), 0)
    px = maske.load()
    for y in range(H):
        oben = 0
        if y < KOPF_BIS:                      # Verlauf von oben fuer das Logo
            oben = KOPF_ABDUNKLUNG * (1 - y / KOPF_BIS)
        unten = 0
        if y > ab_y:                          # Verlauf von unten fuer den Text
            unten = staerke * min((y - ab_y) / max(H - ab_y, 1) * 1.9, 1.0)
        px[0, y] = int(255 * min(max(oben, unten), 1.0))
    maske = maske.resize((W, H))
    dunkel = Image.new("RGBA", (W, H), (0x0A, 0x14, 0x1E, 255))
    dunkel.putalpha(maske)
    return Image.alpha_composite(bild, dunkel)


def umbrechen(woerter, font, max_b):
    """Woerter auf Zeilen verteilen, ohne die Breite zu sprengen."""
    zeilen, cur = [], []
    for w in woerter:
        probe = " ".join(cur + [w])
        if cur and font.getlength(probe) > max_b:
            zeilen.append(cur)
            cur = [w]
        else:
            cur.append(w)
    if cur:
        zeilen.append(cur)
    return zeilen


def headline_layer(text, akzent):
    """Headline setzen - Akzentwort orange, Rest creme, mit Doppelkontur."""
    max_b = W - SEITE * 2 - 40
    woerter = text.split()
    size = HEAD_SIZE
    while size > 60:
        font = ImageFont.truetype(FONT_PATH, size)
        zeilen = umbrechen(woerter, font, max_b)
        if len(zeilen) <= 2 and all(font.getlength(" ".join(z)) <= max_b for z in zeilen):
            break
        size -= 4
    font = ImageFont.truetype(FONT_PATH, size)
    zeilen = umbrechen(woerter, font, max_b)

    zeilen_h = int(size * 1.02)
    rand = KONTUR + 30
    hoehe = zeilen_h * len(zeilen) + rand * 2
    layer = Image.new("RGBA", (W, hoehe), (0, 0, 0, 0))
    schatten = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(layer), ImageDraw.Draw(schatten)

    for i, zeile in enumerate(zeilen):
        x, y = SEITE, rand + i * zeilen_h
        ds.text((x + SCHATTEN[0], y + SCHATTEN[1]), " ".join(zeile), font=font,
                fill=(0, 0, 0, SCHATTEN_ALPHA), stroke_width=KONTUR,
                stroke_fill=(0, 0, 0, SCHATTEN_ALPHA))
        akzent_woerter = set(akzent.upper().split()) if akzent else set()
        for wort in zeile:
            farbe = ORANGE if wort.upper() in akzent_woerter else CREAM
            d.text((x, y), wort, font=font, fill=farbe,
                   stroke_width=KONTUR, stroke_fill=DARK)
            x += font.getlength(wort + " ")

    schatten = schatten.filter(ImageFilter.GaussianBlur(SCHATTEN_BLUR))
    return Image.alpha_composite(schatten, layer), size


def balken_layer(text):
    """Oranger Balken mit der Unterzeile."""
    font = ImageFont.truetype(FONT_PATH, UNTER_SIZE)
    bb = font.getbbox(text)
    b = int(bb[2] - bb[0] + BALKEN_PAD[0] * 2)
    h = int(UNTER_SIZE + BALKEN_PAD[1] * 2)
    rand = 26
    layer = Image.new("RGBA", (b + rand * 2, h + rand * 2), (0, 0, 0, 0))
    schatten = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(schatten).rectangle(
        [rand + SCHATTEN[0], rand + SCHATTEN[1], rand + b + SCHATTEN[0], rand + h + SCHATTEN[1]],
        fill=(0, 0, 0, SCHATTEN_ALPHA))
    schatten = schatten.filter(ImageFilter.GaussianBlur(SCHATTEN_BLUR))
    d = ImageDraw.Draw(layer)
    d.rectangle([rand, rand, rand + b, rand + h], fill=ORANGE, outline=DARK, width=3)
    d.text((rand + BALKEN_PAD[0] - bb[0], rand + BALKEN_PAD[1] - bb[1]), text,
           font=font, fill=CREAM)
    return Image.alpha_composite(schatten, layer)


def filmkorn(bild, staerke=GRAIN_STRENGTH):
    rng = np.random.default_rng(7)
    korn = rng.normal(0, 255 * staerke * 0.35, (H, W))
    arr = np.asarray(bild.convert("RGB")).astype(np.float32)
    arr = np.clip(arr + korn[:, :, None], 0, 255).astype(np.uint8)
    return Image.fromarray(arr).convert("RGBA")


def main(motiv, ziel, headline, unterzeile, versatz="0", pos="unten"):
    akzent = None
    if "|" in headline:
        headline, akzent = [t.strip() for t in headline.split("|", 1)]
        headline = f"{headline} {akzent}".strip()

    bild = motiv_einpassen(motiv, float(versatz))
    kopf, size = headline_layer(headline.upper(), akzent.upper() if akzent else None)
    balken = balken_layer(unterzeile.upper())

    # Textblock so setzen, dass er im Grid-Ausschnitt sitzt
    block_h = kopf.height + balken.height
    if pos == "oben":
        oben = GRID_OBEN + 120
        bild = abdunkeln_oben(bild, oben + block_h + 200)
        logo_y = LOGO_Y_UNTEN
    else:
        oben = GRID_UNTEN - 120 - block_h
        bild = abdunkeln(bild, max(oben - 260, GRID_OBEN))
        logo_y = LOGO_Y

    kopf_rot = kopf.rotate(-TILT_DEG, expand=True, resample=Image.BICUBIC)
    balken_rot = balken.rotate(-TILT_DEG, expand=True, resample=Image.BICUBIC)
    bild.alpha_composite(kopf_rot, (-(kopf_rot.width - W) // 2, oben))
    bild.alpha_composite(balken_rot, (SEITE - 26, oben + kopf.height - 10))

    # Logo mit weichem Schatten - sonst geht es auf dem unruhigen
    # Werkstatthintergrund unter, anders als im Video auf ruhigem Grund.
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_x = (W - logo.width) // 2
    schein = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    schein.paste(Image.new("RGBA", logo.size, (0, 0, 0, 190)),
                 (logo_x, logo_y + 4), logo.split()[3])
    bild = Image.alpha_composite(bild, schein.filter(ImageFilter.GaussianBlur(14)))
    bild.alpha_composite(logo, (logo_x, logo_y))

    bild = filmkorn(bild)
    bild.convert("RGB").save(ziel, quality=94)
    print(f"Fertig: {ziel}  (Headline {size} px)")


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6, 7):
        raise SystemExit(__doc__)
    main(*sys.argv[1:7])
