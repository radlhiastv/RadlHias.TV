# RadlHias.TV

Persönliche Homepage für den YouTube-Kanal RadlHias.TV.

## Repo-Struktur

```
/
├── index.html        ← Startseite
├── admin-blog.html   ← Blog-Admin (Artikel schreiben/bearbeiten/löschen)
├── blogimages/        ← Bilder der ursprünglich migrierten Artikel
├── postwerkstatt/     ← Instagram-Post-Editor (PWA, läuft offline am Handy)
├── worker/            ← Cloudflare Worker: Termine, Werkstatt & Blog-Backend
└── README.md
```

## So fügst du einen neuen Artikel hinzu

1. `admin-blog.html` öffnen (verlinkt z.B. von `admin-werkstatt.html`/Bookmark; bewusst nicht in der öffentlichen Navigation) und mit dem Admin-Passwort einloggen.
2. Titel, Text, Bild (per Drag & Drop) und die restlichen Felder ausfüllen.
3. Auf **"Artikel veröffentlichen"** klicken.

Das war's – der Artikel ist sofort live unter `/blog/<slug>.html`, taucht auf der
Blog-Übersicht, im Startseiten-Teaser und in der `sitemap.xml` auf. Kein
Download, kein GitHub, keine zweite Datei mehr nötig.

**Wie das technisch funktioniert:** Artikel liegen in einer D1-Datenbank
(Cloudflare), nicht mehr in `posts.json` + einzelnen Dateien in `blog/`. Der
Cloudflare Worker (`worker/`, derselbe, der auch Termine & Werkstatt bedient)
rendert `/blog/index.html` und `/blog/<slug>.html` bei jedem Aufruf
serverseitig aus der Datenbank – inklusive Meta-Description, Open-Graph-Tags
und `BlogPosting`-JSON-LD, automatisch aus deinen Eingaben erzeugt. Details
und einmaliges Setup: [`worker/SETUP.md`](worker/SETUP.md), Abschnitt
„Blog-Verwaltung".

## Bilder

Im Admin-Panel (`admin-blog.html`) einfach das Titelbild per Drag & Drop
ablegen oder auswählen – der Browser verkleinert und konvertiert es
automatisch zu WebP (max. 1600 px Breite), bevor es hochgeladen wird. Kein
manuelles Vorbereiten, kein Ordner, kein Pfad-Eintippen mehr nötig.

## Newsletter (Brevo)

1. Brevo-Account anlegen (kostenlos bis 300 Mails/Tag)
2. Unter Contacts → Forms ein neues Formular anlegen
3. Den Embed-Code in der Funktion `submitNewsletter()` in index.html einbauen

## Admin-Passwort ändern

Im index.html suche nach:
```javascript
const ADMIN_PW = 'radlhias2024';
```
Ersetze `radlhias2024` durch dein gewünschtes Passwort.

## GitHub Pages aktivieren

1. Repo → Settings → Pages
2. Source: Deploy from a branch → main → / (root)
3. Save → Die Seite ist unter `https://USERNAME.github.io/REPO-NAME` erreichbar

## Cache-Control Header (Performance)

GitHub Pages liefert alle Dateien aktuell mit `Cache-Control: max-age=600` aus (10 Minuten) –
das lässt sich **nicht** über eine Datei im Repo ändern (kein `_headers`/`vercel.json`-Äquivalent,
GitHub Pages setzt seine Header serverseitig fix). Um Bilder/CSS/JS ein Jahr lang cachen zu lassen,
muss ein CDN vorgeschaltet werden:

1. Kostenlosen Cloudflare-Account anlegen, Domain `radlhias.tv` hinzufügen.
2. Nameserver bei INWX auf die von Cloudflare angezeigten Werte umstellen (DNS-Records vorher
   1:1 übernehmen, insbesondere den `A`/`CNAME`-Eintrag auf GitHub Pages).
