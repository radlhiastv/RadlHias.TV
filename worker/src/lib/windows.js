// Feste Zeitfenster für die Werkstatt-Terminvergabe.
// Phase 2 (später): im Admin-Panel editierbar machen. Für den Start reicht
// diese Config im Code, siehe Briefing Punkt 5.

export const AVAILABLE_WINDOWS = [
  { day: "Montag", weekday: 1, start: "17:00", end: "19:00" },
  { day: "Mittwoch", weekday: 3, start: "17:00", end: "19:00" },
  { day: "Freitag", weekday: 5, start: "17:00", end: "19:00" },
];

const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatLabelDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${WEEKDAY_SHORT[date.getDay()]}, ${day}.${month}.`;
}

/**
 * Berechnet die nächsten `count` verfügbaren Termine ausgehend von den
 * konfigurierten Wochentag-Zeitfenstern. Es wird kein Abgleich mit bereits
 * gestellten/bestätigten Anfragen gemacht (siehe Briefing Punkt 3: Mathias
 * entscheidet manuell bei Überschneidungen).
 *
 * @param {Date} from Startpunkt (i.d.R. "jetzt")
 * @param {number} count Anzahl gewünschter Vorschläge
 */
export function getNextAvailableSlots(from = new Date(), count = 6) {
  const slots = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let guard = 0;

  while (slots.length < count && guard < 60) {
    guard++;
    for (const w of AVAILABLE_WINDOWS) {
      if (cursor.getUTCDay() === w.weekday) {
        slots.push({
          day: w.day,
          date: toIsoDate(cursor),
          label: formatLabelDate(cursor),
          start: w.start,
          end: w.end,
          window: `${w.day} ${w.start}-${w.end}`,
          // eindeutiger Wert fürs <select>/Radio im Frontend
          value: `${toIsoDate(cursor)}|${w.day} ${w.start}-${w.end}`,
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.slice(0, count);
}

export function isKnownWindowValue(value) {
  const slots = getNextAvailableSlots(new Date(), 12);
  return slots.some((s) => s.value === value);
}
