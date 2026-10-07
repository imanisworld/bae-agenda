# Production Database Change Policy

Last reconciled: 2026-10-07.

## Current production state

- Supabase production is healthy.
- Production migration history is historically drifted from the repository migration folder.
- Manager tables already exist in production, including Discovery Runs.
- PR #101 legacy access hardening is applied and verified.
- Automatic Vercel Git deployments are disabled; database changes and application deployments are separate actions.

## Non-negotiable rule

**Do not run a blanket `supabase db push` against production while migration history is drifted.**

A blanket push can attempt to replay historical migrations that are already represented in the live schema.

## Required production DB workflow

For every future production database change:

1. identify the exact Supabase production project
2. inspect the live schema and migration ledger
3. confirm every object/precondition the change expects
4. review one narrow migration
5. reject unrelated or destructive changes
6. apply only that exact reviewed migration
7. rerun security/performance advisors
8. verify schema, grants, RLS, row counts, and relevant integrity checks
9. smoke-test affected application flows
10. verify production `/api/health` and runtime logs
11. record the applied migration version/result

## Completed legacy-access hardening

PR #101 addressed broad client-role access on:

- `invoices`
- `reviews`
- `client_portal_codes`
- `client_portal_sessions`
- `booking_portal_requests`

Applied production migration:

`20261007171755_harden_legacy_authenticated_policies`

Verified after application:

- all five target tables retain RLS
- client portal state tables have no anon/authenticated SELECT or INSERT privileges
- invoices grant authenticated SELECT only and the RLS policy gates reads through `private.is_admin_user()`
- a non-admin identity fails the database admin helper
- the active allowlisted admin passes it
- reviews expose SELECT only through the approved-review policy
- review/portal writes remain server-side through the service-role client
- no application rows were inserted, updated, or deleted by the migration
- public site, portal login, and `/api/health` remained healthy
- production runtime verification showed no new warning/error/fatal logs

Do not reapply this migration.

## Admin-helper constraint

`private.is_admin_user()` is shared by multiple admin RLS policies.

Its historical behavior allows signed-in users when the database admin allowlist is empty. PR #101 did not change that shared behavior; instead, its migration fails closed if the active admin allowlist is empty.

Keep `public.admin_users` populated in production.

Changing the helper itself to fail closed everywhere should be treated as a separate reviewed security change because it can affect multiple admin policies.

## Service-role-only tables

Some internal tables intentionally have:

- RLS enabled
- no anon/authenticated table privileges
- no client policies
- server-side/service-role access only

Supabase may report these as informational “RLS enabled, no policy” findings. Do not add client policies merely to silence the advisor.

Examples include Manager/internal operational tables and client-portal state after PR #101.

## Remaining advisor items

Current unrelated items include:

- leaked-password protection disabled
- duplicate permissive policies on some older public/admin-read tables
- unused-index notices

These are separate cleanup/hardening work. Do not bundle them into unrelated migrations.

## Backup / rollback rule

For metadata-only changes:

- do not combine data edits
- use fail-closed preconditions
- define the reverse operation before applying
- verify immediately afterward

For any migration that changes or removes real business data, require an explicit backup/export and rollback plan first.

## Application deployment after DB changes

A database migration does not automatically require a new Vercel deployment.

If application code also changed:

1. merge reviewed code
2. QA the intended commit
3. create one deliberate production deployment
4. verify exact SHA and runtime health

Do not use Vercel Redeploy to publish newer merged commits.
