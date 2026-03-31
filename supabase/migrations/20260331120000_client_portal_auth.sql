create table if not exists client_portal_codes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  request_ip text,
  created_at timestamptz not null default now()
);

create index if not exists client_portal_codes_client_id_idx
  on client_portal_codes (client_id);

create index if not exists client_portal_codes_phone_idx
  on client_portal_codes (phone);

create index if not exists client_portal_codes_expires_at_idx
  on client_portal_codes (expires_at);

create table if not exists client_portal_sessions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_portal_sessions_client_id_idx
  on client_portal_sessions (client_id);

create index if not exists client_portal_sessions_expires_at_idx
  on client_portal_sessions (expires_at);

alter table client_portal_codes enable row level security;
alter table client_portal_sessions enable row level security;

drop policy if exists "client_portal_codes_admin_all" on client_portal_codes;
drop policy if exists "client_portal_sessions_admin_all" on client_portal_sessions;

create policy "client_portal_codes_admin_all" on client_portal_codes
  for all using (auth.role() = 'authenticated');

create policy "client_portal_sessions_admin_all" on client_portal_sessions
  for all using (auth.role() = 'authenticated');
