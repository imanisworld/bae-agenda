-- Add missing columns to events table
alter table events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists slug text,
  add column if not exists show_description boolean not null default false;

-- Back-fill updated_at
update events set updated_at = now() where updated_at is null;
