# RadlHias.TV

Persönliche Homepage für den YouTube-Kanal RadlHias.TV.

## Repo-Struktur

```
/
├── index.html        ← Startseite
├── admin-blog.html   ← Blog-Admin (Artikel schreiben/bearbeiten/löschen)
├── blogimages/        ← Bilder der ursprünglich migrierten Artikel
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
