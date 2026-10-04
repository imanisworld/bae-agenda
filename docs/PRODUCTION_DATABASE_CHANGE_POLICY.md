# Production Database Change Policy

## Current production state

As audited on 2026-10-04:

- Supabase project is healthy and is the project configured in the production Vercel app.
- Production is on the Supabase Free plan.
- The repository contains 39 migration files, while production records 18 migrations.
- Several live tables/columns clearly exist even though their historical migration filenames are not recorded in production.
- Production therefore has **migration-history drift**.
- Main is currently not branch-protected and Vercel automatically deploys main.

## Non-negotiable rule

**Do not run a blanket `supabase db push` against production while migration history is drifted.**

A blanket push can attempt to replay historical migrations that are already represented in the live schema.

Until migration history is explicitly reconciled, production database changes must use this process:

1. Identify the exact production project before any write.
2. Read the live schema and confirm every object the migration expects.
3. Review the exact SQL as a single scoped migration.
4. Reject destructive statements unless they are independently justified.
5. Apply only that exact migration through the Supabase migration API/tool.
6. Re-run security and performance advisors.
7. Verify schema, grants, RLS policies, row counts, and foreign-key integrity.
8. Smoke-test the affected public/admin workflows.
9. Check current Vercel production runtime errors after the change.
10. Record the migration name and result.

## Backup / rollback constraint

This project is on Supabase Free. Supabase recommends Free-plan projects maintain their own regular logical exports; accessible scheduled backup/restore is not guaranteed like it is on Pro/Team/Enterprise.

For metadata-only, reversible changes (RLS policies, grants, new empty tables), prefer:

- no data-changing SQL,
- fail-closed preconditions,
- a narrowly scoped migration,
- an explicit reverse plan,
- immediate post-change verification.

Do not combine unrelated data edits with a schema/security migration.

## Current production issues found by audit

### Migration history drift

This is the largest deployment-process risk. Treat the live schema as authoritative until history is repaired deliberately.

### Legacy broad authenticated policies

The following legacy tables used policies equivalent to "any authenticated user":

- invoices
- reviews
- client_portal_codes
- client_portal_sessions
- booking_portal_requests

Production currently has two Auth users and one active admin allowlist entry. The non-admin Auth user is not a client email. Current application code does not require broad authenticated write access:

- portal code/session/request access uses `createAdminClient()`
- public review submission and admin review moderation use `createAdminClient()`
- invoice mutations use `createAdminClient()`
- invoice PDF/send reads use the signed-in user client and separately enforce the admin allowlist

The companion hardening migration narrows those privileges without changing application data.

### Advisor findings that are not blockers for Manager

- service-role-only tables with RLS and no client policies are intentional
- several unused indexes are informational at current scale
- several legacy RLS policies have performance warnings
- duplicate permissive public-read policies exist on some public tables
- leaked-password protection is disabled

These should be handled separately from the Manager migration rather than bundled into one production change.

### Historical events permission error

A prior deployment logged one `permission denied for table events` error. The current production deployment showed no error/warning logs in its baseline window. Keep this on the watch list; do not change event grants as part of the Manager work.

## Production preflight for Manager

Before creating Manager tables, confirm:

- `public.manager_profiles` does not exist
- `public.manager_opportunities` does not exist
- `public.bookings(id)` exists for the optional opportunity → booking foreign key
- `public.touch_updated_at()` exists
- existing FK orphan checks are all zero
- current production deployment is READY
- no new relevant production runtime errors are present

If any preflight condition fails, stop.

## Manager migration design

The Manager migration must be additive only:

- create two new private-business tables in `public`
- enable RLS
- revoke anon/authenticated access
- grant only required CRUD to `service_role`
- create indexes
- attach the existing updated-at trigger
- seed only identity fields that are known facts

Do **not** seed assumed rates, travel limits, event preferences, brand preferences, or other business rules.

## Postflight

After each production DB change:

- run Supabase security advisor
- run Supabase performance advisor
- confirm expected grants/policies
- verify existing core row counts remain unchanged
- re-run FK orphan checks
- verify homepage/events
- verify portal login flow reaches the login/verification UI
- verify admin login and invoice reads
- verify public approved-review reads
- inspect current production runtime errors
