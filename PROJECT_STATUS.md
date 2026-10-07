# Project Status

Last reconciled: 2026-10-07.

## Current State

Core public-site, booking, admin, payment, invoice, client-portal, email, analytics, and Manager workflows are implemented.

Last audited GitHub `main` before this docs-only reconciliation: `ef24ed79f8225d892c382967e5c6720f3746c6f5` (PR #143). This is an audit anchor, not a live pointer; later merges may advance `main`.

Latest live Manager work includes warm-rebook scheduling, negotiation guidance, pipeline filters/history, admin pagination, required lead/event details before outreach, Manager lead-save fixes, actual externally sent-message recording, relationship intelligence/warm-rebook views, and source-health/weak-lead guardrails.

Discovery Runs backend + daily tracking logic are installed in production; the UI branch remains parked without a PR.

## Verified Production

Audit on 2026-10-07:

- Home, Book, Portfolio, Lab, Press Kit, and portal login return HTTP 200.
- Admin/Manager routes fail closed to admin login when unauthenticated.
- Production `/api/health` returns 200 OK.
- No production warning/error/fatal runtime logs were found in the post-deploy / post-database-hardening verification windows.
- Email delivery tracking remains operational.

### Manager current state

- Silent Disco: contacted 2026-10-05; follow-up Oct 10.
- Elevate Social: contacted 2026-10-05; follow-up Oct 10.
- Jazz Is Dead: passed 2026-10-05 because no Indianapolis date/open DJ slot was verified.
- Punch Bowl Social: use the existing Rich the Kid relationship before direct outreach.
- Art & Soul 2027, Punch Bowl Social Galentine's 2027, and Level Up Walkathon 2027 are scheduled warm-rebook work.

## Deployment State

Automatic Vercel Git deployments were disabled in PR #135.

Workflow: merge approved PRs into `main` without publishing, QA the intended batch, then create one deliberate production deployment from latest `main`. Do not use Redeploy to publish newly merged commits because it rebuilds an older deployment.

Current production application deployment is `e4b4ae761b3a027b5efb2372c844ab559a68a775` (PR #139). PRs #140 and #101 changed documentation/database migration history only and did not require a new application deployment.

The payment-reminders cron remains configured against production.

## Database Hardening

PR #101 is complete.

Applied production migration:

`20261007171755_harden_legacy_authenticated_policies`

Verified:

- all five target tables retain RLS
- client portal state tables have no anon/authenticated SELECT or INSERT privileges
- invoices allow authenticated SELECT only through the existing admin helper
- a non-admin identity fails the admin helper
- the active allowlisted admin passes the admin helper
- reviews expose approved rows for public/authenticated reads only
- no application rows were changed by the migration
- post-change site health and runtime checks passed

Migration-history drift still exists from older historical migrations. Do not run blanket `supabase db push` against production.

Remaining unrelated advisor items:

- leaked-password protection is disabled
- service-role-only tables with RLS/no client policies generate informational advisor notices
- existing unused-index and duplicate-permissive-policy performance notices remain separate cleanup work

## Next

1. Follow up Silent Disco and Elevate Social on Oct 10.
2. Let daily discovery runs collect data and evaluate source quality / response / booked economics.
3. Decide whether to resume the parked Discovery Runs UI.
4. Decide whether to resume PR #59 Full Portfolio Archive media galleries.

## Open / Held

- PR #149: clean Public Vibe experience prototype — draft/preview-review only; replaces closed #142 and stays separate until intentionally reviewed.
- PR #59: Full Portfolio Archive media galleries — intentionally held/separate.
- Bot access for Manager — not started; approval-gated design only.
- Discovery Runs UI branch — parked; backend/daily tracking logic already exists.

## Deferred / Optional

- leaked-password protection
- duplicate-permissive-policy / unused-index cleanup
- Manager junk/stale archive controls if History/Pass proves insufficient
- expenses/tax reporting
- content-publish notifications
- contracts/e-signature
- advanced media library
- richer calendar
- multi-user roles
- deeper analytics
