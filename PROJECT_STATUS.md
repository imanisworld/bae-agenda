# Project Status

Last reconciled: 2026-10-07.

## Current State

Core public-site, booking, admin, payment, invoice, email, analytics, and Manager workflows are implemented. Client Portal code exists but sign-in is not operational for current client records; it is withheld from public navigation until end-to-end testing succeeds.

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

Current production application deployment is `11a81157285a748182aca18d9f48b258106e3b92`, deliberately deployed on 2026-10-07 after PR #149 (Public Vibe experience) and PR #152 (event-media lightbox fixes) merged. No new photo/video media assets were included in that release.

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

## Client Portal Release Gate (2026-10-09)

The portal remains an unreleased feature. A source-only change removes its public More/footer link and the booking FAQ promise; direct routes and data remain intact for development. This is **not live** until deliberately deployed. It is not a security access restriction.

Read-only checks found 3 clients associated with bookings, 0 stored client phone numbers, 1 stored client email, 0 active portal sessions, and 0 change requests. The production Vercel env list does not include the Twilio keys used by phone OTP. Fix an authenticated contact path and test client isolation before advertising the portal. See #157.

## Next

1. Follow up Silent Disco and Elevate Social on Oct 10.
2. Let daily discovery runs collect data and evaluate source quality / response / booked economics.
3. Decide whether to resume the parked Discovery Runs UI.
4. Prepare and review real Portfolio photo/video media separately before publishing media assets.

## Open / Held

- Public Vibe experience from PR #149 is live in production.
- Event-media lightbox fixes from PR #152 are live in production; superseded PR #151 is closed.
- PR #59: older Full Portfolio Archive media galleries branch — intentionally held/separate while real photo/video media is prepared.
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
