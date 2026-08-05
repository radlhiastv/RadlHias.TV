-- RadlHias Werkstatt-Terminbuchung
-- Initial schema, siehe Briefing Punkt 4 "Datenmodell"

CREATE TABLE IF NOT EXISTS appointments (
  id                      TEXT PRIMARY KEY,
  customer_name           TEXT NOT NULL,
  customer_email          TEXT NOT NULL,
  customer_phone          TEXT NOT NULL,
  repair_type             TEXT NOT NULL,
  description             TEXT,
  requested_day           TEXT NOT NULL,   -- ISO Date, z.B. "2026-08-11"
  requested_window        TEXT NOT NULL,   -- z.B. "Mo 17:00-19:00"
  status                  TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_note              TEXT,
  final_start_time        TEXT,            -- ISO Datetime, erst bei Freigabe gesetzt
  final_duration_minutes  INTEGER,         -- erst bei Freigabe gesetzt
  calendar_event_id       TEXT,            -- Google Calendar Event-ID nach Anlage
  created_at              TEXT NOT NULL,   -- ISO Datetime
  decided_at              TEXT             -- ISO Datetime, wann freigegeben/abgelehnt wurde
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_requested_day ON appointments (requested_day);
