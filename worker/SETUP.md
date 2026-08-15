# RadlHias Werkstatt-Terminbuchung – Setup & Deployment

Dieser Ordner enthält den Cloudflare Worker (API + D1-Datenbank + KV), der
die Buchungsseite (`/termin.html`), die Admin-Panels (`/admin-termine.html`,
`/admin-werkstatt.html`, `/admin-blog.html`) sowie den Blog
(`/blog/*`, serverseitig gerendert, siehe Abschnitt 9) im Hauptrepo bedient.
Die folgenden Schritte sind **einmalig** nötig und brauchen deine eigenen
Zugänge (Cloudflare, Google, Brevo) – das kann ich nicht für dich erledigen.

## 1. Voraussetzungen

- Node.js + `npm install -g wrangler` (oder `npx wrangler ...` ohne globale Installation)
- Ein Cloudflare-Account, bei dem `radlhias.tv` bereits als Zone eingerichtet ist
  (ist laut README.md des Hauptrepos schon der Fall, wegen der Cache Rules)

```bash
cd worker
npm install
wrangler login
```

## 2. D1-Datenbank anlegen

```bash
wrangler d1 create radlhias-termine
```

Die Ausgabe enthält eine `database_id`. Diese in `wrangler.toml` bei
`database_id = "REPLACE_WITH_D1_DATABASE_ID"` eintragen.

Schema anlegen:

```bash
wrangler d1 migrations apply radlhias-termine --remote
```

## 3. Google Calendar Anbindung (Briefing Punkt 7)

