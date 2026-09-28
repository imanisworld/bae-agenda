alter table public.bookings
  add column terms_accepted_at timestamptz,
  add column terms_version text;

comment on column public.bookings.terms_accepted_at is
  'Timestamp when a public booking inquiry explicitly accepted the Booking Terms. Null for legacy or admin-created bookings.';

comment on column public.bookings.terms_version is
  'Effective-date version of the Booking Terms accepted with the public inquiry.';
