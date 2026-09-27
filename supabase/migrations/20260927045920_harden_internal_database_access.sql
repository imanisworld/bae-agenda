-- Harden internal database access.
--
-- booking_activity is service-role-only. The admin check moves out of the
-- exposed public schema. Trigger helpers get an explicit empty search_path.
--
-- admin_users and email_delivery_events stay policy-less on purpose. They are
-- internal tables: the app never reads or writes them with the anon or
-- authenticated client. RLS with no policies denies those roles, and their
-- table grants are revoked as defense in depth. Do not add client policies
-- just to clear the "RLS enabled, no policy" advisor info.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and (
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
      )
    );
$$;

revoke all on function private.is_admin_user() from public, anon, authenticated;
grant execute on function private.is_admin_user() to authenticated, service_role;

comment on function private.is_admin_user() is
  'Signed-in admin check. A populated allowlist admits only matching active emails. An empty allowlist admits authenticated users. Anon never passes.';

drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all" on public.clients
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all" on public.events
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "mixes_admin_all" on public.mixes;
create policy "mixes_admin_all" on public.mixes
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "site_content_admin_all" on public.site_content;
create policy "site_content_admin_all" on public.site_content
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "notes_admin_all" on public.notes;
create policy "notes_admin_all" on public.notes
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "Authenticated users can manage portfolio entries" on public.portfolio_entries;
create policy "Authenticated users can manage portfolio entries" on public.portfolio_entries
  for all to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop function if exists public.is_admin_user();

alter table public.booking_activity enable row level security;
revoke all on table public.booking_activity from anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.email_delivery_events from anon, authenticated;

comment on table public.admin_users is
  'Internal admin allowlist. RLS enabled with no client policies. Service role only.';

comment on table public.email_delivery_events is
  'Internal provider delivery metadata. RLS enabled with no client policies. Service role only.';
