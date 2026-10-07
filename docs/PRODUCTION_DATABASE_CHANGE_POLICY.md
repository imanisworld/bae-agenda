# Production Database Change Policy

## Current production state

As re-audited on 2026-10-07:

- Supabase project is healthy and is the project configured in the production Vercel app.
- Production has migration-history drift: the live schema contains objects whose historical repo migration filenames are not all recorded in production.
- Manager tables already exist in production, including the discovery-runs backend.
- Vercel Git auto-deploys were disabled in PR #135. Merging to `main` no longer publishes the site automatically.
- Current production is deliberately deployed from the reviewed `main` commit rather than implicitly from each merge.

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

For metadata-only, reversible changes such as RLS policies and grants, prefer:

- no data-changing SQL,
- fail-closed preconditions,
- a narrowly scoped migration,
- an explicit reverse plan,
- immediate post-change verification.

Do not combine unrelated data edits with a schema/security migration.

## Current issue addressed by PR #101

### Legacy broad authenticated policies

The following legacy tables currently have broad policies equivalent to "any authenticated user" and broad client-role table grants:

- invoices
- reviews
- client_portal_codes
- client_portal_sessions
- booking_portal_requests

All five already have RLS enabled.

Current application code does not require broad authenticated write access:

- portal code/session/request access uses `createAdminClient()`
- public review submission and admin review moderation use `createAdminClient()`
- invoice mutations use `createAdminClient()`
- invoice PDF/send reads use the signed-in user client and separately enforce the application admin allowlist

Production currently has an active database admin allowlist entry, and `private.is_admin_user()` is present and executable by the authenticated role.

The companion hardening migration:

- refuses to run if the admin helper is missing or unusable
- refuses to run if the active database admin allowlist is empty
- refuses to run if any target table is missing
- refuses to run if any target table lacks RLS
- removes broad anon/authenticated table privileges
- permits authenticated invoice reads only through the existing admin helper
- preserves public read access only for approved reviews
- makes portal state server-only
- does not insert, update, or delete application rows

## Important admin-helper constraint

`private.is_admin_user()` intentionally allows signed-in users when the database admin allowlist is empty. That fallback predates PR #101 and is used by other admin RLS policies.

PR #101 therefore requires at least one active `public.admin_users` row before changing invoice access. Changing the helper itself to fail closed would affect multiple existing admin policies and should be reviewed as a separate hardening change rather than silently bundled here.

## Advisor findings outside PR #101

Current security advisor findings include:

- service-role-only tables with RLS and no client policies; these are intentional where the application accesses them only through the server-side service role
- leaked-password protection is disabled

Those are separate from the five-table legacy-policy fix and should not be bundled into this migration.

## Deployment policy

Database hardening and application deployment are separate actions.

- Merging PR #101 does not need to publish the website.
- Automatic Vercel Git deployments are disabled.
- Apply the exact reviewed database migration only after its production preflight passes.
- After the database change is verified, publish application code only if application code changed and a deployment is actually required.

## Postflight for PR #101

After applying the exact hardening migration:

- run Supabase security advisor
- run Supabase performance advisor
- confirm expected grants and policies on all five target tables
- confirm `anon` cannot read/write portal state or invoices
- confirm an allowlisted authenticated admin can read invoices
- confirm a non-admin authenticated user cannot read invoices
- verify public approved-review reads
- verify public review submission
- verify portal login/verification flow
- verify admin invoice reads and invoice send flow
- confirm production `/api/health` is OK
- inspect current production runtime errors
