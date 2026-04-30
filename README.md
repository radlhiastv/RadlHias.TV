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
