#!/usr/bin/env python3
"""Baut aus assets/radfahrer.svg die Zeiger-Grafik assets/radfahrer.png.

Das fertige PNG liegt im Repository - dieses Skript braucht man nur, wenn man
die Grafik aendern will. Dafuer zusaetzlich noetig:  pip install cairosvg

Aufruf (aus dem Ordner pause-trick):
    python assets/make_pointer.py
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, "radfahrer.svg")
PNG = os.path.join(HERE, "radfahrer.png")

# Doppelte Aufloesung: beim Drehen im Video bleibt die Grafik dadurch sauber.
SCALE = 2
WIDTH, HEIGHT = 700 * SCALE, 900 * SCALE

# Drehpunkt in SVG-Koordinaten (Mitte der Grafik, zwischen den Raedern).
# In der config.yaml muss der Wert in PIXELN DES PNG stehen, also mal SCALE.
PIVOT_SVG = (350, 500)


def main():
    try:
        import cairosvg
    except ImportError:
        print("cairosvg fehlt. Installation:  pip install cairosvg", file=sys.stderr)
        return 1
    cairosvg.svg2png(url=SVG, write_to=PNG, output_width=WIDTH, output_height=HEIGHT)
    print(f"{PNG} geschrieben ({WIDTH}x{HEIGHT})")
    print(f"pivot fuer die config.yaml: "
          f"[{PIVOT_SVG[0] * SCALE}, {PIVOT_SVG[1] * SCALE}]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
