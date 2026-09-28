alter table public.bookings
  add column if not exists submission_key text;

create unique index if not exists bookings_submission_key_unique_idx
  on public.bookings (submission_key)
  where submission_key is not null;

comment on column public.bookings.submission_key is
  'Server-derived idempotency key for public booking inquiry submissions. Null for legacy and admin-created bookings.';
