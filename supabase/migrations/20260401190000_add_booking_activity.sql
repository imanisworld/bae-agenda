create table if not exists booking_activity (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index booking_activity_booking_id_idx on booking_activity(booking_id);
create index booking_activity_created_at_idx on booking_activity(created_at desc);
