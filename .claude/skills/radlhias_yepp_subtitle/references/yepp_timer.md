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
4. **Gesprochenen Text einfügen.** Damit arbeitet das Werkzeug im Ankermodus
   (siehe unten) - das ist der schnelle Weg. Lässt er das Feld leer, bleibt es
   beim freien Modus, in dem er jedes Wort einzeln setzt und eintippt.
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
8. **Zoom für genaues Setzen:** Mit zwei Fingern auf der Timeline auseinander-
   ziehen zoomt hinein, zusammenschieben wieder heraus; die Stelle zwischen den
   Fingern bleibt dabei stehen. Alternativ die Knöpfe −/+ über der Timeline
   (Ankerpunkt ist dann der Playhead), am Rechner auch das Mausrad.
   "Ganzes Video" setzt zurück. Die Anzeige daneben nennt den sichtbaren
   Bereich, orange Randstreifen zeigen, dass links bzw. rechts noch Video
   weitergeht.
   Warum das nötig ist: Bei 40 Sekunden auf 900 Pixeln entspricht ein Pixel
   rund 45 Millisekunden. Bei 8-fachem Zoom sind es unter 6 - erst damit lässt
   sich ein Wortanfang sauber treffen. Die Zeitmarken werden beim Hineinzoomen
   automatisch feiner (bis hinunter zu Zwanzigstelsekunden), und beim Abspielen
   wandert das Fenster mit dem Playhead mit.
9. **Ankermodus (Text hinterlegt).** Das Werkzeug setzt die Marken selbst und
   Mathias schiebt sie nur noch zurecht - an seinem Material 27 statt 109
   Handgriffe:
   - Eine Marke auf der Timeline anfassen und an die richtige Stelle ziehen.
     Das Videobild folgt beim Ziehen mit, er sieht also, was dort gesprochen
     wird. Loslassen bestätigt sie; ein bloßes Antippen bestätigt eine Marke,
     die ohnehin schon passt.
   - **Blass = vom Werkzeug geraten, grün = von Mathias bestätigt**, orange =
     gerade ausgewählt. So sieht er auf einen Blick, was noch Vermutung ist.
   - **Folgende Marken ziehen mit** (abschaltbar): Beim Verschieben wandern alle
     noch nicht bestätigten Marken bis zur nächsten bestätigten - oder bis zum
     Videoende - proportional mit. Weil die Vorbelegung meist gleichmäßig
     danebenliegt, korrigiert ein Handgriff so gleich die ganze folgende
     Passage. Bestätigte Marken bewegen sich nie wieder und wirken wie eine
     Klammer.
   - ◂ ▸ springt von Marke zu Marke, "Rest bestätigen" übernimmt alle
     verbliebenen, "Alles zurücksetzen" stellt die Vorbelegung wieder her.
10. **Freier Modus (kein Text).** Wie gehabt: **Wort setzen** drücken (oder Taste
   `W`) - Video pausiert, Zeitpunkt wird eingefroren, Eingabefeld öffnet sich.
11. Das gehörte Wort eintippen, mit Enter oder "OK" bestätigen (Vorschläge aus dem
   optionalen Fließtext bietet das Feld per Autocomplete an). Der Marker erscheint
   als grüner Strich auf der Timeline und unten in der chronologischen Liste. War
   das Video vorher am Laufen, läuft es nach dem Bestätigen weiter.
12. In der Liste auf Zeit oder Wort klicken springt im Video dorthin; ✎ ändert den
   Worttext nachträglich; ✕ löscht einen einzelnen Marker; "Alles zurücksetzen"
   löscht alle (mit Rückfrage).
13. Zum Schluss **timing.json herunterladen** (oder "In Zwischenablage") und Datei
   bzw. Text im Chat an Claude anhängen.

Ein rot umrandeter Eintrag in der Liste bedeutet: seine Zeit liegt vor der des
chronologisch vorherigen Eintrags - meist ein Zeichen für einen Navigations- oder
Tippfehler. Kurz gegenprüfen und ggf. löschen/neu setzen.

Im Hochformat ist das Werkzeug gesperrt ("Gerät drehen") - die Timeline braucht
die Breite.

## Wie die Anker gewählt und vorbelegt werden

**Welche Wörter Anker werden:** Satzzeichen verraten, wo Mathias beim Sprechen
absetzt. An seinem Text gemessen ergibt das eine Stütze alle 2,6 Sekunden;
Lücken über 2,5 Sekunden werden aufgefüllt. Abkürzungen wie `bzw.` sind
ausgenommen, sonst entstünde mitten im Satz ein Anker.

**Wo sie anfangs liegen:** gleichmäßig, aber über die reine Sprechzeit - erkannte
Atempausen werden übersprungen, längere Wörter bekommen mehr Zeit als kurze.

**Warum nicht genauer?** Gemessen an `20260911_173558.mp4`: Der Abstand zwischen
Grundrauschen und Sprache beträgt bei Mathias' Außenaufnahmen nur 2,3:1 (bei
Studioton wären es 20:1). Die Tonanalyse findet deshalb nur die ~8 groben
Atempausen, keine Wortgrenzen - der längste zusammenhängende Abschnitt ist
12,3 Sekunden lang. Für eine feine Vorbelegung reicht das nicht. Gegenüber stur
linearer Verteilung bringt das Überspringen der Pausen im Mittel 0,5 Sekunden.
**Die Vorbelegung bleibt also ungenau - deshalb ist das Mitziehen keine
Zusatzfunktion, sondern der Kern der Bedienung.**

Schlägt das Dekodieren der Tonspur fehl (sehr große Datei, fehlender Codec),
bleibt es stillschweigend bei der linearen Vorbelegung.

## Datenformat

Das Werkzeug speichert **nichts** serverseitig - es hat keine Datenbank, kein
Konto und keinen Login. Zwei Formate, die `make_reel.py` beide liest:

**Ankermodus** (aktuell) - die vollständige Wortfolge plus die Stützstellen:

```json
{
  "videoName": "20260911_173558.mp4",
  "duration": 43.42,
  "words": ["Sattelstützen,", "die", "in", "..."],
  "anchors": [{"i": 0, "t": 0.0, "fixed": true},
              {"i": 5, "t": 2.1, "fixed": true}, ...],
  "totalWords": 109,
  "complete": true,
  "savedAt": "2026-09-14T07:30:00.000Z"
}
```

Die Zeit jedes Wortes zwischen zwei Ankern rechnet `interpolate_from_anchors`
in `scripts/make_reel.py` aus - proportional zur Zeichenlänge, damit
"Carbon-Montagepaste" länger steht als "n".

**Freier Modus** (auch ältere Dateien) - ein Zeitstempel je Wort:

```json
{"words": [{"w": "Sattelstützen,", "t": 0.83}, ...], "totalWords": 109}
```

Die Datei lokal als z.B. `timing.json` ablegen und direkt an `make_reel.py` als
zweites Argument übergeben - kein SRT-Umweg nötig. Jedes Wort dauert bis zum
nächsten; Pausen über 0,5s trennen automatisch zwei Anzeige-Blöcke.

Falls `complete` false ist: mit Mathias klären, ob er die restlichen Marken noch
durchgehen will. Anders als früher fehlen dann keine Wörter - unbestätigte Marken
stehen einfach auf der Vorbelegung und können danebenliegen.

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