3. In Cloudflare unter **Caching → Cache Rules** eine Regel anlegen:
   - Wenn URI-Pfad endet auf `.webp`, `.jpg`, `.png`, `.css`, `.js`, `.woff2` → Edge Cache TTL 1 Jahr,
     Browser Cache TTL 1 Jahr (entspricht `Cache-Control: public, max-age=31536000, immutable`).
   - HTML-Dateien (`.html` bzw. `/`) explizit ausnehmen bzw. auf kurze TTL lassen, damit
     Content-Updates sofort sichtbar bleiben.
4. Proxy-Status (oranges Wölkchen) für den DNS-Eintrag aktivieren, sonst greifen die Cache Rules nicht.

Da Bild-/CSS-/JS-Dateinamen sich bei Änderungen aktuell nicht automatisch ändern (kein
Cache-Busting per Hash), sollte man nach dem Ersetzen einer Datei mit gleichem Namen in Cloudflare
einmal **Purge Cache** auslösen, damit Besucher nicht bis zu ein Jahr lang eine alte Version sehen.

## Worker deployen

Der Cloudflare Worker (`worker/`) deployt sich selbst: Sobald eine Änderung unter
`worker/` auf `main` landet, baut und veröffentlicht ihn die GitHub Action
`.github/workflows/deploy-worker.yml`. Manuell auslösen geht im Reiter *Actions*
→ *Worker deployen* → *Run workflow* – auch vom Handy. Die einmalige Einrichtung
der beiden Repository-Secrets steht in [`worker/SETUP.md`](worker/SETUP.md),
Abschnitt 11. Fehlen die Secrets noch, baut die Action den Worker trotzdem und
überspringt nur das Hochladen – sie wird deswegen nicht rot.

## Werkstatt-Terminbuchung

`termin.html` (Kunden-Buchungsseite, verlinkt von `bikeservice.html`) und `admin-termine.html`
(passwortgeschütztes Admin-Panel) sind statische Frontends für das Terminanfrage-System. Das
Backend (Cloudflare Worker + D1-Datenbank + Google-Calendar- + Brevo-Anbindung) liegt in
[`worker/`](worker/) – Einrichtung und Deployment sind in [`worker/SETUP.md`](worker/SETUP.md)
Schritt für Schritt beschrieben. Kunden stellen dort nur eine **Anfrage**; erst wenn Mathias sie
im Admin-Panel mit fixer Uhrzeit freigibt, entsteht ein Termin im Google-Kalender und der Kunde
bekommt eine Bestätigung.

## Werkstatt-Reparaturverwaltung

`admin-werkstatt.html` (über das dezente Zahnrad-Icon unten rechts auf `bikeservice.html`
erreichbar, gleiches Passwort wie oben) ersetzt die manuelle Google-Sheets-Eintragung bei der
Radannahme: Annahmeformular, eine frei filterbare Liste aller Reparaturen (Status, Suchtext,
Datumsbereich) sowie das Nachtragen von erledigter Arbeit, Endpreis und Statuswechsel
(Angenommen → Ware bestellt → In Bearbeitung → Kunde informiert/fertig). Alle Daten landen
direkt in einem Google Sheet – dieselbe Datenquelle, die Mathias bisher schon manuell gepflegt
hat. Backend-Endpunkte liegen im selben Worker wie die Terminverwaltung, Einrichtung siehe
[`worker/SETUP.md`](worker/SETUP.md), Abschnitt „Google Sheets Anbindung".

## Postwerkstatt (Instagram-Editor)

`postwerkstatt/` ist ein eigenständiges Werkzeug zum Schreiben von Instagram-Captions –
erreichbar unter `https://radlhias.tv/postwerkstatt/`. Es läuft komplett im Browser,
ohne Server, ohne Konto und ohne Netz.

**Was drin ist**

- Live-Zähler: Zeichen (Limit 2200), verbleibende Zeichen, Wörter, Hashtags (Limit 30),
  Absätze und wie viele Zeichen noch bis zum „… mehr“-Abschnitt bei 125 Zeichen frei sind.
- Hook-Generator: liest die Caption, erkennt Thema, Nebenthema und Zahlen und baut daraus
  Vorschläge für die erste Zeile – wählbar nach Tonalität. Ein Klick setzt den Hook ein,
  der nächste ersetzt ihn wieder.
