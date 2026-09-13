# Yepp-Timer - manuelles Wort-Timing per Timeline+Eingabe

**URL: https://radlhias.tv/yepp-timer/**
Quelldateien im Repo: Ordner `yepp-timer/` (`index.html`, `sw.js`,
`manifest.webmanifest`, Icons). `yepp-timer.html` im Wurzelverzeichnis ist nur
noch eine Weiterleitung für alte Lesezeichen. Ausgeliefert über GitHub Pages -
nach dem Merge in `main` ist die Änderung live.

## Warum

Wort-Timing aus der Tonspur zu schätzen (Audio-Energie-Analyse, Mikropausen) bleibt
immer eine Annäherung - bei schnellem oder undeutlichem Sprechen kann die Anzeige
dem Mund spürbar hinterherhinken oder vorauseilen. Der Yepp-Timer umgeht das
Problem komplett: Mathias zieht den Playhead auf einer echten Timeline (wie in
einem Videoschnitt-Programm) exakt zur Stelle, drückt "Wort setzen" und tippt das
dort gesprochene Wort in ein Eingabefeld - die App speichert dabei
`video.currentTime` als Zeitpunkt für genau dieses Wort. Das ist die präziseste
Quelle überhaupt, weil kein Algorithmus mehr raten muss.

## Warum auf radlhias.tv und nicht als Claude-Artefakt

Das Werkzeug lief zuerst als Artefakt. Das hat drei Probleme erzeugt, die sich von
innen nicht lösen ließen, weil ein Artefakt in einem fremden Rahmen läuft:

- **Die Kopfzeile von claude.ai** ("Content is user-generated and unverified",
  "Share", "Sign in") liegt außerhalb der Seite und lässt sich nicht entfernen.
- **Vollbild ist im Artefakt-Rahmen nicht freigegeben**, also verschwindet die
  Kopfzeile auch nicht per Fullscreen-API. Das liegt nicht am Browser - auf
  eigener Domain funktioniert es einwandfrei.
- **Ein geteilter Artefakt-Link ist auf eine Version gepinnt**, neue
  Veröffentlichungen erreichten die nicht eingeloggte Ansicht deshalb nie. Das
  sah nach Browser-Cache aus, war aber keiner.

Auf eigener Domain fallen alle drei weg. Zusätzlich funktionieren dort echter
Datei-Download und die Installation als App. **Nicht** zurück zum Artefakt wechseln.

## Ablauf für Mathias

1. **Empfohlen: einmalig als App installieren.** https://radlhias.tv/yepp-timer/
   öffnen, im Chrome-Menü (⋮) "App installieren" bzw. "Zum Startbildschirm
   hinzufügen". Danach startet der Yepp-Timer ohne Adressleiste, direkt im
   Querformat und auch ohne Netz. Dafür liefert der Ordner alles mit, was
   Android verlangt: Manifest mit `display: fullscreen`, Icons in 192 und 512
   px (plus maskable) und einen Service Worker mit fetch-Handler. Fehlt eines
   davon, legt Android nur eine Verknüpfung an, die einen normalen Browser-Tab
   mitsamt Adressleiste öffnet.
2. Im Browser-Tab: Handy quer halten, dann den "⛶ Vollbild"-Schalter
   antippen (auf dem Startbildschirm unten rechts, im Arbeitsbildschirm in der
   Transportzeile). Vollbild lässt sich auf Android Chrome **nur aus einem
   echten Klick** heraus anfordern. Der Datei-Dialog verlässt das Vollbild
   zwangsläufig - das wird nicht als Wunsch gewertet, der nächste Tipp stellt
   es wieder her. Verlässt Mathias das Vollbild dagegen selbst, springt es
   nicht ungefragt zurück.
3. Rohvideo laden (Datei-Auswahl - bleibt lokal im Browser, wird nicht hochgeladen).
4. Optional: gesprochenen Text als reinen Fließtext einfügen (nur Gedächtnisstütze,
   Fortschrittszähler und Tipp-Vorschläge - kann auch leer bleiben).
5. "Los geht's" - Video startet automatisch.
6. Aufbau wie im Schnittprogramm: oben das Videobild mit der Bedienung
   daneben, unten die Timeline über die gesamte Breite - je breiter, desto
   genauer lässt sich der Playhead setzen. Ein Tipp aufs Videobild startet und
   stoppt ebenfalls.
7. Playhead auf der Timeline durch Ziehen/Antippen zur gewünschten Stelle bewegen,
   oder per Sprung-Buttons (±0,1s/±1s), Einzelbild-Schritt (◂F/F▸) und
   Tempo-Regler (0,1x Zeitlupe bis 2x Vorspulen) navigieren. Die Bildrate für den
   Einzelbild-Schritt misst die App aus dem laufenden Video, statt 24 fps
   anzunehmen.
8. **Wort setzen** drücken (oder Taste `W`) - Video pausiert, Zeitpunkt wird
   eingefroren und ein Eingabefeld öffnet sich.
9. Das gehörte Wort eintippen, mit Enter oder "OK" bestätigen (Vorschläge aus dem
   optionalen Fließtext bietet das Feld per Autocomplete an). Der Marker erscheint
   als grüner Strich auf der Timeline und unten in der chronologischen Liste. War
   das Video vorher am Laufen, läuft es nach dem Bestätigen weiter.
10. In der Liste auf Zeit oder Wort klicken springt im Video dorthin; ✎ ändert den
   Worttext nachträglich; ✕ löscht einen einzelnen Marker; "Alles zurücksetzen"
   löscht alle (mit Rückfrage).
11. Zum Schluss **timing.json herunterladen** (oder "In Zwischenablage") und Datei
   bzw. Text im Chat an Claude anhängen.

Ein rot umrandeter Eintrag in der Liste bedeutet: seine Zeit liegt vor der des
chronologisch vorherigen Eintrags - meist ein Zeichen für einen Navigations- oder
Tippfehler. Kurz gegenprüfen und ggf. löschen/neu setzen.

Im Hochformat ist das Werkzeug gesperrt ("Gerät drehen") - die Timeline braucht
die Breite.

## Datenformat

Das Werkzeug speichert **nichts** serverseitig - es hat keine Datenbank, kein
Konto und keinen Login. Der Export sieht so aus:

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

## Falls sich das Werkzeug ändern soll

`yepp-timer/index.html` ändern, committen, mergen - fertig. Die Seite trägt
`noindex, nofollow` und ist nirgends verlinkt, taucht also nicht in der Suche
auf. Sie ist eine in sich geschlossene Datei ohne Abhängigkeit außer den
Google-Fonts.

Zwei Dinge nicht kaputtmachen:

- **Der Service Worker muss bleiben** (`yepp-timer/sw.js`, registriert am Ende
  von `index.html`). Ohne ihn verweigert Android die Installation als App, und
  damit ist der vollbildige Start weg. Bei grösseren Änderungen die Zahl in
  `const CACHE = 'yepp-timer-v1'` erhöhen, damit alte Stände sicher verfallen.
- **Alles bleibt im Ordner `yepp-timer/`.** Der Service-Worker-Scope ist an
  diesen Pfad gebunden; im Wurzelverzeichnis würde er die gesamte Website
  abfangen.
