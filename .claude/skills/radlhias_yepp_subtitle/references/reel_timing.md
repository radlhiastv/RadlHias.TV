# Reel-Timing - manuelles Wort-Timing per Timeline+Eingabe

Artefakt-URL: `https://claude.ai/code/artifact/7f6d3ff6-ba26-4377-bc35-737b0d2101cc`

## Warum

Wort-Timing aus der Tonspur zu schätzen (Audio-Energie-Analyse, Mikropausen) bleibt
immer eine Annäherung - bei schnellem oder undeutlichem Sprechen kann die Anzeige
dem Mund spürbar hinterherhinken oder vorauseilen. Reel-Timing umgeht das Problem
komplett: Mathias zieht den Playhead auf einer echten Timeline (wie in einem
Videoschnitt-Programm) exakt zur Stelle, drückt "Wort setzen" und tippt das dort
gesprochene Wort in ein Eingabefeld - die App speichert dabei `video.currentTime`
als Zeitpunkt für genau dieses Wort. Das ist die präziseste Quelle überhaupt, weil
kein Algorithmus mehr raten muss.

Das Tool ist auf Querformat gesperrt (im Hochformat erscheint ein "Gerät drehen"-
Hinweis) - die Timeline braucht die Breite.

## Ablauf für Mathias

1. Artefakt-Link öffnen, Handy quer halten. Das Tool geht beim ersten Antippen in
   den Vollbildmodus (Browserleiste und Artefakt-Kopfzeile verschwinden). Klappt
   das nicht automatisch, erscheint unten rechts ein "⛶ Vollbild"-Schalter.
2. Rohvideo laden (Datei-Auswahl - bleibt lokal im Browser, wird nicht hochgeladen).
3. Optional: gesprochenen Text als reinen Fließtext einfügen (nur Gedächtnisstütze,
   Fortschrittszähler und Tipp-Vorschläge - kann auch leer bleiben).
4. "Los geht's" - Video startet automatisch.
5. Playhead auf der Timeline durch Ziehen/Antippen zur gewünschten Stelle bewegen,
   oder per Sprung-Buttons (±0,1s/±1s), Einzelbild-Schritt (◂F/F▸) und
   Tempo-Regler (0,1x Zeitlupe bis 2x Vorspulen) navigieren. Die Bildrate für den
   Einzelbild-Schritt misst die App aus dem laufenden Video, statt 24 fps
   anzunehmen.
6. **Wort setzen** drücken (oder Taste `W`) - Video pausiert, Zeitpunkt wird
   eingefroren und ein Eingabefeld öffnet sich.
7. Das gehörte Wort eintippen, mit Enter oder "OK" bestätigen (Vorschläge aus dem
   optionalen Fließtext bietet das Feld per Autocomplete an). Der Marker erscheint
   als grüner Strich auf der Timeline und unten in der chronologischen Liste. War
   das Video vorher am Laufen, läuft es nach dem Bestätigen weiter.
8. In der Liste auf Zeit oder Wort klicken springt im Video dorthin; ✎ ändert den
   Worttext nachträglich; ✕ löscht einen einzelnen Marker; "Alles zurücksetzen"
   löscht alle (mit Rückfrage).
9. Zum Schluss **timing.json herunterladen** (oder "In Zwischenablage", falls der
   Download im Browser blockiert wird) und Datei bzw. Text im Chat an Claude
   anhängen.

Ein rot umrandeter Eintrag in der Liste bedeutet: seine Zeit liegt vor der des
chronologisch vorherigen Eintrags - meist ein Zeichen für einen Navigations- oder
Tippfehler. Kurz gegenprüfen und ggf. löschen/neu setzen.

## Datenformat

Das Tool speichert **nichts** serverseitig - es hat keine Datenbank und fragt
deshalb auch nie nach einem Login. Der Export sieht so aus:

```json
{
  "videoName": "20260911_173558.mp4",
  "totalWords": 109,
  "words": [{"w": "Sattelstützen,", "t": 0.83}, ...],
  "complete": true,
  "savedAt": "2026-09-13T07:30:00.000Z"
}
```

Diese JSON lokal als z.B. `timing.json` ablegen und direkt an `make_reel.py` als
zweites Argument übergeben (siehe `parse_word_timings_json` in
`scripts/make_reel.py`) - kein SRT-Umweg nötig. Jedes Wort dauert bis zum nächsten
Zeitstempel; Pausen über 0,5s zwischen zwei Zeitstempeln trennen automatisch zwei
Anzeige-Blöcke.

Falls `complete` false ist: mit Mathias klären, ob er fertig tippen soll, bevor
gerendert wird - sonst fehlen Wörter im Video komplett.

## Falls sich das Tool ändern soll

Die Quelldatei liegt versioniert im Repo unter
`.claude/skills/radlhias_yepp_subtitle/tools/reel_timing.html` - dort ändern,
danach veröffentlichen und die Änderung mitcommitten, damit Repo und Artefakt
nicht auseinanderlaufen.

Das Artefakt über das `Artifact`-Tool mit `url: "<Artefakt-URL>"` **aktualisieren**,
nicht neu publizieren - sonst entsteht ein zweiter Link und Mathias' Lesezeichen
bricht.

Zwei Fallstricke, die schon zu "das Tool zeigt einen alten Stand"-Meldungen
geführt haben:

- **Capabilities werden mitgeschleppt.** Lässt man `capabilities` beim Redeploy
  weg, bleibt die gespeicherte Deklaration bestehen. Als der `db`-Speicherweg aus
  dem Code entfernt wurde, blieb `db` deklariert - deshalb erschien weiterhin die
  Blase "Sign in to see this artifact's data". Korrekt ist eine vollständige
  Neudeklaration, aktuell `capabilities: {"downloads": true}`.
- **Der geteilte Link ist auf eine Version gepinnt.** Wer nicht eingeloggt über
  den Share-Link öffnet, sieht so lange die gepinnte Version, bis der Pin über das
  Share-Menü auf die neue Version gesetzt wird. Neue Publishes erreichen ihn sonst
  nicht - das sieht nach Browser-Cache aus, ist aber keiner.
