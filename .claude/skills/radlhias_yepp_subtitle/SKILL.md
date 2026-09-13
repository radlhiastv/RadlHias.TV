---
name: radlhias_yepp_subtitle
description: Baut aus einem RadlHias-Reel-Rohvideo und einer korrigierten SRT-Untertiteldatei (z.B. aus der VN-App exportiert) ein fertiges Instagram-Reel im RadlHias-Markenstil - Wort-für-Wort-Karaoke-Untertitel (aktuelles Wort wird größer/orange), Navy/Orange/Creme-Farbschema, Doppelkontur, Schatten, Filmkorn, -2,5° Neigung, Logo-Wasserzeichen, Fade-to-Black am Ende. IMMER verwenden, wenn Mathias ein Video + Untertiteltext/SRT für ein RadlHias-Reel schickt, "Yepp" oder "Reel" erwähnt, nach seiner Untertitel-Vorlage fragt, oder Text bittet "wie gewohnt" oder "wie immer" einzubauen. Auch verwenden, wenn er nur ein Rohvideo mit gesprochenem Text schickt und ein fertiges Reel will (dann zuerst die Tonspur transkribieren, SRT draus bauen, dann diesen Skill anwenden).
---

# RadlHias Yepp-Untertitel

Erzeugt automatisch RadlHias-Reels im etablierten Karaoke-Untertitel-Stil aus einem
Rohvideo + einer Untertiteldatei (SRT). Das Skript übernimmt Timing-Feinarbeit,
Text-Aufteilung und das komplette visuelle Styling - Mathias muss nur Video + Text liefern.

## Wann dieser Skill greift

- Mathias schickt ein Rohvideo (Selfie-Video, RadlHias-Tipp) + einen Untertiteltext
  oder eine .srt-Datei
- Er erwähnt "Yepp", "Reel", "Untertitel wie gewohnt/wie immer/wie beim letzten Mal"
- Er fragt nach einem neuen RadlHias-Reel im bekannten Stil

## Workflow

1. **Video prüfen**: liegt eine Videodatei vor? Falls nicht, nachfragen.
2. **Untertiteltext besorgen**:
   - Liegt bereits eine `.srt`-Datei bei (z.B. aus VN exportiert)? Direkt verwenden.
   - Liegt nur Fließtext vor (Mathias hat ihn eingesprochen/eingetippt)? Erst die
     Tonspur mit `ffmpeg -i video.mp4 -vn -ar 16000 -ac 1 audio.wav` extrahieren,
     dann grobe Sprechabschnitte per `ffmpeg ... silencedetect` oder anhand der vom
     Nutzer gelieferten Zeilenumbrüche in Sprechabschnitte gliedern, und daraus eine
     einfache `.srt`-Datei bauen (Format siehe unten). Das Skript selbst übernimmt
     danach die feinere Wort-für-Wort-Ausrichtung per Audio-Energie-Analyse.
3. **Rechtschreibfehler aus Spracherkennung korrigieren**: bei VN-Exporten oder
   eigener Transkription immer kurz auf offensichtliche Erkennungsfehler prüfen
   (z.B. Fachbegriffe wie "Sattelrohr", "Päckchen") und mit Mathias abklären, bevor
   das finale Video gerendert wird.
4. **Skript ausführen**:
   ```bash
   python3 scripts/make_reel.py <video.mp4> <untertitel.srt> <output.mp4>
   ```
   Das Skript braucht `ffmpeg`, sowie die Python-Pakete `numpy`, `librosa`, `Pillow`
   (mit `pip install --break-system-packages numpy librosa Pillow` installieren,
   falls nicht vorhanden).
   Läuft bei ~30s Videomaterial ein paar Minuten (Frame-Rendering); bei Timeout im
   Sandbox-Tool läuft es im Hintergrund trotzdem oft zuende - Fortschritt in
   `<output-ordner>/_reel_tmp/frames/` prüfen und den letzten Zusammensetz-Schritt
   notfalls manuell mit ffmpeg nachholen (siehe `references/manual_assembly.md`).
5. **Stichprobe prüfen**: 2-3 Frames aus dem Ergebnis exportieren und ansehen
   (Timing, Textüberladung, Logo-Position), bevor an Mathias übergeben wird.
6. **Ausgeben**: fertige Datei nach `/mnt/user-data/outputs/` kopieren und mit
   `present_files` zeigen.

## SRT-Format (falls selbst gebaut)

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
- max. 8 Wörter pro Textblock, Mindestanzeigedauer 0,22s pro Wort
- 1080x1920, 24fps, Logo oben mittig, letzte Sekunde Fade-to-Black

## Bekannte Grenzen

- Wort-Timing basiert auf Audio-Energie-Analyse (Mikropausen), nicht auf echter
  Spracherkennungs-Ausrichtung - bei sehr schnellem/undeutlichem Sprechen kann das
  Timing leicht daneben liegen. Bei Bedarf mit Mathias Rücksprache halten, welche
  Wörter/Stellen nachjustiert werden sollen (Suchradius/Mindestdauer im Skript).
- Sehr kurze isolierte Wörter (z.B. "Jap.") können in der Tonspur nur Sekundenbruch-
  teile einnehmen - dann den Anzeigezeitraum im Skript-Aufruf manuell in die
  umgebende Stille hinein erweitern (siehe Beispiel im Skript-Kommentar).
