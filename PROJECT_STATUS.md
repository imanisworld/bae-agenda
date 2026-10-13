# Project Status

Last reconciled: 2026-10-13 for Manager records/docs; production deployment and unrelated site state below retain their stated **2026-10-07 / 2026-10-09** verification dates.

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

### Manager state documented on October 7 (historic outreach snapshot)

- Silent Disco: contacted 2026-10-05; follow-up Oct 10.
- Elevate Social: contacted 2026-10-05; follow-up Oct 10.
- Jazz Is Dead: passed 2026-10-05 because no Indianapolis date/open DJ slot was verified.
- Punch Bowl Social: use the existing Rich the Kid relationship before direct outreach.
- Art & Soul 2027, Punch Bowl Social Galentine's 2027, and Level Up Walkathon 2027 are scheduled warm-rebook work.

### Manager discovery / source of truth — verified October 13

Read-only Supabase project `ldsllgzcburcdqmkpelf` showed **70 portfolio entries**, **5 bookings**, **14 events**, **22 Manager opportunities**, **59 active recurring sources**, and **30 relevant signals** as of this review. These counts are a **snapshot**, not new additions from this docs update.

The Oct 13 discovery run `manager-discovery-20261013T140722.305418Z` is **partial**: 10 sources due/attempted, 4 incomplete coverage checks; 5 sources, 5 relevant signals and 2 review opportunities added; 0 new/updated warm rebooks and no outreach. WERC future collaboration and the Chicago specialized paid-DJ application remain **review-only** with important buyer/fit/pay/travel unknowns. Recurring DC/Detroit and Atlanta Pride sources are watch intelligence, not verified current DJ bookings. Consult `docs/MANAGER_EXECUTION_AGENDA.md` for exact next actions and `docs/scouting/todo.md` for the operational queue.

A previously user-excluded organizer/event source was independently verified **inactive** with `USER-EXCLUDED` notes and one ignored signal. Keep permanent exclusions across any DJ network mapping or social scout. The Grok research-only brief and agenda update were merged as [PR #185](https://github.com/imanisworld/bae-agenda/pull/185). **No Grok research execution, Manager outreach, scheduler, application code or deployment is implied by that docs merge.**

Overdue Manager follow-ups have persisted `contacted`/`review` statuses; do not assume a reply did not occur. Current-user-message history should be reviewed before any follow-up.

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

## Oct 9 Preview-only Fixes (NOT live)

- Mobile Book dock: use native `/book` navigation, keep the gesture handler off interactive links/buttons; the booking tab resets correctly after Contact/FAQ. Requires real iPhone tap-through QA, and safe preview backend configuration for a non-production inquiry.
- Club Cunt: the Oct 31 flyer reference is replaced with a dedicated **New flyer coming soon** placeholder; Vercel **preview only** overlays November 21, 2026 for the event's displayed date. The canonical `public.events` record remains Oct 31, 2026 until explicit production-release approval. **Before public production release, update the canonical event date and check the admin/booking calendar; do not rely on a production overlay.** The old slug is retained for link stability.

## Next — prioritized Manager review (October 13)

1. Reconcile overdue Manager next actions (Room to Bloom since Oct 8; Silent Disco and Elevate Social since Oct 10; other contacted leads since Oct 12–13) against actual communications. **Do not send from a documentation review.**
2. Obtain explicit artist-fit decision on the specialized Chicago application; investigate WERC's true hiring/payer route and review incomplete source→signal→opportunity metadata before considering edits.
3. Research existing independent DJ-led and direct-buyer networks rather than adding more speculative flyers; preserve repeat-client/introducer context and the user exclusion.
4. Maintain the scheduled Art & Soul (Oct 20), Galentine's (Nov 15), and Level Up Walkathon (May 15, 2027) warm reviews without inventing confirmed event dates or client commitments.
5. Keep the Discovery Runs UI and bot access infrastructure parked until an observed need justifies them. Continue separate portfolio/media and deployment work under their own approvals.

## Open / Held

- Public Vibe experience from PR #149 is live in production.
- Event-media lightbox fixes from PR #152 are live in production; superseded PR #151 is closed.
- PR #59: older Full Portfolio Archive media galleries branch — intentionally held/separate while real photo/video media is prepared.
- Bot access for Manager — not started; approval-gated design only.
- Discovery Runs UI branch — parked; backend/daily tracking logic already exists.
- [PR #184](https://github.com/imanisworld/bae-agenda/pull/184) — draft portfolio reconciliation; review scheduled appearances before any archive additions.
- [PR #186](https://github.com/imanisworld/bae-agenda/pull/186) — draft DJ playback-history cross-repo roadmap handoff; does not change the site or database.
- [PR #180](https://github.com/imanisworld/bae-agenda/pull/180) — experimental Fastbrowse benchmark, **not adopted**; evidence does not establish superior discovery.

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
