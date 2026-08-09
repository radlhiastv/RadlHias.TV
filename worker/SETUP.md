# RadlHias Werkstatt-Terminbuchung – Setup & Deployment

Dieser Ordner enthält den Cloudflare Worker (API + D1-Datenbank), der die
Buchungsseite (`/termin.html`) und das Admin-Panel (`/admin-termine.html`) im
Hauptrepo bedient. Die folgenden Schritte sind **einmalig** nötig und
brauchen deine eigenen Zugänge (Cloudflare, Google, Brevo) – das kann ich
nicht für dich erledigen.

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
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET   # langer zufälliger String, z.B. `openssl rand -hex 32`
```

`ADMIN_PASSWORD` ist das Login-Passwort fürs Admin-Panel. `SESSION_SECRET`
signiert das Session-Cookie (HttpOnly) und sollte niemandem bekannt sein.

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

## 9. Noch offen (aus dem Briefing, Punkt 11)

- [ ] Google Cloud Projekt + OAuth-Setup durchführen (Schritt 3)
- [ ] Brevo-Account-Frage klären + API-Key hinterlegen (Schritt 4)
- [ ] E-Mail-Texte final abstimmen (aktuell Entwurf in `src/lib/email.js`)
- [ ] Reparaturart-Dropdown final befüllen – aktuell in `termin.html` eine
      generische Liste (Wartung/Service, Bremsen, Schaltung, Reifen/Schlauch,
      E-Bike-Check, Sonstiges). Liste liegt im `<select id="repair-type">`.
- [ ] `ADMIN_PASSWORD` und `SESSION_SECRET` setzen (Schritt 5)
- [ ] D1-`database_id` in `wrangler.toml` eintragen (Schritt 2)
- [ ] Google Sheet für die Reparaturverwaltung anlegen + `GOOGLE_SHEETS_SPREADSHEET_ID`
      eintragen, Refresh-Token ggf. mit Sheets-Scope neu ausstellen (Schritt 8)
