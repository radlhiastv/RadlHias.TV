# Pause-Trick-Video-Generator

Erzeugt ein Hochkant-Video (1080x1920, 30 fps, MP4/H.264) fuer Instagram Reels,
bei dem ein Zeiger in der Mitte scheinbar flott im Kreis rotiert - und **egal
wann man pausiert, zeigt er immer auf ein Ziel-Label**. Es gibt im ganzen Video
keinen Frame, in dem der Zeiger auf ein Koeder-Label oder ins Leere zeigt.
Das wird nicht gehofft, sondern nachgerechnet: ein Pruefskript kontrolliert
jeden einzelnen Frame.

Mitgeliefert sind zwei Konfigurationen:

| Datei | Was drin ist |
|---|---|
| `config.yaml` | neutrales Beispiel ("TREFFER" / "DANEBEN"), Modus `follow` |
| `config-radlhias.yaml` | RadlHias-Variante im Stil des Vorlagen-Videos: "RAD FAHREN" gegen "IM HAUSHALT HELFEN" und "EINKAUFEN", Modus `jump` |

---

## 1. Installation

Gebraucht werden Python 3.9+ und ffmpeg.

**Python-Pakete:**

```bash
cd pause-trick
python -m venv .venv && source .venv/bin/activate   # optional, aber sauber
pip install -r requirements.txt                     # Pillow + PyYAML
```

**ffmpeg:**

```bash
# macOS (Homebrew)
brew install ffmpeg

# Windows (winget)
winget install Gyan.FFmpeg
# oder: https://www.gyan.dev/ffmpeg/builds/ herunterladen und den Ordner
# ...\bin in die PATH-Variable eintragen

# Debian/Ubuntu
sudo apt install ffmpeg
```

Pruefen, ob ffmpeg gefunden wird: `ffmpeg -version`.

---

## 2. Aufruf

```bash
python make_video.py --config config.yaml
```

Das macht in einem Rutsch:

1. Config laden und auf Unstimmigkeiten pruefen
2. Zeigerwinkel fuer jeden Frame aus der Geschwindigkeitskurve berechnen
3. Label-Positionen bestimmen
4. jeden Frame einzeln rendern (keine Interpolation, keine Ueberblendung,
   kein Motion-Blur ueber mehrere Frames)
5. die Winkel nach `output/angles.json` schreiben
6. per ffmpeg nach `output/pause_trick.mp4` exportieren
7. die Pruefung laufen lassen (siehe Punkt 4)

Nuetzliche Schalter:

| Schalter | Wirkung |
|---|---|
| `--out mein_video.mp4` | anderer Ziel-Dateiname |
| `--no-encode` | nur Frames rendern, kein ffmpeg |
| `--keep-frames` | PNG-Sequenz nach dem Export behalten |
| `--no-check` | Pruefung ueberspringen |

RadlHias-Version:

```bash
python make_video.py --config config-radlhias.yaml
# -> output-radlhias/pause_trick.mp4
```

---

## 3. Die Konfiguration

Alles ist optional - was in der YAML fehlt, kommt aus den Standardwerten in
`pausetrick/config.py`. Pfade duerfen relativ zur config.yaml stehen.

### Texte und Labels

| Feld | Bedeutung |
|---|---|
| `target_label` | Text der Ziel-Labels. Hier landet der Zeiger immer. Zeilenumbruch mit `\n` |
| `decoy_label` | Text der Koeder-Labels. Entweder ein Text oder eine **Liste** - dann werden die Texte reihum auf die Koeder-Plaetze verteilt |
| `target_count` | Anzahl der Ziel-Labels |
| `decoy_count` | Anzahl der Koeder-Labels |

Wichtig: Ziel und Koeder muessen **gleich aussehen** (gleiche Schrift, gleiche
Farbe). Sobald sich das Ziel farblich abhebt, ist der Trick durchschaut.
Deshalb steht `font.decoy_color` standardmaessig auf `null` (= gleiche Farbe).

### Bewegung

| Feld | Bedeutung |
|---|---|
| `mode` | `follow` (Standard) oder `jump` - siehe unten |
| `direction` | `cw` = im Uhrzeigersinn, `ccw` = dagegen |
| `start_angle` | Startwinkel in Grad, 0 = 12 Uhr |
| `jump_min_step` | nur Modus `jump`: `1` = jeder Frame springt garantiert weiter, `0` = der Zeiger darf kurz auf einem Ziel stehen bleiben |
| `speed_curve` | Liste von Stuetzpunkten `{ t, dps }`, `t` = normierte Zeit 0..1, `dps` = Grad pro Sekunde. Dazwischen wird linear interpoliert |

**Modus `follow` (Standard):** Der Zeiger dreht sich kontinuierlich. In jedem
Frame wird ein Ziel-Label exakt dorthin gesetzt, wohin der Zeiger zeigt -
samt passender Textdrehung. Die Koeder verteilen sich auf die uebrigen
Positionen. Vorteil: butterweiche Drehung, beliebig langsames Ausdrehen.
Nachteil: der ganze Ring wandert sichtbar mit.

