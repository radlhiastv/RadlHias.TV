// Öffentliche, per QR-Code erreichbare Status-Seite für einen einzelnen
// Werkstatt-Auftrag (radlhias.tv/status/<id>.html). Kein Login nötig -- die
// UUID im Link ist praktisch nicht erratbar, das reicht für diesen Zweck.
// Zeigt bewusst nur, was der Kunde ohnehin am Auftrag stehen hat (kein
// Zugriff auf die volle Kundenliste, keine Adresse/E-Mail/Telefon).

import { shell, escapeHtml, formatDateDe } from "./blogTemplate.js";
import { STATUS_VALUES } from "./sheets.js";

const STEP_LABELS = {
  Angenommen: "Angenommen",
  "Ware bestellt": "Ersatzteile bestellt",
  "In Bearbeitung": "In Bearbeitung",
  "Kunde informiert/fertig": "Abholbereit",
};

const STATUS_STYLE = `
  :root {
    --navy:#1c3448; --navy2:#254560; --blue:#2d6e9e; --blue-lt:#a8c8dc;
    --orange:#c85a14; --cream:#f5f1eb; --cream2:#ede7dc; --cream3:#ddd6c8;
    --text:#2a3a48; --text-dim:#7a8a98; --shadow:0 2px 20px rgba(28,52,72,0.10);
    --green:#2a6a3a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Barlow', sans-serif; background: var(--cream); color: var(--text); }
  .status-wrap { max-width: 640px; margin: 0 auto; padding: 100px 20px 80px; }
  .status-card { background: #fff; border-radius: 14px; box-shadow: var(--shadow); border: 1px solid var(--cream2); padding: 32px 28px; }
  .status-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .status-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase; font-size: clamp(24px, 5vw, 32px); color: var(--navy); margin-bottom: 4px; }
  .status-sub { color: var(--text-dim); font-size: 14px; margin-bottom: 28px; }

  /* Eigene "status-" Präfixe, weil style.css (global auf jeder Seite
     geladen) bereits eine .step-Klasse für den Konfigurator-Wizard hat
     (display:none per default) -- ohne Präfix würde die hier kollidieren
     und den Tracker unsichtbar machen. */
  .status-steps { display: flex; gap: 4px; margin-bottom: 28px; }
  .status-step { flex: 1; text-align: center; }
  .status-step-dot { width: 30px; height: 30px; border-radius: 50%; background: var(--cream2); color: var(--text-dim); display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; border: 2px solid var(--cream3); }
  .status-step-label { font-size: 11.5px; color: var(--text-dim); line-height: 1.3; }
  .status-step.done .status-step-dot { background: var(--green); border-color: var(--green); color: #fff; }
  .status-step.done .status-step-label { color: var(--text); font-weight: 600; }
  .status-step.current .status-step-dot { background: var(--orange); border-color: var(--orange); color: #fff; }
  .status-step.current .status-step-label { color: var(--navy); font-weight: 700; }

  .status-badge { display: inline-block; background: rgba(200,90,20,0.12); color: var(--orange); font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 24px; }
  .status-badge.fertig { background: rgba(42,106,58,0.12); color: var(--green); }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--cream2); }
  .info-item span { display: block; font-family: 'Barlow Condensed', sans-serif; font-size: 11.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 2px; }
  .info-item b { font-size: 15.5px; color: var(--navy); }

  .status-box { background: var(--cream); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; font-size: 14.5px; line-height: 1.6; }
  .status-box h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; }

  .status-contact { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--cream2); font-size: 13.5px; color: var(--text-dim); line-height: 1.7; }
  .status-contact a { color: var(--orange); font-weight: 600; text-decoration: none; }
  .status-contact a:hover { text-decoration: underline; }

  .not-found { text-align: center; padding: 60px 20px; color: var(--text-dim); }
  .not-found h1 { font-family: 'Barlow Condensed', sans-serif; color: var(--navy); margin-bottom: 10px; }
`;

function fmtPreis(v) {
  if (!v) return "";
  const s = String(v).trim();
  return /€/.test(s) ? s : `${s} €`;
}

