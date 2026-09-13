# Timestamp - manuelles Wort-Timing per Tippen

Artefakt-URL: `https://claude.ai/code/artifact/96e658b9-4e1d-4ec6-8df8-4b977e7f2509`

## Warum

Wort-Timing aus der Tonspur zu schätzen (Audio-Energie-Analyse, Mikropausen) bleibt
immer eine Annäherung - bei schnellem oder undeutlichem Sprechen kann die Anzeige
dem Mund spürbar hinterherhinken oder vorauseilen. Der Timestamp umgeht das
Problem komplett: Mathias spielt sein Video ab und tippt bei jedem Wort selbst mit
(Leertaste oder Button) - die App speichert dabei `video.currentTime` als
Startzeitpunkt des jeweils aktuellen Worts. Das ist die praezise Quelle ueberhaupt,
weil kein Algorithmus mehr raten muss.

## Ablauf für Mathias

1. Artefakt-Link öffnen.
2. Rohvideo laden (Datei-Auswahl - bleibt lokal im Browser, wird nicht hochgeladen).
3. Den gesprochenen Text als reinen Fließtext einfügen (keine Zeitstempel nötig).
4. "Los geht's" - Video startet automatisch.
5. Bei jedem Wort, das gerade gesprochen wird, Leertaste drücken (oder auf den
   großen Button tippen). Bei Bedarf Tempo auf 0,5x/0,75x drosseln, mit den
   ◀2s/2s▶-Buttons zurück-/vorspulen, oder in der Liste unten auf ein bereits
   getapptes Wort klicken, um ab dort neu zu tappen (z.B. nach einem Verhaspler).
   Die Reaktionszeit-Korrektur (Standard 0,15s) gleicht die menschliche
   Verzögerung zwischen Hören und Tippen automatisch aus.
6. Wenn `Progress` bei "X / X" steht: "Für Claude speichern" drücken.

## Ergebnis auslesen (für Claude)

Die App speichert unter `collection: "timing"`, `doc_id: "current"` ein Dokument:

```json
{
  "videoName": "20260911_173558.mp4",
  "totalWords": 109,
  "words": [{"w": "Sattelstützen,", "t": 0.83}, ...],
  "complete": true,
  "savedAt": "2026-09-13T07:30:00.000Z"
}
```

Auslesen per `Artifact`-Tool:
```
action: "read_db", url: "<Artefakt-URL>", db_op: "get",
collection: "timing", doc_id: "current"
```

Das Ergebnis als JSON-Datei (z.B. `timing.json`) lokal speichern und direkt an
`make_reel.py` als zweites Argument übergeben (siehe `parse_word_timings_json` in
`scripts/make_reel.py`) - kein SRT-Umweg nötig. Jedes Wort dauert bis zum nächsten
Tap; Pausen über 0,5s zwischen zwei Taps trennen automatisch zwei Anzeige-Blöcke.

Falls `complete` false ist: mit Mathias klären, ob er fertig tippen soll, bevor
gerendert wird - sonst fehlen Wörter im Video komplett.

## Falls sich das Tool ändern soll

Bei Wunsch nach Anpassungen (z.B. anderes Layout, andere Reaktionszeit-Vorgabe) das
Artefakt über `Artifact`-Tool mit `url: "<Artefakt-URL>"` aktualisieren (nicht neu
publizieren - sonst entsteht ein zweiter Link und Mathias' Lesezeichen bricht).
