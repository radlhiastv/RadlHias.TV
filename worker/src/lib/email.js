// Transaktionale E-Mails über Brevo. Ton: direkt, persönlich, kein
// Marketing-Sprech, passend zur RadlHias-Stimme (siehe Briefing Punkt 8).
// Die Texte hier sind ein sinnvoller Erstentwurf -- Mathias wollte laut
// Briefing die finalen Texte noch separat abstimmen, das lässt sich hier
// jederzeit anpassen.

async function sendViaBrevo(env, { to, toName, subject, html }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: env.SENDER_NAME, email: env.SENDER_EMAIL },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo-Mail fehlgeschlagen (${res.status}): ${errText}`);
  }
}

function wrapHtml(bodyHtml) {
  return `<!doctype html>
<html lang="de"><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f1eb;padding:24px;color:#1c3448;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px 30px;border:1px solid #ddd6c8;">
${bodyHtml}
<p style="margin-top:28px;padding-top:16px;border-top:1px solid #ddd6c8;font-size:12px;color:#5a7a8a;">
RadlHias.TV Werkstatt &middot; ${''}
</p>
</div>
</body></html>`;
}

function formatDe(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("de-AT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTimeDe(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

/** 1. Neue Anfrage -> an Mathias */
export async function sendAdminNotification(env, appointment) {
  const html = wrapHtml(`
    <h2 style="margin:0 0 14px;">Neue Terminanfrage</h2>
    <p style="margin:0 0 10px;"><b>${appointment.customer_name}</b> möchte einen Werkstatttermin.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#5a7a8a;">Wunschtermin</td><td>${appointment.requested_window} (${appointment.requested_day})</td></tr>
      <tr><td style="padding:4px 0;color:#5a7a8a;">Reparaturart</td><td>${appointment.repair_type}</td></tr>
      <tr><td style="padding:4px 0;color:#5a7a8a;">E-Mail</td><td>${appointment.customer_email}</td></tr>
      <tr><td style="padding:4px 0;color:#5a7a8a;">Telefon</td><td>${appointment.customer_phone}</td></tr>
      ${appointment.description ? `<tr><td style="padding:4px 0;color:#5a7a8a;vertical-align:top;">Details</td><td>${appointment.description}</td></tr>` : ""}
    </table>
    <p style="margin:20px 0 0;">
      <a href="${env.ADMIN_PANEL_URL}" style="display:inline-block;background:#c85a14;color:#fff;text-decoration:none;padding:10px 18px;border-radius:7px;font-weight:bold;">Im Admin-Panel öffnen</a>
    </p>
  `);
  await sendViaBrevo(env, {
    to: env.ADMIN_EMAIL,
    subject: `Neue Terminanfrage: ${appointment.customer_name} (${appointment.requested_window})`,
    html,
  });
}

/** 2. Freigabe -> an Kunde */
export async function sendApprovalEmail(env, appointment) {
  const html = wrapHtml(`
    <h2 style="margin:0 0 14px;">Dein Werkstatttermin steht</h2>
    <p style="margin:0 0 14px;">Hallo ${appointment.customer_name},</p>
    <p style="margin:0 0 14px;">dein Termin für <b>${appointment.repair_type}</b> ist fix:</p>
    <p style="margin:0 0 14px;font-size:16px;">
      <b>${formatDe(appointment.final_start_time)}, ${formatTimeDe(appointment.final_start_time)} Uhr</b>
      ${appointment.final_duration_minutes ? `(ca. ${appointment.final_duration_minutes} Min.)` : ""}
    </p>
    <p style="margin:0 0 14px;">Adresse: ${env.WORKSHOP_ADDRESS}</p>
    <p style="margin:0 0 14px;">Bring dein Rad einfach zur vereinbarten Zeit vorbei. Falls du kurzfristig nicht kannst, meld dich einfach kurz per Mail oder WhatsApp.</p>
    <p style="margin:20px 0 0;">Bis bald,<br>Mathias</p>
  `);
  await sendViaBrevo(env, {
    to: appointment.customer_email,
    toName: appointment.customer_name,
    subject: `Terminbestätigung: ${formatDe(appointment.final_start_time)}, ${formatTimeDe(appointment.final_start_time)} Uhr`,
    html,
  });
}

/** 3. Ablehnung -> an Kunde */
export async function sendRejectionEmail(env, appointment) {
  const html = wrapHtml(`
    <h2 style="margin:0 0 14px;">Zu deiner Terminanfrage</h2>
    <p style="margin:0 0 14px;">Hallo ${appointment.customer_name},</p>
    <p style="margin:0 0 14px;">leider passt dein Wunschtermin (${appointment.requested_window}, ${appointment.requested_day}) bei mir gerade nicht.</p>
    ${appointment.admin_note ? `<p style="margin:0 0 14px;">${appointment.admin_note}</p>` : ""}
    <p style="margin:0 0 14px;">Versuch es gern nochmal für ein anderes Zeitfenster – meistens findet sich zeitnah ein Platz.</p>
    <p style="margin:20px 0 0;">Danke für dein Verständnis,<br>Mathias</p>
  `);
  await sendViaBrevo(env, {
    to: appointment.customer_email,
    toName: appointment.customer_name,
    subject: "Zu deiner Terminanfrage bei RadlHias.TV",
    html,
  });
}
