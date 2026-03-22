alter table events
  add column if not exists booking_id uuid references bookings(id) on delete set null;

create unique index if not exists events_booking_id_unique_idx
  on events (booking_id)
  where booking_id is not null;