**Modus `jump`:** Die Ziel-Labels stehen fest im Kreis verteilt, die Koeder
dazwischen. Der Zeiger springt pro Frame zum naechsten Ziel-Label in
Drehrichtung. Vorteil: der Ring steht vollkommen still, das wirkt wie eine
echte Glueckskreis-Rotation (so ist auch das Vorlagen-Video gebaut).
Nachteil: langsam geht nicht beliebig - siehe naechster Absatz.

**Das Tempo-Limit im Modus `jump`:** Die Rasterweite betraegt
`360 / target_count` Grad. Bei 4 Ziel-Labels sind das 90 Grad pro Sprung, bei
30 fps also mindestens 2700 Grad pro Sekunde. Verlangt die `speed_curve`
weniger, bekommst du eine **Warnung** im Terminal, inklusive des
Mindestwertes und der Zahl der betroffenen Frames. Was dann passiert, haengt
von `jump_min_step` ab:

* `jump_min_step: 1` - es wird auf einen Sprung pro Frame aufgerundet. Der
  Zeiger springt dort schneller als gewuenscht, bleibt aber nie stehen.
* `jump_min_step: 0` - der Zeiger darf mehrere Frames auf demselben Ziel
  stehen. Genau so macht es das Vorlagen-Video (dort ca. 2 Frames). Gewarnt
  wird erst, wenn er laenger als 3 Frames steht, denn ab da sieht man es.

Mehr Ziel-Labels = feineres Raster = langsameres Ausdrehen moeglich.

### Layout des Rings

| Feld | Bedeutung |
|---|---|
| `layout.radius` | Abstand Labelmitte zur Bildmitte in Pixel |
| `layout.center_y_offset` | Ring nach unten (positiv) oder oben (negativ) schieben |
| `layout.min_separation` | Mindestabstand Koeder zu Ziel in Grad |
| `layout.decoy_mode` | nur Modus `follow`: `ring` = Koeder wandern mit (immer ueberlappungsfrei), `fixed` = Koeder stehen fest und weichen nur aus, wenn das Ziel zu nah kommt |
| `layout.base_offset` | Grunddrehung des Rings in Grad |
| `layout.show_ring` | dezenten Kreis mitzeichnen (`ring_color`, `ring_width`) |

### Zeiger

| Feld | Bedeutung |
|---|---|
| `pointer.type` | `arrow` (gezeichneter Pfeil) oder `png` (eigene Grafik) |
| `pointer.png` | Pfad zur PNG mit transparentem Hintergrund |
| `pointer.pivot` | Drehpunkt als `[x, y]` **in Pixelkoordinaten der PNG** |
| `pointer.png_scale` | Grafik skalieren (1.0 = Originalgroesse) |
| `pointer.base_angle` | Korrektur in Grad, falls die Grafik nicht nach oben zeigt |
| `pointer.length`, `tail`, `width`, `head_width`, `head_length` | Masse des gezeichneten Pfeils in Pixel |
| `pointer.color` | Pfeilfarbe |
| `pointer.hub_radius`, `hub_color` | Nabe in der Mitte, `0` = aus |

Die PNG wird so eingesetzt, dass der angegebene Drehpunkt genau auf der
Ringmitte liegt - gedreht wird also um diesen Punkt, nicht um die Bildmitte
der Grafik.

### Ueberschrift und Mittel-Grafik

| Feld | Bedeutung |
|---|---|
| `headline.text` | Text oben im Bild, `\n` fuer Zeilenumbruch, `null` = keine Ueberschrift |
| `headline.font_path`, `size`, `color`, `y`, `line_spacing` | Schrift, Groesse, Farbe, Oberkante in Pixel, Zeilenabstand |
| `center_image.path` | statische Grafik in der Mitte (z.B. Logo). Liegt **ueber** dem Zeiger, der Pfeil kommt also dahinter hervor |
| `center_image.width` | Zielbreite in Pixel, die Hoehe skaliert mit |

### Typografie

| Feld | Bedeutung |
|---|---|
| `font.path` | TTF-Pfad. `null` = Automatik (DejaVu Sans Bold o.ae.) |
| `font.size`, `font.color`, `font.decoy_color` | Groesse und Farben |
| `font.stroke_width`, `stroke_color` | Kontur um den Text |
| `font.orientation` | `radial` (Text laeuft nach aussen), `tangential` (Text folgt dem Kreis), `upright` (alles waagrecht) |
| `font.orientation_strength` | `1.0` = volle Drehung, `0.0` = alles waagrecht, dazwischen gedaempft. Die Vorlage liegt bei ca. `0.6` |
| `font.jitter` | leichte zufaellige Schraegstellung fuer den handgezeichneten Look |
| `font.jitter_max` | maximale Schraegstellung in Grad |
| `seed` | Zufallsbasis. Gleicher Seed = exakt gleiches Bild |

