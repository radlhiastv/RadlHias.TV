// Google Sheets Anbindung für die Werkstatt-Reparaturverwaltung. Das Sheet
// ist die alleinige Datenquelle (kein D1) – Mathias kann die Daten damit
// weiterhin ganz normal in Google Sheets einsehen/exportieren.
//
// Nutzt dasselbe OAuth-Refresh-Token-Pattern wie calendar.js. Der bestehende
// GOOGLE_REFRESH_TOKEN muss dafür zusätzlich den Scope
// https://www.googleapis.com/auth/spreadsheets tragen (siehe SETUP.md).

const HEADERS = [
  "ID",
  "Status",
  "Angenommen am",
  "Fahrrad Typ",
  "Hersteller",
  "Modell",
  "Farbe",
  "Bemerkungen",
  "Kunde Name",
  "Telefon",
  "Email",
  "Was soll gemacht werden",
  "Richtpreis",
  "Was wurde gemacht",
  "Endpreis",
  "Kunde informiert am",
  "Erstellt am",
  "Zuletzt geändert am",
  "Adresse",
];

// Zeilen-Objekt (JS, camelCase) <-> Spaltenname im Sheet.
const FIELD_MAP = {
  id: "ID",
  status: "Status",
  angenommenAm: "Angenommen am",
  fahrradTyp: "Fahrrad Typ",
  hersteller: "Hersteller",
  modell: "Modell",
  farbe: "Farbe",
  bemerkungen: "Bemerkungen",
  kundeName: "Kunde Name",
  telefon: "Telefon",
  email: "Email",
  adresse: "Adresse",
  auftrag: "Was soll gemacht werden",
  richtpreis: "Richtpreis",
  erledigt: "Was wurde gemacht",
  endpreis: "Endpreis",
  kundeInformiertAm: "Kunde informiert am",
  erstelltAm: "Erstellt am",
  geaendertAm: "Zuletzt geändert am",
};

export const STATUS_VALUES = [
  "Angenommen",
  "Ware bestellt",
  "In Bearbeitung",
  "Kunde informiert/fertig",
];

function sheetRange(env, a1) {
  const sheetName = env.GOOGLE_SHEETS_SHEET_NAME || "Reparaturen";
  return `${sheetName}!${a1}`;
}

async function getAccessToken(env) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google OAuth token refresh fehlgeschlagen (${res.status})`);
  }

  const data = await res.json();
  return data.access_token;
}

async function sheetsFetch(env, path, options = {}) {
  const accessToken = await getAccessToken(env);
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API fehlgeschlagen (${res.status}): ${errText}`);
  }

  return res.json();
}

function rowToObject(headerRow, row) {
  const obj = {};
  for (const [field, header] of Object.entries(FIELD_MAP)) {
    const idx = headerRow.indexOf(header);
    obj[field] = idx === -1 ? "" : row[idx] ?? "";
  }
  return obj;
}

function objectToRow(headerRow, obj) {
  return headerRow.map((header) => {
    const field = Object.keys(FIELD_MAP).find((f) => FIELD_MAP[f] === header);
    const value = field ? obj[field] : undefined;
    return value === undefined || value === null ? "" : value;
  });
}

async function readAll(env) {
  const data = await sheetsFetch(
    env,
    `/values/${encodeURIComponent(sheetRange(env, "A:S"))}`
  );
  const values = data.values || [];
  const headerRow = values.length ? values[0] : HEADERS;
  const rows = values.slice(1);
  return { headerRow, rows };
}

/**
 * Liefert alle Reparatur-Datensätze als Array von Objekten (neueste zuerst).
 */
export async function listReparaturen(env) {
  const { headerRow, rows } = await readAll(env);
  return rows
    .filter((row) => row.some((cell) => cell !== "" && cell !== undefined))
    .map((row) => rowToObject(headerRow, row))
    .reverse();
}

/**
 * Legt einen neuen Reparatur-Datensatz an ("Annahme").
 */
export async function appendReparatur(env, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const record = {
    id,
    status: "Angenommen",
    angenommenAm: data.angenommenAm || now.slice(0, 10),
    fahrradTyp: data.fahrradTyp || "",
    hersteller: data.hersteller || "",
    modell: data.modell || "",
    farbe: data.farbe || "",
    bemerkungen: data.bemerkungen || "",
    kundeName: data.kundeName || "",
    telefon: data.telefon || "",
    email: data.email || "",
    adresse: data.adresse || "",
    auftrag: data.auftrag || "",
    richtpreis: data.richtpreis || "",
    erledigt: "",
    endpreis: "",
    kundeInformiertAm: "",
    erstelltAm: now,
    geaendertAm: now,
  };

  await sheetsFetch(
    env,
    `/values/${encodeURIComponent(sheetRange(env, "A:S"))}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      body: JSON.stringify({ values: [objectToRow(HEADERS, record)] }),
    }
  );

  return record;
}

/**
 * Aktualisiert einen bestehenden Datensatz (Status, erledigte Arbeit,
 * Endpreis, ...). `patch` enthält nur die zu ändernden Felder.
 */
export async function updateReparatur(env, id, patch) {
  const { headerRow, rows } = await readAll(env);
  const idIdx = headerRow.indexOf("ID");

  let rowIndex = -1;
  let current = null;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][idIdx] === id) {
      rowIndex = i;
      current = rowToObject(headerRow, rows[i]);
      break;
    }
  }

  if (rowIndex === -1) return null;

  const now = new Date().toISOString();
  const updated = { ...current, ...patch, geaendertAm: now };

  // "Kunde informiert am" automatisch setzen, sobald der Status zum ersten
  // Mal auf "Kunde informiert/fertig" wechselt.
  if (
    patch.status === "Kunde informiert/fertig" &&
    current.status !== "Kunde informiert/fertig" &&
    !updated.kundeInformiertAm
  ) {
    updated.kundeInformiertAm = now.slice(0, 10);
  }

  // Sheet-Zeilen sind 1-basiert, +1 wegen Kopfzeile, +1 weil rowIndex 0-basiert.
  const sheetRowNumber = rowIndex + 2;
  await sheetsFetch(
    env,
    `/values/${encodeURIComponent(sheetRange(env, `A${sheetRowNumber}:S${sheetRowNumber}`))}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [objectToRow(headerRow, updated)] }),
    }
  );

  return updated;
}
