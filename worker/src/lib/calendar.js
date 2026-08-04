// Google Calendar Anbindung. Einmalige Einrichtung (OAuth Consent-Flow,
// Refresh-Token gewinnen) ist manuell nötig, siehe SETUP.md / Briefing Punkt 7.
// Ab dann holt sich der Worker bei jeder Freigabe selbstständig ein
// kurzlebiges Access-Token über den Refresh-Token.

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

/**
 * Legt einen Termin im Google Calendar an.
 * @returns {Promise<string>} Die Event-ID des angelegten Termins.
 */
export async function createCalendarEvent(env, { summary, description, startIso, durationMinutes }) {
  const accessToken = await getAccessToken(env);

  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const calendarId = encodeURIComponent(env.GOOGLE_CALENDAR_ID || "primary");

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar events.insert fehlgeschlagen (${res.status}): ${errText}`);
  }

  const event = await res.json();
  return event.id;
}