export function renderStatusPage(reparatur, origin) {
  const canonical = `${origin}/status/${reparatur.id}.html`;
  const stepIndex = Math.max(0, STATUS_VALUES.indexOf(reparatur.status));
  const isFertig = reparatur.status === "Kunde informiert/fertig";
  const rad = [reparatur.fahrradTyp, reparatur.hersteller, reparatur.modell, reparatur.farbe]
    .filter(Boolean)
    .join(" · ");

  const stepsHtml = STATUS_VALUES.map((s, i) => {
    const cls = i < stepIndex ? "done" : i === stepIndex ? "current" : "";
    const mark = i < stepIndex ? "✓" : String(i + 1);
    return `<div class="status-step ${cls}">
      <div class="status-step-dot">${mark}</div>
      <div class="status-step-label">${escapeHtml(STEP_LABELS[s] || s)}</div>
    </div>`;
  }).join("");

  const bodyHtml = `
<div class="status-wrap">
  <div class="status-card">
    <div class="status-eyebrow">RadlHias.TV Werkstatt</div>
    <h1 class="status-title">Status deines Fahrrads</h1>
    <p class="status-sub">${reparatur.kundeName ? `Hallo ${escapeHtml(reparatur.kundeName)}! ` : ""}Hier siehst du live, wie weit dein Service ist.</p>

    <div class="status-steps">${stepsHtml}</div>

    <span class="status-badge ${isFertig ? "fertig" : ""}">${escapeHtml(STEP_LABELS[reparatur.status] || reparatur.status || "Angenommen")}</span>

    <div class="info-grid">
      <div class="info-item"><span>Fahrrad</span><b>${escapeHtml(rad || "—")}</b></div>
      <div class="info-item"><span>Angenommen am</span><b>${escapeHtml(formatDateDe(reparatur.angenommenAm) || "—")}</b></div>
      ${reparatur.richtpreis && !isFertig ? `<div class="info-item"><span>Richtpreis</span><b>${escapeHtml(fmtPreis(reparatur.richtpreis))}</b></div>` : ""}
      ${isFertig && reparatur.endpreis ? `<div class="info-item"><span>Endpreis</span><b>${escapeHtml(fmtPreis(reparatur.endpreis))}</b></div>` : ""}
    </div>

    ${reparatur.auftrag ? `<div class="status-box"><h3>Auftrag</h3>${escapeHtml(reparatur.auftrag)}</div>` : ""}
    ${isFertig && reparatur.erledigt ? `<div class="status-box"><h3>Was wurde gemacht</h3>${escapeHtml(reparatur.erledigt)}</div>` : ""}

    ${isFertig
      ? `<div class="status-box" style="background:rgba(42,106,58,0.08); color:var(--green); font-weight:600;">Dein Fahrrad ist fertig und kann bei uns abgeholt werden. 🎉</div>`
      : ""}

    <div class="status-contact">
      Fragen zu deinem Auftrag? Ruf uns an unter <a href="tel:+436776298554">+43 677 629 855 44</a>
      oder schreib eine Mail an <a href="mailto:radlhias.tv@gmail.com">radlhias.tv@gmail.com</a>.
    </div>
  </div>
</div>`;

  return shell({
    title: "Status deines Fahrrads – RadlHias.TV",
    description: "Aktueller Status deines Werkstatt-Auftrags bei RadlHias.TV.",
    canonical,
    ogImage: "",
    robots: "noindex, nofollow",
    jsonLd: null,
    extraStyle: STATUS_STYLE,
    bodyHtml,
  });
}

export function renderStatusNotFoundPage(origin) {
  const bodyHtml = `
<div class="status-wrap">
  <div class="not-found">
    <h1>Auftrag nicht gefunden</h1>
    <p>Dieser Status-Link ist ungültig oder der Auftrag wurde bereits gelöscht.</p>
  </div>
</div>`;
  return shell({
    title: "Auftrag nicht gefunden – RadlHias.TV",
    description: "Dieser Status-Link ist ungültig.",
    canonical: `${origin}/status/`,
    ogImage: "",
    robots: "noindex, nofollow",
    jsonLd: null,
    extraStyle: STATUS_STYLE,
    bodyHtml,
  });
}
