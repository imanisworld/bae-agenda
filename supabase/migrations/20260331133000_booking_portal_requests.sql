create table if not exists booking_portal_requests (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  type text not null check (type in ('update', 'cancellation')),
  message text not null,
  preferred_contact text check (preferred_contact in ('phone', 'email')),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists booking_portal_requests_booking_id_idx
  on booking_portal_requests (booking_id);

create index if not exists booking_portal_requests_client_id_idx
  on booking_portal_requests (client_id);

create index if not exists booking_portal_requests_status_idx
  on booking_portal_requests (status);

alter table booking_portal_requests enable row level security;

drop policy if exists "booking_portal_requests_admin_all" on booking_portal_requests;

create policy "booking_portal_requests_admin_all" on booking_portal_requests
  for all using (auth.role() = 'authenticated');
