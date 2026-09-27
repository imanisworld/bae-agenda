-- Add explicit per-event timezone handling without reinterpreting existing rows.
-- Existing records remain NULL until individually reviewed in the admin UI.

alter table public.events
  add column if not exists event_timezone text;

comment on column public.events.event_timezone is
  'IANA timezone for the event local wall-clock time. NULL means legacy/unreviewed; do not bulk backfill without reviewing the intended local time.';
