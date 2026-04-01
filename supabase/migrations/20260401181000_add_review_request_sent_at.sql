alter table public.bookings
  add column if not exists review_request_sent_at timestamptz;
