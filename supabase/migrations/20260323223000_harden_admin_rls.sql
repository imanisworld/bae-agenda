-- Harden admin access policies with an explicit admin allowlist.
--
-- Transition behavior:
-- - If admin_users is empty, existing authenticated-user access still works.
-- - As soon as at least one active admin email is inserted, only listed admins keep access.

create table if not exists admin_users (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    not exists (
      select 1
      from public.admin_users
      where active = true
    )
    or exists (
      select 1
      from public.admin_users
      where active = true
        and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to anon, authenticated, service_role;

drop policy if exists "clients_admin_all" on clients;
drop policy if exists "events_admin_all" on events;
drop policy if exists "bookings_admin_all" on bookings;
drop policy if exists "payments_admin_all" on payments;
drop policy if exists "mixes_admin_all" on mixes;
drop policy if exists "site_content_admin_all" on site_content;
drop policy if exists "notes_admin_all" on notes;
drop policy if exists "Authenticated users can manage portfolio entries" on portfolio_entries;

create policy "clients_admin_all" on clients
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "events_admin_all" on events
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "bookings_admin_all" on bookings
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "payments_admin_all" on payments
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "mixes_admin_all" on mixes
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "site_content_admin_all" on site_content
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "notes_admin_all" on notes
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "Authenticated users can manage portfolio entries" on portfolio_entries
  for all using (public.is_admin_user()) with check (public.is_admin_user());
