-- Additive column for inquiry alerts that did not send.
-- Not applied by this change. Apply it later as its own reviewed production migration.

alter table public.bookings
  add column if not exists notification_failure text;

comment on column public.bookings.notification_failure is
  'Comma-separated inquiry alert channels that failed (owner_email, client_receipt, owner_sms). Null when none failed.';
