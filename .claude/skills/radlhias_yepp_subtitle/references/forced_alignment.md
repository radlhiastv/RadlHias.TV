# Forced Alignment - der Standardweg für Wort-Timing

**Das ist der erste Weg, nicht die Notlösung.** Er braucht keinen externen
Dienst, kein Konto, keine Zahlungsdaten und keine Handarbeit von Mathias.

## Warum er dem Schätzen überlegen ist

Mathias liefert den gesprochenen Text mit. Damit muss nichts *erraten* werden
(das wäre Spracherkennung), sondern nur *zugeordnet* - die einfachere und
genauere Aufgabe.

Gemessen an `20260911_173558.mp4` (109 Wörter, 43,5 s):

| | Wortanfänge, die fälschlich in einer Atempause liegen |
|---|---|
| Forced Alignment | **5** von 109 |
| lineare Verteilung | 9 von 109 |

Satzenden landen 0,2-0,8 s vor der jeweiligen Atempause - genau richtig.
Die Abweichung zur linearen Verteilung beträgt im Mittel 1,25 s, maximal
2,95 s; das Verfahren tut also substanziell etwas anderes als eine
Gleichverteilung.

## Warum reine Schätzung bei Mathias' Material nicht reicht

Er filmt draußen. Der Abstand zwischen Grundrauschen und Sprache beträgt nur
**2,3:1** (bei Studioton wären es 20:1). Eine Energie-Analyse findet deshalb
nur die ~8 groben Atempausen, keine Wortgrenzen - der längste zusammenhängende
Abschnitt ist 12,3 Sekunden lang. Alles, was daraus abgeleitet wird, bleibt
grob.

## Umgebung vorbereiten

In einer frischen Sandbox fehlt fast alles. Diese Reihenfolge funktioniert:

```bash
apt-get update -qq
apt-get install -y -qq espeak ffmpeg
pip install --break-system-packages numpy librosa av Pillow
```

Stolpersteine, die schon Zeit gekostet haben:

- **`apt-get install ffmpeg` ohne vorheriges `apt-get update` schlägt fehl**
  (404 auf einzelne Pakete).
- Das mit Playwright gelieferte ffmpeg unter `/opt/pw-browsers/` ist zu
  minimal gebaut: **kein AAC, kein H.264, kein lavfi.** Nicht dafür verwenden.
- **Whisper & Co. sind hier nicht nutzbar** - huggingface.co und
  openaipublic.azureedge.net werden vom Egress-Proxy mit 403 geblockt. Gar
  nicht erst versuchen.
- `aeneas` lässt sich nicht bauen (alte C-Extensions). Deshalb die eigene,
  schlanke Umsetzung in `scripts/align_text.py`.

## Ablauf

```bash
# 1. Video holen (Google Drive, siehe references/video_transfer.md)
# 2. Korrigierten Text als text.txt ablegen - reiner Fließtext
python3 scripts/align_text.py video.mp4 text.txt timing.json
# 3. Rendern
python3 scripts/make_reel.py video.mp4 timing.json reel.mp4
```

`align_text.py` schreibt das Ankerformat mit einem Zeitstempel je Wort
(`"source": "forced_alignment"`), das `make_reel.py` direkt entgegennimmt.

**Vor Schritt 2 immer die Rechtschreibung mit Mathias klären.** Automatische
Transkripte enthalten regelmäßig Fehler, die sonst im fertigen Reel stehen -
bei diesem Video z.B. "doing" statt "die" und "dass" statt "das". Das kostet
sonst einen kompletten Renderlauf.

## Wie es funktioniert

1. Jedes Wort einzeln mit `espeak` synthetisieren, Rand-Stille abschneiden.
   Dadurch sind die Wortgrenzen in der Synthese exakt bekannt.
2. MFCC-Merkmale von echter und synthetischer Tonspur berechnen (10 ms Raster).
3. Per DTW (Dynamic Time Warping) beide Spuren aufeinander abbilden.
4. Für jede bekannte Wortgrenze der Synthese die zugehörige Stelle in der
   echten Aufnahme ablesen.

Das Synthese-Tempo wird automatisch an die Aufnahme angeglichen, damit DTW
möglichst wenig strecken muss - das verbessert die Zuordnung spürbar. Bei
Mathias' Sprechtempo (150 Wörter/Minute) landet espeak bei etwa Tempo 213.

## Rechenzeit

Bei 43 s Material: Synthese und Ausrichtung zusammen unter einer Minute. Das
anschließende Rendern in `make_reel.py` dauert deutlich länger (~5 Minuten für
1044 Frames) - das ist der eigentliche Zeitfresser, nicht das Alignment.

## Wenn das Ergebnis an einzelnen Stellen nicht sitzt

Die `timing.json` ist eine schlichte Liste von Wortzeiten und lässt sich von
Hand nachbessern: Unter `anchors` steht je Wort der Index `i` und die Startzeit
`t` in Sekunden. Einzelne `t`-Werte verschieben genügt - die Reihenfolge muss
aufsteigend bleiben, sonst kippt das Rendering die Wörter zurecht.
