---
name: radlhias_yepp_subtitle
description: Baut aus einem RadlHias-Reel-Rohvideo + dem gesprochenen Text ein fertiges Instagram-Reel im RadlHias-Markenstil - Wort-fuer-Wort-Karaoke-Untertitel (aktuelles Wort wird groesser/orange), Navy/Orange/Creme-Farbschema, Doppelkontur, Schatten, Filmkorn, -2,5 Grad Neigung, Logo-Wasserzeichen, Fade-to-Black am Ende. Das Wort-Timing entsteht per Forced Alignment aus Text + Tonspur (scripts/align_text.py) - lokal, ohne externen Dienst und ohne Handarbeit. IMMER verwenden, wenn Mathias ein Rohvideo + gesprochenen Text (oder SRT oder Yepp-Timer-Zeitstempel) fuer ein RadlHias-Reel schickt, "Yepp" oder "Reel" erwaehnt, nach seiner Untertitel-Vorlage fragt, oder Text bittet "wie gewohnt" oder "wie immer" einzubauen.
---

# RadlHias Yepp-Untertitel

Erzeugt automatisch RadlHias-Reels im etablierten Karaoke-Untertitel-Stil aus einem
Rohvideo + dem gesprochenen Text. **Mathias muss nur filmen und den Text liefern** -
Wort-Timing, Text-Aufteilung und das komplette visuelle Styling laufen automatisch.

Das Wort-Timing entsteht per Forced Alignment aus Text und Tonspur
(`scripts/align_text.py`, siehe `references/forced_alignment.md`): lokal, ohne
externen Dienst, ohne Konto, ohne Handarbeit. Das ist der Standardweg.

## Wann dieser Skill greift

- Mathias schickt ein Rohvideo (Selfie-Video, RadlHias-Tipp) + den gesprochenen
  Text (oder eine .srt-Datei)
- Er erwähnt "Yepp", "Reel", "Untertitel wie gewohnt/wie immer/wie beim letzten Mal"
- Er fragt nach einem neuen RadlHias-Reel im bekannten Stil

## Workflow

1. **Video prüfen**: liegt eine Videodatei vor? Falls nicht, nachfragen. Videos über
   dem Chat-Upload-Limit: Google Drive freigeben lassen und per Composio-Verbindung
   (googledrive) holen, siehe `references/video_transfer.md`.
2. **Gesprochenen Text besorgen.** Mathias schickt ihn normalerweise mit. Falls
   nicht: danach fragen - er ist die Grundlage des gesamten Verfahrens. Eine SRT
   tut es auch (Text daraus extrahieren).
3. **Rechtschreibfehler korrigieren - VOR dem Alignment.** Automatische
   Transkripte enthalten regelmaessig Fehler, die sonst im fertigen Reel stehen
   (bei 20260911_173558.mp4 z.B. "doing" statt "die", "dass" statt "das").
   Offensichtliches selbst korrigieren, Unklares mit Mathias abklaeren. Ein
   uebersehener Fehler kostet einen kompletten Renderlauf von ~5 Minuten.
4. **Wort-Timing per Forced Alignment erzeugen** - der Standardweg, siehe
   `references/forced_alignment.md`:
   ```bash
   apt-get update -qq && apt-get install -y -qq espeak ffmpeg
   pip install --break-system-packages numpy librosa av Pillow
   python3 scripts/align_text.py <video.mp4> <text.txt> timing.json
   ```
   Text und Tonspur sind beide bekannt - es muss also nichts erraten, sondern
   nur zugeordnet werden. Laeuft lokal, braucht keinen Dienst, kein Konto und
   keine Zahlungsdaten (das ist Mathias ausdruecklich wichtig). Dauert unter
   einer Minute.
   **Nicht versuchen:** Whisper und andere Modelle - huggingface.co und
   openaipublic.azureedge.net sind vom Egress-Proxy geblockt (403).
   **Nicht verwenden:** das ffmpeg unter `/opt/pw-browsers/` - zu minimal
   gebaut, kein AAC/H.264.
5. **Reel rendern**:
   ```bash
   python3 scripts/make_reel.py <video.mp4> <timing.json ODER untertitel.srt> <output.mp4>
   ```
   Das Skript erkennt am Dateisuffix, welcher Pfad gemeint ist. Es braucht `ffmpeg`,
   sowie die Python-Pakete `numpy`, `librosa`, `Pillow`
   (mit `pip install --break-system-packages numpy librosa Pillow` installieren,
   falls nicht vorhanden).
   Läuft bei ~30s Videomaterial ein paar Minuten (Frame-Rendering); bei Timeout im
   Sandbox-Tool läuft es im Hintergrund trotzdem oft zuende - Fortschritt in
   `<output-ordner>/_reel_tmp/frames/` prüfen und den letzten Zusammensetz-Schritt
   notfalls manuell mit ffmpeg nachholen (siehe `references/manual_assembly.md`).
