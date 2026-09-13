# Timestamp - manuelles Wort-Timing per Marke+Zuordnung

Artefakt-URL: `https://claude.ai/code/artifact/96e658b9-4e1d-4ec6-8df8-4b977e7f2509`

## Warum

Wort-Timing aus der Tonspur zu schätzen (Audio-Energie-Analyse, Mikropausen) bleibt
immer eine Annäherung - bei schnellem oder undeutlichem Sprechen kann die Anzeige
dem Mund spürbar hinterherhinken oder vorauseilen. Timestamp umgeht das Problem
komplett: Mathias navigiert im Video exakt zur Stelle, setzt dort eine Marke und
tippt dann im angezeigten Text an, welches Wort dort gesprochen wird - die App
speichert dabei `video.currentTime` als Zeitpunkt fuer genau dieses Wort. Das ist
die praezise Quelle ueberhaupt, weil kein Algorithmus mehr raten muss.

## Ablauf für Mathias

1. Artefakt-Link öffnen.
2. Rohvideo laden (Datei-Auswahl - bleibt lokal im Browser, wird nicht hochgeladen).
3. Den gesprochenen Text als reinen Fließtext einfügen (keine Zeitstempel nötig).
4. "Los geht's" - Video startet automatisch.
5. Zur gewünschten Stelle navigieren: großer Zeit-Anzeiger + Scrub-Leiste, Sprung-
   Buttons (±0,1s/±1s/±5s), Frame-Schritt (◂Frame / Frame▸, ~1/24s), Tempo-Regler
   für Zeitlupe (0,1x-0,75x) oder Vorspulen (1,5x/2x) durch stille Passagen.
6. **Marke setzen** drücken (oder Taste `M`) - Zeitpunkt wird eingefroren, bei
   Bedarf noch mit ±0,02s/±0,1s nachjustieren.
7. Im Text unten auf das Wort tippen, das an dieser Marke gesprochen wird - die
   Marke wird diesem Wort zugeordnet (grün markiert, mit Zeit-Badge) und die
   Video-Zeit bleibt für die nächste Marke stehen.
8. Ein bereits zugeordnetes Wort antippen (ohne aktive Marke) springt im Video an
   diese Stelle zurück - praktisch zum Nachprüfen. Mit aktiver Marke erneut
   antippen überschreibt die alte Zuordnung. "Alles zurücksetzen" löscht alle
   Zuordnungen (mit Rückfrage).
9. Wenn der Fortschrittsbalken bei "X / X" steht: "Für Claude speichern" drücken.

Ein rot umrandetes Wort in der Liste bedeutet: seine Zeit liegt vor der des
vorherigen zugeordneten Worts - meist ein Zeichen, dass aus Versehen die falsche
Wiederholung eines häufigen Worts (z.B. "und", "die") angetippt wurde. Kurz
gegenprüfen und ggf. korrigieren.

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
