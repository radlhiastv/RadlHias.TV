/************************************************************************
 *  TOUR DE HIAS - Globale Bestenliste (Google Apps Script)
 *  ------------------------------------------------------------------
 *  Diesen Code komplett in den Apps-Script-Editor deiner Google-Tabelle
 *  einfuegen (siehe Schritt-fuer-Schritt-Anleitung von Cody).
 *
 *  Danach: Bereitstellen  ->  Neue Bereitstellung  ->  Typ: Web-App
 *          Ausfuehren als: Ich  |  Zugriff: Jeder
 *  Die erzeugte /exec-URL an Cody geben - er traegt sie ins Spiel ein.
 ************************************************************************/

const SHEET_NAME = 'Bestenliste';     // Tabellenblatt (wird automatisch angelegt)
const MAX_SCORE  = 100000;            // Plausibilitaetsgrenze gegen Schummeln
const TOP_N      = 25;                // wie viele Eintraege zurueckgegeben werden
const TZ         = 'Europe/Vienna';   // Zeitzone fuer die "Heute"-Wertung

function getSheet_() {
  // Funktioniert sowohl in einem an eine Tabelle gekoppelten Script
  // als auch in einem eigenstaendigen Projekt (legt dann selbst eine Tabelle an).
  const props = PropertiesService.getScriptProperties();
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    const id = props.getProperty('SHEET_ID');
    if (id) {
      ss = SpreadsheetApp.openById(id);
    } else {
      ss = SpreadsheetApp.create('Tour de Hias - Bestenliste');
      props.setProperty('SHEET_ID', ss.getId());
    }
  }
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Zeitstempel', 'Name', 'Meter', 'Datum', 'Herkunft']);
  }
  // Bestehende Tabellen (vor Einfuehrung der Herkunfts-Spalte) um Header E ergaenzen,
  // ohne bestehende Zeilen 2-12 anzutasten.
  if (!sh.getRange(1, 5).getValue()) {
    sh.getRange(1, 5).setValue('Herkunft');
  }
  return sh;
}

const SOURCE_OPTIONS = ['Flyer', 'Instagram', 'Empfehlung', 'Sonstiges'];

// Herkunft validieren: nur die vier erlaubten Optionen, sonst leer
function cleanSource_(raw) {
  const s = String(raw || '').trim();
  return SOURCE_OPTIONS.indexOf(s) !== -1 ? s : '';
}

// Bestenliste abrufen:  ...?mode=all  oder  ...?mode=daily
function doGet(e) {
  const mode = (e && e.parameter && e.parameter.mode) || 'all';
  const sh = getSheet_();
  const rows = sh.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const ts = rows[i][0];
    const name = rows[i][1];
    const score = Number(rows[i][2]);
    if (!name || isNaN(score)) continue;
    const dateStr = (ts instanceof Date)
      ? Utilities.formatDate(ts, TZ, 'yyyy-MM-dd')
      : String(rows[i][3]);
    if (mode === 'daily' && dateStr !== today) continue;
    out.push({ name: String(name), score: score });
  }
  out.sort((a, b) => b.score - a.score);
  return json_(out.slice(0, TOP_N));
}

// Namen saeubern: nur druckbare Zeichen, keine spitzen Klammern
function cleanName_(raw) {
  const s = String(raw || 'Anonym').slice(0, 24);
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const ch = s.charAt(i);
    if (c >= 32 && ch !== '<' && ch !== '>') res += ch;
  }
  res = res.trim();
  return res || 'Anonym';
}

// Neuen Score eintragen (POST mit JSON-Body: {name, score, source})
function doPost(e) {
  let name = 'Anonym', score = 0, source = '';
  try {
    const body = JSON.parse(e.postData.contents);
    name = cleanName_(body.name);
    score = Math.floor(Number(body.score));
    source = cleanSource_(body.source);
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }
  if (!isFinite(score) || score < 0 || score > MAX_SCORE) {
    return json_({ ok: false, error: 'invalid_score' });
  }
  const now = new Date();
  const date = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  getSheet_().appendRow([now, name, score, date, source]);
  return json_({ ok: true });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
