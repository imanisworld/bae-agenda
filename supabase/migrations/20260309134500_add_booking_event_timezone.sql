-- ============================================================
-- ADD EVENT TIMEZONE TO BOOKINGS
-- Purpose:
-- Store the event's intended local timezone separately so booking
-- times render correctly regardless of server location.
-- Existing rows default to America/Chicago because earlier booking
-- logic assumed Chicago local time.
-- Safe to run multiple times.
-- ============================================================

alter table bookings
  add column if not exists event_timezone text;

update bookings
set event_timezone = 'America/Chicago'
where event_timezone is null;

alter table bookings
  alter column event_timezone set default 'America/Chicago';

alter table bookings
  alter column event_timezone set not null;
