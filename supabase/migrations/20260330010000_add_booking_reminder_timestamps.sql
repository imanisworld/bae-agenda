alter table bookings
  add column if not exists last_balance_reminder_sent_at timestamptz,
  add column if not exists last_event_reminder_sent_at timestamptz;
