alter table public.bookings
  add column if not exists deposit_received_email_sent_at timestamptz,
  add column if not exists fully_paid_email_sent_at timestamptz,
  add column if not exists post_event_follow_up_sent_at timestamptz;