6. **Stichprobe prüfen**: 2-3 Frames aus dem Ergebnis exportieren und ansehen
   (Timing, Textüberladung, Logo-Position, CTA-Einblender), bevor an Mathias
   übergeben wird. Einen Frame aus dem CTA-Fenster (Sekunde 15-18,5) immer
   dabei haben.
7. **Ausgeben**: fertige Datei nach `/mnt/user-data/outputs/` kopieren und mit
   `present_files` zeigen. Bei über 30MB vor dem Versand komprimieren (siehe
   `references/manual_assembly.md`).

## Die anderen Wege (nur noch Ausnahmefälle)

**Yepp-Timer** (https://radlhias.tv/yepp-timer/): Seit dem Forced Alignment
**Korrekturwerkzeug, nicht mehr Haupteingabe.** Sinnvoll, wenn das Alignment an
einzelnen Stellen danebenliegt - Mathias kann die Marken dort von Hand
verschieben (siehe `references/yepp_timer.md`). Ihn nicht mehr unaufgefordert
als ersten Weg vorschlagen; das ist unnötige Handarbeit.

**Externe Transkriptionsdienste** (Gladia, Deepgram über Composio): **Nicht
vorschlagen.** Mathias will ausdrücklich keinen Dienst, bei dem er ein Abo
abschließen oder Zahlungsdaten angeben muss. Das Forced Alignment ist ohnehin
der bessere Weg, weil der Text bereits bekannt ist.

**SRT + Audio-Energie-Schätzung**: Nur wenn kein Text zu bekommen ist. Liegt
nur Fließtext vor (eingesprochen/eingetippt, keine SRT)? Erst die Tonspur mit
`ffmpeg -i video.mp4 -vn -ar 16000 -ac 1 audio.wav` extrahieren, dann grobe
Sprechabschnitte per `ffmpeg ... silencedetect` oder anhand der Zeilenumbrüche in
Sprechabschnitte gliedern und daraus eine einfache `.srt`-Datei bauen (Format
unten). Das Skript übernimmt danach selbst die feinere Wort-für-Wort-Ausrichtung
per Audio-Energie-Analyse (Mikropausen-Erkennung per ffmpeg `silencedetect`,
Wörter werden dann INNERHALB jedes echten Sprechabschnitts verteilt - siehe
`Bekannte Grenzen` unten für die Genauigkeitsgrenzen dieses Wegs).

### SRT-Format (falls selbst gebaut)

```
1
00:00:00,930 --> 00:00:03,590
Erster Satz oder Sprechabschnitt.

2
00:00:03,930 --> 00:00:08,760
Zweiter Abschnitt.
```

Grobe Zeitstempel reichen - das Skript verfeinert die Wort-Timings selbst anhand
der Tonspur. Blöcke müssen nicht Satz-für-Satz sein; das Skript teilt ohnehin zu
volle Blöcke (>8 Wörter) automatisch weiter auf.

## Logo austauschen

Standardmäßig liegt Mathias' RadlHias-Logo bereits fertig aufbereitet unter
`assets/radlhias_logo_watermark.png` (150px Breite, 80% Deckkraft, oben mittig
positioniert). Wenn er ein neues/anderes Logo schickt:

1. Neues Logo (idealerweise transparentes PNG, möglichst quadratisch) mit PIL auf
   150px Breite skalieren und Alpha auf 80% setzen (siehe `references/logo_prep.md`
   für den genauen Code).
2. Als `assets/radlhias_logo_watermark.png` speichern (alte Datei ersetzen).
3. Kein Code-Änderung nötig - `make_reel.py` liest die Datei automatisch von dort.

## Stil-Werte (bei Wunsch nach Anpassung)

Alle Farb-, Schrift- und Timing-Werte stehen gesammelt oben in `scripts/make_reel.py`
unter dem Kommentar `STYLE PRESET`. Nichts davon woanders duplizieren - Änderungen
immer nur dort vornehmen, damit die Vorlage konsistent bleibt:

- Navy `#1B2E45` (Grundtext), Orange `#BC5412` (aktuelles/gesprochenes Wort),
  Creme-Kontur `#F5F0E6`, dunkle Außenkontur `#0A0A0A`
- Schrift: Barlow Condensed Bold (`assets/BarlowCondensed-Bold.ttf`)
- Neigung -2,5°, Block-Deckkraft 93%, Filmkorn-Stärke 0,16
- Karaoke-Puls: aktuelles Wort +25% Größe, sinusförmig ein-/ausblendend
- max. 8 Wörter pro Textblock (+1 Wort Überhang, um Sätze nicht zu zerreißen),
  Mindestanzeigedauer 0,22s pro Wort
- 1080x1920, 24fps, Logo oben mittig, letzte Sekunde Fade-to-Black
- Call-to-Action-Einblender ab Sekunde 15, 3,5 s Standzeit

## Blockaufteilung folgt den Satzgrenzen

Die Anzeige-Blöcke brechen **nicht** stur nach 8 Wörtern, sondern entlang der
Satzzeichen - sonst rutscht das letzte Wort eines Satzes allein auf die nächste
Seite ("... leisten" / "kannst.") und liest sich wie ein Fehler. Die Reihenfolge:

1. Echte Sprechpausen (> 0,5 s) trennen immer.
2. Innerhalb einer Sprechgruppe wird an Satzenden (`.!?…`) geschnitten.
3. Kurze aufeinanderfolgende Sätze teilen sich einen Block, solange zusammen
   höchstens `MAX_WORDS_PER_BLOCK` Wörter zusammenkommen.
4. Ein Satz darf `SATZ_UEBERHANG` Wörter über das Limit gehen, statt zerrissen
   zu werden (Schrift wird dann automatisch etwas kleiner - bei 9 Wörtern 70
   statt 80 px, was im fertigen Reel nicht auffällt).
5. Nur wirklich lange Sätze werden geteilt, und zwar in **gleich große** Teile -
   damit nie ein Ein-Wort-Rest übrig bleibt.

Wichtig: Die Satzzeichen müssen im Text stehen, damit das greift. `clean_word`
entfernt sie erst beim Rendern; erkannt werden sie vorher.

## Call-to-Action-Einblender

Jedes Reel bekommt automatisch einen Follow-Hinweis eingeblendet. Werte stehen
im `STYLE PRESET` von `make_reel.py` unter `CTA_*`:

- **Wann:** ab Sekunde 15 (`CTA_AT`), 3,5 s lang (`CTA_DUR`). Bewusst frueh -
  ein Hinweis im Abspann erreicht nur die Zuschauer, die ohnehin schon bis zum
  Ende geblieben sind. Bei Clips unter ~20 s rutscht er automatisch auf 40 %
  der Laufzeit.
- **Wo:** oben unter dem Logo (`CTA_Y = 350`). Nicht unten - dort ueberdeckt
  Instagram das Bild mit Caption, Profilname und Buttons.
- **Was:** zwei kurze Zeilen (`CTA_LINES`), Navy-Frage + oranger Handle.
  Laenger als ~4 Woerter pro Zeile liest in 3,5 s niemand mit.
- **Aussehen:** Creme-Balken mit dunkler Kontur, Schatten, Filmkorn und
  derselben -2,5-Grad-Neigung wie der Untertitelblock, sanft ein- und
  ausgeblendet mit kleinem Aufwaertsversatz.

Abschalten fuer ein einzelnes Reel: `CTA_ENABLED = False`. Anderer Text (z. B.
Hinweis auf die Werkstatt statt auf den Kanal): nur `CTA_LINES` aendern.

## Bekannte Grenzen (nur relevant für den SRT-Fallback-Pfad)

Mit dem Forced Alignment entfallen diese Einschränkungen weitgehend, da Text
und Tonspur dort direkt aufeinander abgebildet werden statt zu schätzen.

- Wort-Timing basiert auf Audio-Energie-Analyse (echte Mikropausen per ffmpeg
  `silencedetect`, Wörter werden innerhalb jedes gefundenen Sprechabschnitts
  proportional zur Zeichenlänge verteilt), nicht auf echter Spracherkennungs-
  Ausrichtung - bei sehr schnellem/undeutlichem Sprechen ohne erkennbare interne
  Pausen (langer, durchgehend gesprochener Block) kann das Timing innerhalb dieses
  einen Abschnitts noch leicht daneben liegen.
- Sehr kurze isolierte Wörter (z.B. "Jap.") können in der Tonspur nur Sekundenbruch-
  teile einnehmen - dann den Anzeigezeitraum im Skript-Aufruf manuell in die
  umgebende Stille hinein erweitern (siehe Beispiel im Skript-Kommentar).

## Material und Ton

Mathias filmt draußen. Gemessen an `20260911_173558.mp4`: Der Abstand zwischen
Grundrauschen und Sprache beträgt nur **2,3:1** (bei Studioton wären es 20:1),
das Sprechtempo liegt bei **2,5 Wörtern pro Sekunde** (150 pro Minute).

Das ist der Grund, warum jede rein energiebasierte Schätzung hier grob bleibt -
und warum Forced Alignment mit bekanntem Text die richtige Antwort ist.

Nebenbei: Auf hellem Hintergrund (Bäume, Himmel) sind die Untertitel gut
lesbar, auf seinem dunklen T-Shirt verschwindet der Navy-Text fast. Falls
Mathias das anspricht - Kontur kräftiger oder Textfarbe auf dunklem Grund
aufhellen, Werte stehen im `STYLE PRESET` von `make_reel.py`.
