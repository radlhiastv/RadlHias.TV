---
name: radlhias_list_reveal
description: Baut aus einem RadlHias-Reel-Rohvideo ein Reel im "aufbauende Liste"-Stil - mehrere Text-Bloecke (z.B. "dein Zahnarzt: 'Du putzt falsch'") erscheinen nacheinander getimt und bleiben stehen, statt wie beim Yepp-Stil wortweise zu pulsieren. Schrift: Barlow Condensed Bold im RadlHias-Markenstil (Label-Zeile Orange, Aussage/Zitat Navy, Doppelkontur Dunkel+Creme), zentriert, Logo-Wasserzeichen oben, Text beginnt deutlich darunter, kein Filmkorn, keine Neigung. Nachgebaut nach einem Vorbild-Reel (Pointe-Format: "dein X sagt Y" mehrfach hintereinander), dann auf RadlHias-Optik umgestellt. IMMER verwenden, wenn Mathias ein Rohvideo fuer ein Reel mit mehreren nacheinander erscheinenden, stehenbleibenden Text-Bloecken will (Listen-Format, Zitat-Format, "X sagt / Y sagt"-Aufbau) statt Wort-fuer-Wort-Karaoke, oder explizit auf dieses "aufbauende Liste"-Beispiel verweist.
---

# RadlHias Reel - Aufbauende Liste

Zweite Reel-Vorlage neben `radlhias_yepp_subtitle`. Statt Wort-fuer-Wort-Karaoke
wachsen hier mehrere Text-Bloecke nacheinander von oben nach unten in den
Frame und bleiben bis zum Ende stehen - typisch fuer Aufzaehlungs-/Pointe-Reels
("dein Zahnarzt: 'Du putzt falsch' - dein Arzt: 'Du isst falsch' - ...").

## Wann dieser Skill greift

- Mathias will mehrere Text-Bloecke nacheinander einblenden, die stehen bleiben
  (Listen-/Zitat-Format), statt wortweisen Karaoke-Untertiteln
- Er verweist auf das Vorbild-Reel mit "dein Zahnarzt/Arzt/Bankberater/..."
- Er nennt es "die aufbauende Liste" oder "das andere Format"

## Optik (RadlHias-Markenstil, aber ohne Filmkorn/Neigung)

- Schrift: Barlow Condensed Bold (`assets/BarlowCondensed-Bold.ttf`), zentriert
- Farbe: erste Zeile eines Blocks (Label, z.B. "dein Zahnarzt:") in Orange,
  weitere Zeilen (Aussage/Zitat) in Navy - beides mit Doppelkontur
  (dunkler Aussenrand + cremefarbener Innenrand) fuer Lesbarkeit vor
  wechselndem Video-Hintergrund
- Logo-Wasserzeichen oben (`LOGO_Y`); Text beginnt deutlich darunter (`TOP_Y`)
- Bewusst kein Filmkorn/keine Neigung: bei mehreren gleichzeitig sichtbaren
  Bloecken macht das den Text sonst zu unruhig/schwerer lesbar
- Bloecke wachsen von `TOP_Y` nach unten; jeder neue Block blendet kurz ein
  (~0,18s) und bleibt danach stehen
- Rendert standardmaessig OHNE Ton (Original-Tonspur wird verworfen) - Mathias
  vertont/musikalisiert diese Reels separat

## Workflow

1. **Rohvideo besorgen** (wie beim Yepp-Skill).
2. **Text-Bloecke + Timing festlegen.** Mathias liefert entweder den fertigen
   Text pro Block, oder er will, dass ich ihn aus einer Caption/Idee ableite -
   dann RadlHias-Standpunkt/Ton treffen und mit ihm die Bloecke abstimmen
   (`AskUserQuestion`, wenn Wortlaut/Reihenfolge nicht eindeutig ist).
   Timing entweder aus dem gesprochenen Text abschaetzen oder grob gleichmaessig
   über die Videolaenge verteilen - beim Vorbild-Reel liegen die ersten drei
   Bloecke schon in den ersten ~3 Sekunden, der letzte (Pointe-)Block deutlich
   spaeter.
3. **`blocks.json` schreiben**: Liste von `{"start": <Sekunde>, "lines": [...]}`,
   siehe Docstring in `scripts/make_list_reel.py`. Der Abschluss-Block (z.B. eine
   Frage an die Community als Call-to-Action) bekommt `"cta": true` - dadurch
   setzt er sich per `CTA_EXTRA_GAP` sichtbar vom Hauptteil ab, statt direkt
   dranzukleben.
4. **Rendern**:
   ```bash
   python3 scripts/make_list_reel.py <video.mp4> <output.mp4> blocks.json
   ```
5. **Vorschau-Frame pruefen** (ffmpeg `-ss <t> -update 1 -frames:v 1`), bevor das
   fertige Reel an Mathias geht - Zeilenumbrueche und Timing visuell checken.

## Assets

- `assets/BarlowCondensed-Bold.ttf` - selbe Schrift wie im Yepp-Skill/Headlines
  der Website (`style.css`: Barlow Condensed).
- `assets/radlhias_logo_watermark.png` - Logo-Wasserzeichen (150x150, transparent).
