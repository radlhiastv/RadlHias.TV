import { corsHeaders, json } from "./lib/cors.js";
import { getNextAvailableSlots, isKnownWindowValue } from "./lib/windows.js";
import {
  createAppointment,
  listAppointments,
  getAppointment,
  countPending,
  approveAppointment,
  rejectAppointment,
} from "./lib/db.js";
import { createSessionCookie, clearSessionCookie, isAuthenticated } from "./lib/auth.js";
import { createCalendarEvent } from "./lib/calendar.js";
import { sendAdminNotification, sendApprovalEmail, sendRejectionEmail } from "./lib/email.js";
import { listReparaturen, appendReparatur, updateReparatur, deleteReparatur, STATUS_VALUES } from "./lib/sheets.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(msg) {
  return json({ error: msg }, { status: 400 });
}

async function requireAuth(request, env) {
  return isAuthenticated(request, env);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      // ---------------------------------------------------------------
      // Öffentliche Endpunkte
      // ---------------------------------------------------------------
      if (path === "/api/availability" && request.method === "GET") {
        const slots = getNextAvailableSlots(new Date(), 6);
        return json({ slots }, { status: 200 }, cors);
      }

      if (path === "/api/requests" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body) return badRequest("Ungültige Anfrage.");

        // Honeypot: Bots füllen oft alle Felder aus, echte Nutzer sehen das
        // Feld nie (per CSS versteckt). Vortäuschen von Erfolg, ohne zu
        // speichern oder Mails zu verschicken.
        if (body.website) {
          return json({ ok: true }, { status: 201 }, cors);
        }

        const { customer_name, customer_email, customer_phone, repair_type, description, window_value } = body;

        if (!customer_name || !customer_email || !customer_phone || !repair_type || !window_value) {
          return badRequest("Bitte alle Pflichtfelder ausfüllen.");
        }
        if (!EMAIL_RE.test(customer_email)) {
          return badRequest("Bitte eine gültige E-Mail-Adresse angeben.");
        }
        if (!isKnownWindowValue(window_value)) {
          return badRequest("Der gewählte Termin ist nicht mehr gültig, bitte neu auswählen.");
        }

        const [requested_day, requested_window] = window_value.split("|");

        const { id } = await createAppointment(env.DB, {
          customer_name: String(customer_name).slice(0, 200),
          customer_email: String(customer_email).slice(0, 200),
          customer_phone: String(customer_phone).slice(0, 60),
          repair_type: String(repair_type).slice(0, 120),
          description: description ? String(description).slice(0, 2000) : null,
          requested_day,
          requested_window,
        });

        const appointment = await getAppointment(env.DB, id);
        ctx.waitUntil(
          sendAdminNotification(env, appointment).catch((err) =>
            console.error("sendAdminNotification failed", err)
          )
        );

        return json({ ok: true, id }, { status: 201 }, cors);
      }

      // ---------------------------------------------------------------
      // Admin: Login / Logout
      // ---------------------------------------------------------------
      if (path === "/api/admin/login" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body || !body.password) return badRequest("Passwort fehlt.");

        if (body.password !== env.ADMIN_PASSWORD) {
          return json({ error: "Falsches Passwort." }, { status: 401 }, cors);
        }

        const cookie = await createSessionCookie(env);
        return json({ ok: true }, { status: 200 }, { ...cors, "Set-Cookie": cookie });
      }

      if (path === "/api/admin/logout" && request.method === "POST") {
        return json({ ok: true }, { status: 200 }, { ...cors, "Set-Cookie": clearSessionCookie() });
      }

      if (path === "/api/admin/me" && request.method === "GET") {
        const ok = await requireAuth(request, env);
        return json({ authenticated: ok }, { status: 200 }, cors);
      }

      // ---------------------------------------------------------------
      // Admin: geschützte Endpunkte
      // ---------------------------------------------------------------
      if (path.startsWith("/api/admin/")) {
        const ok = await requireAuth(request, env);
        if (!ok) return json({ error: "Nicht angemeldet." }, { status: 401 }, cors);
      }

      if (path === "/api/admin/summary" && request.method === "GET") {
        const pending = await countPending(env.DB);
        return json({ pending }, { status: 200 }, cors);
      }

      if (path === "/api/admin/requests" && request.method === "GET") {
        const status = url.searchParams.get("status") || undefined;
        const rows = await listAppointments(env.DB, status);
        return json({ requests: rows }, { status: 200 }, cors);
      }

      const approveMatch = path.match(/^\/api\/admin\/requests\/([^/]+)\/approve$/);
      if (approveMatch && request.method === "POST") {
        const id = approveMatch[1];
        const appointment = await getAppointment(env.DB, id);
        if (!appointment) return json({ error: "Anfrage nicht gefunden." }, { status: 404 }, cors);
        if (appointment.status !== "pending") {
          return json({ error: "Anfrage wurde bereits bearbeitet." }, { status: 409 }, cors);
        }

        const body = await request.json().catch(() => null);
        if (!body || !body.start_time || !body.duration_minutes) {
          return badRequest("Uhrzeit und Dauer sind erforderlich.");
        }
        const durationMinutes = Number(body.duration_minutes);
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          return badRequest("Ungültige Dauer.");
        }
        const startDate = new Date(body.start_time);
        if (Number.isNaN(startDate.getTime())) {
          return badRequest("Ungültige Startzeit.");
        }

        let calendarEventId = null;
        try {
          calendarEventId = await createCalendarEvent(env, {
            summary: `Werkstatt: ${appointment.customer_name} – ${appointment.repair_type}`,
            description: [
              `Telefon: ${appointment.customer_phone}`,
              `E-Mail: ${appointment.customer_email}`,
              appointment.description ? `Details: ${appointment.description}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
            startIso: startDate.toISOString(),
            durationMinutes,
          });
        } catch (err) {
          console.error("createCalendarEvent failed", err);
          return json(
            { error: "Termin konnte nicht im Google Calendar angelegt werden. Bitte später erneut versuchen." },
            { status: 502 },
            cors
          );
        }

        await approveAppointment(env.DB, id, {
          start_time: startDate.toISOString(),
          duration_minutes: durationMinutes,
          calendar_event_id: calendarEventId,
        });

        const updated = await getAppointment(env.DB, id);
        ctx.waitUntil(
          sendApprovalEmail(env, updated).catch((err) => console.error("sendApprovalEmail failed", err))
        );

        return json({ ok: true }, { status: 200 }, cors);
      }

      const rejectMatch = path.match(/^\/api\/admin\/requests\/([^/]+)\/reject$/);
      if (rejectMatch && request.method === "POST") {
        const id = rejectMatch[1];
        const appointment = await getAppointment(env.DB, id);
        if (!appointment) return json({ error: "Anfrage nicht gefunden." }, { status: 404 }, cors);
        if (appointment.status !== "pending") {
          return json({ error: "Anfrage wurde bereits bearbeitet." }, { status: 409 }, cors);
        }

        const body = await request.json().catch(() => ({}));
        await rejectAppointment(env.DB, id, { admin_note: body.admin_note || null });

        const updated = await getAppointment(env.DB, id);
        ctx.waitUntil(
          sendRejectionEmail(env, updated).catch((err) => console.error("sendRejectionEmail failed", err))
        );

        return json({ ok: true }, { status: 200 }, cors);
      }

      // ---------------------------------------------------------------
      // Admin: Werkstatt-Reparaturverwaltung (Google Sheets)
      // ---------------------------------------------------------------
      if (path === "/api/admin/reparaturen" && request.method === "GET") {
        const rows = await listReparaturen(env);
        return json({ reparaturen: rows }, { status: 200 }, cors);
      }

      if (path === "/api/admin/reparaturen" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body) return badRequest("Ungültige Anfrage.");

        const { kundeName, telefon, email, fahrradTyp, auftrag } = body;
        if (!kundeName || !fahrradTyp || !auftrag) {
          return badRequest("Bitte Kunde, Fahrradtyp und Auftrag ausfüllen.");
        }
        if (!telefon && !email) {
          return badRequest("Bitte Telefonnummer oder E-Mail-Adresse angeben.");
        }

        const record = await appendReparatur(env, {
          angenommenAm: body.angenommenAm ? String(body.angenommenAm).slice(0, 10) : undefined,
          fahrradTyp: String(fahrradTyp).slice(0, 120),
          hersteller: body.hersteller ? String(body.hersteller).slice(0, 120) : "",
          modell: body.modell ? String(body.modell).slice(0, 120) : "",
          farbe: body.farbe ? String(body.farbe).slice(0, 60) : "",
          bemerkungen: body.bemerkungen ? String(body.bemerkungen).slice(0, 2000) : "",
          kundeName: String(kundeName).slice(0, 200),
          telefon: telefon ? String(telefon).slice(0, 60) : "",
          email: email ? String(email).slice(0, 200) : "",
          adresse: body.adresse ? String(body.adresse).slice(0, 300) : "",
          auftrag: String(auftrag).slice(0, 2000),
          richtpreis: body.richtpreis != null ? String(body.richtpreis).slice(0, 40) : "",
        });

        return json({ ok: true, reparatur: record }, { status: 201 }, cors);
      }

      const reparaturMatch = path.match(/^\/api\/admin\/reparaturen\/([^/]+)$/);
      if (reparaturMatch && request.method === "PATCH") {
        const id = reparaturMatch[1];
        const body = await request.json().catch(() => null);
        if (!body) return badRequest("Ungültige Anfrage.");

        if (body.status !== undefined && !STATUS_VALUES.includes(body.status)) {
          return badRequest("Ungültiger Status.");
        }
        if (
          body.kundeInformiertAm !== undefined &&
          body.kundeInformiertAm !== "" &&
          !/^\d{4}-\d{2}-\d{2}/.test(String(body.kundeInformiertAm))
        ) {
          return badRequest("Ungültiges Datum.");
        }

        const patch = {};
        if (body.status !== undefined) patch.status = body.status;
        if (body.erledigt !== undefined) patch.erledigt = String(body.erledigt).slice(0, 2000);
        if (body.endpreis !== undefined) patch.endpreis = String(body.endpreis).slice(0, 40);
        if (body.bemerkungen !== undefined) patch.bemerkungen = String(body.bemerkungen).slice(0, 2000);
        // Wird gesetzt, wenn im Admin-Bereich der WhatsApp-"Rad ist fertig"-Button
        // geklickt wird (siehe admin-werkstatt.html) – unabhängig vom Status.
        if (body.kundeInformiertAm !== undefined) {
          patch.kundeInformiertAm = String(body.kundeInformiertAm).slice(0, 10);
        }

        const updated = await updateReparatur(env, id, patch);
        if (!updated) return json({ error: "Datensatz nicht gefunden." }, { status: 404 }, cors);

        return json({ ok: true, reparatur: updated }, { status: 200 }, cors);
      }

      if (reparaturMatch && request.method === "DELETE") {
        const id = reparaturMatch[1];
        // Löschen ist bereits durch die Admin-Session geschützt (siehe
        // requireAuth-Check oben für alle /api/admin/*-Routen). Im Frontend
        // gibt es zusätzlich eine Ja/Nein-Sicherheitsabfrage.
        const deleted = await deleteReparatur(env, id);
        if (!deleted) return json({ error: "Datensatz nicht gefunden." }, { status: 404 }, cors);

        return json({ ok: true }, { status: 200 }, cors);
      }

      return json({ error: "Not found" }, { status: 404 }, cors);
    } catch (err) {
      // Keine internen Debug-Ausgaben nach außen (Briefing Punkt 1) --
      // Details landen nur im Worker-Log.
      console.error("Unhandled error", err);
      return json({ error: "Es ist ein Fehler aufgetreten. Bitte später erneut versuchen." }, { status: 500 }, cors);
    }
  },
};