1. In der [Google Cloud Console](https://console.cloud.google.com) ein Projekt
   anlegen (falls noch keins für RadlHias existiert).
2. **Google Calendar API** aktivieren (APIs & Services → Library).
3. OAuth-Zustimmungsbildschirm einrichten (External reicht, Testnutzer:
   `radlhias.tv@gmail.com` hinzufügen).
4. OAuth-2.0-Client-ID erstellen, Typ **"Desktop App"**.
5. Einmalig den Consent-Flow durchlaufen, z.B. über den
   [OAuth Playground](https://developers.google.com/oauthplayground):
   - Rechts oben ⚙️ → "Use your own OAuth credentials" aktivieren, Client-ID
     + Client-Secret aus Schritt 4 eintragen.
   - Links im Scope-Feld eintragen: `https://www.googleapis.com/auth/calendar.events`
   - "Authorize APIs" klicken, **mit `radlhias.tv@gmail.com` einloggen** und
     Zugriff erlauben.
   - "Exchange authorization code for tokens" klicken → den **Refresh Token**
     kopieren.
6. Secrets im Worker hinterlegen:

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REFRESH_TOKEN
```

Der Worker holt sich damit bei jeder Terminfreigabe automatisch ein
kurzlebiges Access-Token und legt den Termin per `events.insert` an. Der
Refresh-Token läuft nicht ab, solange er regelmäßig genutzt und der Zugriff
nicht manuell widerrufen wird.

Kalender, in den Termine eingetragen werden: `GOOGLE_CALENDAR_ID` in
`wrangler.toml` unter `[vars]` (aktuell `radlhias.tv@gmail.com`, also der
Hauptkalender dieses Google-Kontos).

## 4. Brevo (Transaktions-Mails, Briefing Punkt 8 & 11)

Offener Punkt aus dem Briefing: separater Brevo-Account für RadlHias oder
bestehenden Ziegler-Account mitnutzen. Sobald das geklärt ist:

1. In Brevo → Settings → SMTP & API → **API Keys** einen neuen API-Key
   erstellen.
2. Absenderadresse `radlhias.tv@gmail.com` unter Senders verifizieren (sonst
   blockt Brevo den Versand).
3. Secret setzen:

```bash
wrangler secret put BREVO_API_KEY
```

Die drei Mail-Texte (neue Anfrage an Mathias, Bestätigung an Kunde, Absage an
Kunde) liegen in `src/lib/email.js` – als sinnvoller Erstentwurf. Sobald du
die finalen Texte lieferst, ersetze ich sie 1:1.

## 5. Admin-Login

```bash
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET   # langer zufälliger String, z.B. `openssl rand -hex 32`
```

`ADMIN_USERNAME` + `ADMIN_PASSWORD` sind Benutzername und Passwort fürs
Admin-Panel (alle drei Bereiche: Werkstatt, Termine, Blog) -- beide müssen
stimmen, sonst schlägt der Login fehl. `SESSION_SECRET` signiert das
Session-Cookie (HttpOnly) und sollte niemandem bekannt sein.

## 6. Worker deployen

```bash
wrangler deploy
```

Das gibt dir eine `*.workers.dev`-URL. Für den produktiven Einsatz empfohlen:

### Route unter radlhias.tv/api/* (empfohlen)

Da `radlhias.tv` laut Haupt-README bereits mit orangem Wölkchen (Proxy) durch
Cloudflare läuft, kann der Worker ohne CORS-/Cookie-Sondertheater direkt unter
`radlhias.tv/api/*` laufen:

1. In `wrangler.toml` den auskommentierten `routes`-Block aktivieren.
2. `wrangler deploy` erneut ausführen.

Damit läuft die API same-origin zur Buchungsseite – kein CORS nötig, das
Admin-Session-Cookie funktioniert ohne Cross-Site-Einschränkungen.

### Alternative: separate Subdomain / workers.dev

Falls stattdessen z.B. `api.radlhias.tv` oder die `*.workers.dev`-URL genutzt
wird: `ALLOWED_ORIGIN` in `wrangler.toml` auf `https://radlhias.tv` setzen
(ist bereits so vorbelegt) und `API_BASE_URL` im Frontend
(`termin.html` / `admin-termine.html`, ganz oben im `<script>`) auf die
tatsächliche Worker-URL anpassen.

## 7. Frontend auf die Worker-URL zeigen lassen

In `termin.html` und `admin-termine.html` steht ganz am Anfang des Scripts:

```js
const API_BASE_URL = "/api";
```

Das passt zur empfohlenen Same-Origin-Route. Bei einer separaten Subdomain
hier die volle URL eintragen, z.B. `https://api.radlhias.tv`.

## 8. Google Sheets Anbindung (Werkstatt-Reparaturverwaltung)

`admin-werkstatt.html` (Annahme-Formular + Liste mit Filter/Statuspflege für
Fahrradreparaturen) speichert direkt in ein Google Sheet – kein
zusätzliches D1 nötig.

1. Google Sheet anlegen (neue Datei oder ein neuer Tab in einer
   bestehenden), Tab-Name z.B. `Reparaturen`. In Zeile 1 exakt diese
   Kopfzeile eintragen (Reihenfolge ist egal, die Namen müssen aber genau
   passen):

   ```
   ID | Status | Angenommen am | Fahrrad Typ | Hersteller | Modell | Farbe |
   Bemerkungen | Kunde Name | Telefon | Email | Was soll gemacht werden |
   Richtpreis | Was wurde gemacht | Endpreis | Kunde informiert am |
   Erstellt am | Zuletzt geändert am | Adresse
   ```

   **Hinweis für ein bereits bestehendes Sheet:** Falls die Kopfzeile schon
   aus der Zeit vor dem "Adresse"-Feld stammt, einfach eine neue Spalte mit
   dem Header `Adresse` ergänzen (Position egal, muss nicht ans Ende – der
   Code liest Spalten immer über den Kopfzeilen-Namen, nicht die Position).

2. Das Sheet muss für **dasselbe Google-Konto** zugänglich sein, mit dem
   auch der Calendar-OAuth-Flow (Schritt 3) durchgeführt wird/wurde
   (`radlhias.tv@gmail.com`) – entweder das Konto ist Eigentümer, oder das
   Sheet wurde für dieses Konto freigegeben (Bearbeiten-Rechte).

3. **Wichtig, falls Schritt 3 (Google Calendar) schon erledigt ist:** Der
   bestehende `GOOGLE_REFRESH_TOKEN` trägt bisher nur den Scope
   `calendar.events` und reicht für Sheets **nicht** aus. Der komplette
   OAuth-Playground-Flow aus Schritt 3 muss **erneut** durchlaufen werden –
   diesmal mit **beiden** Scopes gleichzeitig im Scope-Feld (Leerzeichen-
   getrennt):

   ```
   https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets
   ```

   Danach den neuen Refresh-Token setzen (überschreibt den alten – die
   Kalenderanbindung bleibt dabei funktionsfähig, weil der neue Token
   beide Scopes trägt):

   ```bash
   wrangler secret put GOOGLE_REFRESH_TOKEN
   ```

   Falls Schritt 3 noch gar nicht gemacht wurde: einfach direkt mit beiden
   Scopes einmalig durchführen, dann sind Calendar und Sheets in einem
   Rutsch erledigt.

4. Die Spreadsheet-ID aus der URL kopieren
   (`https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID`**`/edit`)
   und in `wrangler.toml` bei `GOOGLE_SHEETS_SPREADSHEET_ID` eintragen.
   `GOOGLE_SHEETS_SHEET_NAME` anpassen, falls der Tab nicht `Reparaturen`
   heißt.

5. `wrangler deploy`.

## 9. Blog-Verwaltung (D1 + KV + serverseitiges Rendering)

`admin-blog.html` (gleiches Admin-Passwort wie oben) ersetzt das frühere,
unsichere Admin-Panel in `index.html` (kein Passwortschutz mehr, manueller
`posts.json`-Download/-Upload, von Hand angelegte Dateien in `blog/`).
Artikel liegen jetzt in D1, Titelbilder in Workers KV (kein R2, damit keine
Zahlungsmethode auf dem Cloudflare-Account hinterlegt werden muss), und
`/blog/index.html` sowie
`/blog/<slug>.html` werden bei jedem Aufruf **serverseitig** vom Worker
gerendert (siehe `src/lib/blogTemplate.js`) – inklusive Meta-Description,
Open-Graph-Tags und `BlogPosting`-JSON-LD automatisch aus den Formularfeldern.
Auch `/sitemap.xml` wird dynamisch erzeugt (`src/lib/sitemap.js`) und enthält
neue Artikel automatisch.

1. D1-Migrationen anwenden (legt die `posts`-Tabelle an und importiert die
   8 bestehenden Artikel aus der alten `posts.json`/`blog/*.html`):

   ```bash
   wrangler d1 migrations apply radlhias-termine --remote
   ```

   (Falls Schritt 2 oben – D1-Datenbank anlegen – noch nicht gemacht wurde,
   zuerst das erledigen. Die Migrationen `0002_blog_posts.sql` und
   `0003_seed_posts.sql` laufen einfach mit, wenn du den Befehl aus Schritt 2
   erneut ausführst.)

2. KV-Namespace für Blog-Bilder anlegen:

   ```bash
   wrangler kv namespace create BLOG_IMAGES
   ```

   Die Ausgabe enthält eine `id` (z.B. `id = "abcd1234..."`). Diese in
   `wrangler.toml` beim `[[kv_namespaces]]`-Eintrag anstelle von
   `REPLACE_WITH_KV_NAMESPACE_ID` eintragen.

3. Die beiden neuen Routes in `wrangler.toml` sind bereits eingetragen
   (`radlhias.tv/blog/*` und `radlhias.tv/sitemap.xml`, zusätzlich zu
   `radlhias.tv/api/*`). Setzt voraus, dass `radlhias.tv` weiterhin per
   orangem Wölkchen durch Cloudflare läuft (siehe Haupt-README).

4. `wrangler deploy`.

Danach: `admin-blog.html` öffnen, einloggen (gleiches Passwort wie
`admin-werkstatt.html`/`admin-termine.html`), Artikel schreiben, Bild per
Drag & Drop hochladen (wird im Browser automatisch zu WebP verkleinert),
veröffentlichen – der Artikel ist sofort unter `/blog/<slug>.html` live.

**Hinweis Migration:** `worker/migrations/0003_seed_posts.sql` enthält die
8 bisherigen Artikel 1:1 (Text, Bilder, Datum, SEO-Beschreibung) – die alten
Dateien `posts.json` und `blog/*.html` wurden im Repo entfernt, da sie durch
D1 ersetzt sind. Nichts geht verloren: der komplette Inhalt steckt in dieser
Migration und in der Git-Historie.

## 10. Facebook-Seite (Blog-Cross-Posting)

`admin-blog.html` hat pro veröffentlichtem Artikel einen "📘 Facebook"-Button
(sowohl direkt nach dem Veröffentlichen als auch später in der Artikelliste),
der den Artikel per Facebook Graph API direkt auf eurer Unternehmensseite
postet (Titel + Kurzbeschreibung + Link, vor dem Absenden editierbar). Das ist
etwas anderes als der reine "Teilen"-Button auf der Artikelseite selbst
(sharer.php) – der Admin-Button postet gezielt und garantiert auf die Page,
nicht auf ein beliebiges, gerade eingeloggtes Profil.

Dafür braucht es einmalig:

1. Eine App im [Meta for Developers](https://developers.facebook.com/apps)
   Portal anlegen (Typ "Business").
2. Eure Facebook-Seite mit der App verknüpfen (App-Dashboard → Facebook-Login
   for Business / Seiten-Zugriff, oder einfach dich selbst als Admin der
   App + der Seite eintragen).
3. Ein langlebiges **Page Access Token** erzeugen – am einfachsten über den
   [Graph API Explorer](https://developers.facebook.com/tools/explorer/):
   - Oben rechts eure App auswählen, "Get Token" → "Get User Access Token"
     mit dem Recht `pages_manage_posts` (und `pages_read_engagement`).
   - Mit dem User-Token den Endpunkt `GET /me/accounts` aufrufen – die
     Antwort enthält pro verwalteter Seite ein eigenes, bereits langlebiges
     `access_token`. Das ist der Wert, der als `FB_PAGE_ACCESS_TOKEN` genutzt
     wird (läuft praktisch nicht ab, solange die App nicht deautorisiert wird).
   - Die `id` aus derselben Antwort ist eure `FB_PAGE_ID`.
4. Secrets/Var setzen:

```bash
wrangler secret put FB_PAGE_ACCESS_TOKEN
```

Und `FB_PAGE_ID` in `wrangler.toml` beim `[vars]`-Eintrag anstelle von
`REPLACE_WITH_FACEBOOK_PAGE_ID` eintragen.

Kein App-Review bei Meta nötig, solange nur du selbst (als Admin von App und
Seite) postest – Review wird erst Pflicht, sobald fremde Nutzer über die App
posten sollen.

## 11. Noch offen (aus dem Briefing, Punkt 11)

- [ ] Google Cloud Projekt + OAuth-Setup durchführen (Schritt 3)
- [ ] Brevo-Account-Frage klären + API-Key hinterlegen (Schritt 4)
- [ ] E-Mail-Texte final abstimmen (aktuell Entwurf in `src/lib/email.js`)
- [ ] Reparaturart-Dropdown final befüllen – aktuell in `termin.html` eine
      generische Liste (Wartung/Service, Bremsen, Schaltung, Reifen/Schlauch,
      E-Bike-Check, Sonstiges). Liste liegt im `<select id="repair-type">`.
- [ ] `ADMIN_USERNAME`, `ADMIN_PASSWORD` und `SESSION_SECRET` setzen (Schritt 5)
- [ ] D1-`database_id` in `wrangler.toml` eintragen (Schritt 2)
- [ ] Google Sheet für die Reparaturverwaltung anlegen + `GOOGLE_SHEETS_SPREADSHEET_ID`
      eintragen, Refresh-Token ggf. mit Sheets-Scope neu ausstellen (Schritt 8)
- [ ] KV-Namespace für Blog-Bilder anlegen + `id` in `wrangler.toml` eintragen +
      Migrationen ausführen + neue Routes deployen (Schritt 9)
- [ ] Facebook-Seite mit App verknüpfen, Page Access Token holen + `FB_PAGE_ID`
      in `wrangler.toml` + `FB_PAGE_ACCESS_TOKEN` als Secret setzen (Schritt 10)
