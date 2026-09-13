# Reel-Timing - manuelles Wort-Timing per Timeline+Eingabe

Artefakt-URL: `https://claude.ai/code/artifact/7f6d3ff6-ba26-4377-bc35-737b0d2101cc`

## Warum

Wort-Timing aus der Tonspur zu schätzen (Audio-Energie-Analyse, Mikropausen) bleibt
immer eine Annäherung - bei schnellem oder undeutlichem Sprechen kann die Anzeige
dem Mund spürbar hinterherhinken oder vorauseilen. Reel-Timing umgeht das Problem
komplett: Mathias zieht den Playhead auf einer echten Timeline (wie in einem
Videoschnitt-Programm) exakt zur Stelle, drückt "Wort setzen" und tippt das dort
gesprochene Wort in ein Eingabefeld - die App speichert dabei `video.currentTime`
als Zeitpunkt für genau dieses Wort. Das ist die präzise Quelle überhaupt, weil
kein Algorithmus mehr raten muss.

Das Tool ist auf Querformat gesperrt (im Hochformat erscheint ein "Gerät drehen"-
Hinweis) - die Timeline braucht die Breite. Es versucht beim Drehen automatisch in
den Vollbildmodus zu wechseln (und beim Zurückdrehen wieder raus) - das klappt aber
nur innerhalb einer echten Nutzer-Geste (Tap), nicht garantiert auf jedem Gerät/
Browser.

Das Tool speichert NICHTS serverseitig (keine `db`-Capability, daher auch kein
"Sign in"-Hinweis von claude.ai) - Mathias lädt sein Ergebnis als Datei herunter
und hängt sie selbst im Chat an.

## Ablauf für Mathias

1. Artefakt-Link öffnen, Handy quer halten.
2. Rohvideo laden (Datei-Auswahl - bleibt lokal im Browser, wird nicht hochgeladen).
3. Optional: gesprochenen Text als reinen Fließtext einfügen (nur Gedächtnisstütze
   und Fortschrittszähler - kann auch leer bleiben, dann tippt man frei).
4. "Los geht's" - Video startet automatisch.
5. Playhead auf der Timeline durch Ziehen/Antippen zur gewünschten Stelle bewegen,
   oder per Sprung-Buttons (±0,1s/±1s), Frame-Schritt (◂F/F▸, ~1/24s) und
   Tempo-Regler (0,1x Zeitlupe bis 2x Vorspulen) navigieren.
6. **Wort setzen** drücken (oder Taste `W`) - Video pausiert, Zeitpunkt wird
   eingefroren und ein Eingabefeld öffnet sich.
7. Das gehörte Wort eintippen, mit Enter oder "OK" bestätigen (oder das Feld
   hinterlegte Text-Vorschläge aus dem optionalen Fließtext per Autocomplete
   anbieten lassen). Der Marker erscheint als grüner Strich auf der Timeline und
   unten in der chronologischen Liste.
8. In der Liste auf Zeit oder Wort klicken springt im Video dorthin (zum
   Nachprüfen); ✕ löscht einen einzelnen Marker; "Alles zurücksetzen" löscht alle
   (mit Rückfrage).
9. Wenn genug Wörter erfasst sind: "timing.json herunterladen" drücken und die
   heruntergeladene Datei direkt im Chat an Claude anhängen.

Ein rot umrandeter Eintrag in der Liste bedeutet: seine Zeit liegt vor der des
chronologisch vorherigen Eintrags - meist ein Zeichen für einen Navigations- oder
Tippfehler. Kurz gegenprüfen und ggf. löschen/neu setzen.

## Ergebnis-Format (für Claude)

Die heruntergeladene `<videoname>_timing.json` sieht so aus:

```json
{
  "videoName": "20260911_173558.mp4",
  "totalWords": 109,
  "words": [{"w": "Sattelstützen,", "t": 0.83}, ...],
  "complete": true,
  "savedAt": "2026-09-13T07:30:00.000Z"
}
```

Direkt an `make_reel.py` als zweites Argument übergeben (siehe
`parse_word_timings_json` in `scripts/make_reel.py`) - kein SRT-Umweg nötig. Jedes
Wort dauert bis zum nächsten Marker; Pausen über 0,5s zwischen zwei Markern trennen
automatisch zwei Anzeige-Blöcke.

Falls `complete` false ist: mit Mathias klären, ob er fertig tippen soll, bevor
gerendert wird - sonst fehlen Wörter im Video komplett.

## Falls sich das Tool ändern soll

Bei Wunsch nach Anpassungen (z.B. anderes Layout, andere Reaktionszeit-Vorgabe) das
Artefakt über `Artifact`-Tool mit `url: "<Artefakt-URL>"` aktualisieren (nicht neu
publizieren - sonst entsteht ein zweiter Link und Mathias' Lesezeichen bricht).