- Bausteine: Caption-Gerüste (Story, How-to, Liste, Vorher/Nachher, Meinung, Produkt)
  und fertige Call-to-Action-Sätze.
- Hashtag-Vorschläge: 20 Stück aus der Caption plus Themenprofil (Marke, Branche,
  Region), gruppiert nach Herkunft und mit grober Größenangabe (• Nische, •• mittel,
  ••• breit). Fünf davon lassen sich auswählen – mehr nimmt Instagram nicht –, eine
  sinnvolle Mischung ist vorgewählt.
- Hashtag-Verwaltung mit eigenen Sets, Entdoppeln, Sortieren und der Wahl
  „in der Caption“ oder „im ersten Kommentar“.
- Feed-Vorschau im Instagram-Look plus ein Qualitäts-Check über neun Punkte
  (Hook-Länge, Absätze, Satzlänge, CTA, Hashtag-Menge, Emojis, Links …).
- Posts-Verwaltung mit Status (Idee, Entwurf, Fertig, Gepostet), Suche und Checkliste
  vorm Posten.
- „Post kopieren“ legt den fertigen Beitrag in die Zwischenablage: Hook, Text und
  Hashtags in einem Stück. Stehen die Hashtags auf „erster Kommentar“, heißt der
  Knopf „Caption kopieren“ und lässt sie weg – der Hinweis darunter sagt jeweils,
  was drin ist.

**KI-Hooks (optional)**

Neben dem regelbasierten Generator kann der Editor Vorschläge von Claude holen.
Das läuft über `POST /api/admin/hooks` im Cloudflare Worker (`worker/src/lib/hooks.js`),
hinter dem Admin-Login – der Anthropic-Schlüssel liegt als Worker-Secret und nie
im Browser. Einrichtung: [`worker/SETUP.md`](worker/SETUP.md), Abschnitt 12.
Ohne Netz, ohne Anmeldung oder ohne hinterlegten Schlüssel bleibt der lokale
Generator die Rückfallebene.

**Themenprofil**

Im Reiter *Tags* unter „Themenprofil“ stehen Marke, Tätigkeit, Region und die fix
gewünschten Hashtags. Das wird einmal eingetragen und fließt danach in jeden
Vorschlag ein. Das Thema eines Posts bestimmt allein die Caption – die Branche wirkt
nur schwach mit, sonst schlägt bei jedem Post das komplette Leistungsangebot durch.

**Version und Updates**

Die laufende Version steht im Kopf der App neben dem Titel und im Reiter *Posts*
unter „Sicherung". Beim Start sieht die App still in `postwerkstatt/version.json`
nach, ob online eine neuere Fassung liegt; ist das so, erscheint oben ein oranger
Balken, der auf Tippen neu lädt. Ein Tipp auf die Versionsnummer im Kopf oder auf
„Nach Updates sehen" prüft von Hand.

Bei jeder Änderung an der App sind deshalb drei Stellen anzupassen:
`VERSION` in `postwerkstatt/index.html`, `version` (plus `datum` und `was`) in
`postwerkstatt/version.json` und `CACHE` in `postwerkstatt/sw.js`. Laufen die
ersten beiden auseinander, meldet die App dauerhaft ein Update oder verschweigt
eines.

**Aufs Handy holen**

Seite in Safari bzw. Chrome öffnen → „Zum Home-Bildschirm“. Danach startet sie wie eine
App, auch offline. Eine neue Version wird beim nächsten Start mit Netz automatisch geladen
(nach Änderungen an `index.html` bitte die `CACHE`-Version in `postwerkstatt/sw.js` hochzählen).

**Daten & Handywechsel**

Alle Posts liegen ausschließlich im `localStorage` des jeweiligen Geräts – nichts geht an
einen Server. Im Reiter *Posts* gibt es **Export** (eine JSON-Datei mit allen Posts, Sets und
Einstellungen) und **Import**. Beim Import werden nur unbekannte Posts ergänzt, vorhandene
bleiben unangetastet. Vor einem Gerätewechsel also exportieren und die Datei sichern.
