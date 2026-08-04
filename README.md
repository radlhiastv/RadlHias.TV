# RadlHias.TV

Persönliche Homepage für den YouTube-Kanal RadlHias.TV.

## Repo-Struktur

```
/
├── index.html        ← Die gesamte Website (eine einzige Datei)
├── posts.json        ← Alle Blog-Artikel (wird vom Admin-Bereich erzeugt)
├── images/           ← Deine Fotos für Blog-Artikel
│   └── RadlHias_Logo.png
└── README.md
```

## So fügst du einen neuen Artikel hinzu

1. Öffne deine Website und scrolle ganz nach unten zum Footer
2. Klicke auf **"Admin"**
3. Passwort eingeben: `radlhias2024` (im Code unter `ADMIN_PW` ändern)
4. Artikel schreiben, Bild-Pfad eingeben (`images/mein-bild.jpg`)
5. Auf **"Artikel speichern"** klicken
6. Auf **"posts.json herunterladen"** klicken
7. Auf GitHub: posts.json im Repo mit der neuen Version ersetzen (Drag & Drop)

## Bilder hochladen

1. Foto vorbereiten (JPG, max. 1–2 MB empfohlen)
2. GitHub öffnen → Repo → `/images/` Ordner
3. Foto per Drag & Drop hochladen
4. Im Admin-Bereich als Pfad `images/dateiname.jpg` eingeben

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
