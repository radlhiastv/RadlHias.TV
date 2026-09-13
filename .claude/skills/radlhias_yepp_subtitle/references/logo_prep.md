# Logo für Wasserzeichen aufbereiten

Wenn Mathias ein neues Logo schickt, so aufbereiten (Python/PIL):

```python
from PIL import Image

im = Image.open("neues_logo.png").convert("RGBA")
w = 150
h = int(im.height * (w / im.width))
im = im.resize((w, h), Image.LANCZOS)
r, g, b, a = im.split()
a = a.point(lambda p: int(p * 0.8))  # 80% Deckkraft
im.putalpha(a)
im.save("assets/radlhias_logo_watermark.png")
```

Voraussetzung: das Logo sollte transparenten Hintergrund haben (PNG mit Alpha-
Kanal), sonst zeigt das Wasserzeichen einen weißen/farbigen Kasten. Falls das
Ausgangslogo keinen transparenten Hintergrund hat, vorher mit Mathias klären, ob
er eine freigestellte Version hat, oder den Hintergrund per Bildbearbeitung
entfernen.

`make_reel.py` positioniert das Logo automatisch oben mittig (y=140px vom oberen
Rand, horizontal zentriert) - das muss bei einem Logo-Wechsel nicht angepasst
werden, nur die Datei unter `assets/radlhias_logo_watermark.png` ersetzen.
