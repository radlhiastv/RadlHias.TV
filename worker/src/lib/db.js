// D1-Hilfsfunktionen rund um die Tabelle `appointments`.

function newId() {
  return crypto.randomUUID();
}

export async function createAppointment(db, data) {
  const id = newId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO appointments
        (id, customer_name, customer_email, customer_phone, repair_type,
         description, requested_day, requested_window, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .bind(
      id,
      data.customer_name,
      data.customer_email,
      data.customer_phone,
      data.repair_type,
      data.description || null,
      data.requested_day,
      data.requested_window,
      now
    )
    .run();

  return { id, created_at: now };
}

export async function listAppointments(db, status) {
  if (status) {
    const { results } = await db
      .prepare(
        `SELECT * FROM appointments WHERE status = ?
         ORDER BY requested_day ASC, created_at ASC`
      )
      .bind(status)
      .all();
    return results;
  }
  const { results } = await db
    .prepare(`SELECT * FROM appointments ORDER BY created_at DESC`)
    .all();
  return results;
}

export async function getAppointment(db, id) {
  return db.prepare(`SELECT * FROM appointments WHERE id = ?`).bind(id).first();
}

export async function countPending(db) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM appointments WHERE status = 'pending'`)
    .first();
  return row ? row.n : 0;
}

export async function approveAppointment(db, id, { start_time, duration_minutes, calendar_event_id }) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE appointments
       SET status = 'approved', final_start_time = ?, final_duration_minutes = ?,
           calendar_event_id = ?, decided_at = ?
       WHERE id = ?`
    )
    .bind(start_time, duration_minutes, calendar_event_id || null, now, id)
    .run();
}

export async function rejectAppointment(db, id, { admin_note }) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE appointments
       SET status = 'rejected', admin_note = ?, decided_at = ?
       WHERE id = ?`
    )
    .bind(admin_note || null, now, id)
    .run();
}