Die Schraegstellung ist pro Label **fest**, nicht pro Frame zufaellig - sonst
wuerden die Labels im Video zappeln.

Mitgeliefert ist `fonts/BigShoulders-Bold.ttf` (SIL Open Font License, siehe
`fonts/BigShoulders-OFL.txt`) - eine schmale, fette Schrift nahe am
Vorlagen-Look. Fuer den RadlHias-Markenauftritt einfach Barlow Condensed Bold
nach `fonts/` legen und `font.path` bzw. `headline.font_path` umbiegen.

### Video und Export

| Feld | Bedeutung |
|---|---|
| `video.width`, `height` | Standard 1080 x 1920 (9:16) |
| `video.fps` | Standard 30 |
| `video.duration` | Laenge in Sekunden |
| `video.crf` | H.264-Qualitaet, kleiner = besser. 18 bis 23 sind sinnvoll |
| `video.preset` | ffmpeg-Preset (`medium`, `slow`, ...) |
| `video.audio` | Pfad zu einer Audiodatei oder `null`. Der Ton wird hart auf die Videolaenge gekuerzt |
| `video.audio_bitrate` | z.B. `"192k"` |
| `output_dir` | Ausgabeordner |

Exportiert wird H.264 in `yuv420p` mit `+faststart` - das frisst Instagram
ohne Murren.

---

## 4. Die Pruefung

Nach jedem Rendern laeuft die Pruefung automatisch. Separat geht das so:

```bash
python check_frames.py --config config.yaml
```

Geprueft wird gegen `output/angles.json`, also gegen die beim Rendern
gespeicherten Winkel jedes einzelnen Frames:

1. **Liegt in jedem Frame ein Ziel-Label unter dem Zeiger?** Erlaubte
   Abweichung: `check.tolerance`, Standard 3 Grad.
2. **Liegt kein Koeder zu nah am Zeiger?** Sonst waere die Sache optisch
   zweideutig. Mindestabstand: `check.decoy_clearance`, bei `null`
   automatisch das Doppelte der Toleranz (mindestens 8 Grad).

Zusaetzlich werden `check.sample_count` zufaellige Frames (Standard 10) neu
gerendert und als PNG nach `output/check/` gelegt - mit eingezeichnetem
Zeigerstrahl, Frame-Nummer und gemessener Abweichung, damit du es auch mit
eigenen Augen kontrollieren kannst. Das Rendern ist deterministisch, die
Stichproben zeigen also exakt das, was im Video steckt.

Bei einem Fehler nennt das Skript **die betroffenen Frame-Nummern** samt
gemessener Abweichung und endet mit Rueckgabewert 1 (gut fuer Automatisierung).

Schalter von `check_frames.py`:

| Schalter | Wirkung |
|---|---|
| `--tolerance 1.5` | andere Toleranz als in der Config |
| `--samples 20` | mehr oder weniger Stichproben |
| `--no-overlay` | Stichproben ohne Messlinie und Zahlen |
| `--angles pfad/angles.json` | andere Winkeldatei pruefen |

---

## 5. Warnungen, die das Tool von sich aus ausgibt

* **zu langsam im Modus `jump`** - die Geschwindigkeitskurve verlangt weniger
  als einen Rastersprung pro Frame (siehe oben).
* **Zeiger steht zu lange** - bei `jump_min_step: 0`, wenn er laenger als
  3 Frames auf derselben Position bleibt.
* **Koeder zu nah am Ziel** - `min_separation` wird nicht eingehalten.
* **Labels ueberlappen sich** - samt Angabe, um wie viel Grad, und was hilft
  (Schrift kleiner, Radius groesser, weniger Koeder).
* **Schrift oder Audio nicht gefunden** - es wird ein Ersatz genommen bzw.
  ohne Ton gebaut, aber du erfaehrst es.

---

## 6. Aufbau des Codes

```
pause-trick/
├── make_video.py          # Einstieg: rendern + exportieren + pruefen
├── check_frames.py        # Pruefskript allein aufrufbar
├── config.yaml            # neutrales Beispiel
├── config-radlhias.yaml   # RadlHias-Variante im Vorlagen-Stil
├── requirements.txt
├── assets/                # Logo und Mittel-Badge
├── fonts/                 # mitgelieferte Schrift (OFL)
└── pausetrick/
    ├── config.py          # Config laden, auffuellen, pruefen
    ├── geometry.py        # Winkelmathematik: Kurve, Zeiger, Label-Positionen
    ├── render.py          # Frames zeichnen (Pillow)
    ├── verify.py          # Winkelkontrolle und Stichproben
    └── video.py           # ffmpeg-Export
```

Der ganze Trick steckt in `geometry.py`: dort entstehen pro Frame der
Zeigerwinkel und die Label-Winkel, und zwar so, dass der Zeiger
konstruktionsbedingt auf einem Ziel liegt. `render.py` malt nur noch, was
`geometry.py` vorgibt. Genau diese Winkel landen in `angles.json` und werden
von `verify.py` noch einmal unabhaengig nachgerechnet.
