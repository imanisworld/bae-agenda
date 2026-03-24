create extension if not exists pgcrypto;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_created_at_idx on reviews (created_at desc);
create index if not exists reviews_approved_created_at_idx on reviews (approved, created_at desc);

alter table reviews enable row level security;

drop policy if exists "reviews_public_read_approved" on reviews;
drop policy if exists "reviews_admin_all" on reviews;

create policy "reviews_public_read_approved"
on reviews
for select
using (approved = true);

create policy "reviews_admin_all"
on reviews
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
