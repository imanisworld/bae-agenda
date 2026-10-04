-- Production safety hardening for legacy admin/client-portal policies.
-- Metadata-only: no application rows are inserted, updated, or deleted.
--
-- IMPORTANT:
-- Production migration history is drifted from the repository. Apply this
-- migration by exact reviewed SQL only; do not run a blanket db push.

do $$
begin
  if to_regprocedure('private.is_admin_user()') is null then
    raise exception 'Required function private.is_admin_user() is missing';
  end if;

  if not has_function_privilege('authenticated', 'private.is_admin_user()', 'EXECUTE') then
    raise exception 'authenticated role cannot execute private.is_admin_user()';
  end if;

  if to_regclass('public.invoices') is null
     or to_regclass('public.reviews') is null
     or to_regclass('public.client_portal_codes') is null
     or to_regclass('public.client_portal_sessions') is null
     or to_regclass('public.booking_portal_requests') is null then
    raise exception 'Expected production tables are missing; stop rather than partially harden';
  end if;
end
$$;

-- Invoices are read through the signed-in admin session in invoice API routes.
-- Mutations elsewhere use the server-side service-role client.
drop policy if exists invoices_admin_all on public.invoices;
drop policy if exists invoices_admin_read on public.invoices;

revoke all on table public.invoices from anon, authenticated;
grant select on table public.invoices to authenticated;
grant select, insert, update, delete on table public.invoices to service_role;

create policy invoices_admin_read
on public.invoices
for select
to authenticated
using ((select private.is_admin_user()));

-- Public visitors only need approved review reads. Public review submission and
-- admin moderation both go through server actions using the service-role client.
drop policy if exists reviews_admin_all on public.reviews;
drop policy if exists reviews_public_read_approved on public.reviews;

revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant select, insert, update, delete on table public.reviews to service_role;

create policy reviews_public_read_approved
on public.reviews
for select
to anon, authenticated
using (approved = true);

-- Client portal state is intentionally server-only. The portal uses its own
-- hashed-code/session scheme and accesses these tables only via createAdminClient().
drop policy if exists client_portal_codes_admin_all on public.client_portal_codes;
drop policy if exists client_portal_sessions_admin_all on public.client_portal_sessions;
drop policy if exists booking_portal_requests_admin_all on public.booking_portal_requests;

revoke all on table public.client_portal_codes from anon, authenticated;
revoke all on table public.client_portal_sessions from anon, authenticated;
revoke all on table public.booking_portal_requests from anon, authenticated;

grant select, insert, update, delete on table public.client_portal_codes to service_role;
grant select, insert, update, delete on table public.client_portal_sessions to service_role;
grant select, insert, update, delete on table public.booking_portal_requests to service_role;

comment on table public.client_portal_codes is
  'Server-only portal verification state. Service-role access only.';
comment on table public.client_portal_sessions is
  'Server-only hashed portal session state. Service-role access only.';
comment on table public.booking_portal_requests is
  'Server-only client portal requests. Service-role access only.';
