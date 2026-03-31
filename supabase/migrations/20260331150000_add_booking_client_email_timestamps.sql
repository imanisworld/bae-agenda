alter table public.bookings
  add column if not exists inquiry_receipt_sent_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz;
