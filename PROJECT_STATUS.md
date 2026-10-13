# Project Status

Last reconciled: 2026-10-13.

## Current State

Core public-site, booking, admin, payment, invoice, email, analytics, and Manager workflows are implemented. Client Portal code exists but sign-in is not operational for current client records; it is withheld from public navigation until end-to-end testing succeeds.

Last audited GitHub `main` before this docs-only reconciliation: `5ab6f49b10ec8692b4def20044e9d15eef90db29` (PR #178). This is an audit anchor, not a live pointer; later merges may advance `main`.

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

- Silent Disco: contacted 2026-10-05; an Oct 10 follow-up was due. The outcome is **not re-verified in this Oct 13 docs pass**; check the current thread before any further outreach.
- Elevate Social: contacted 2026-10-05; an Oct 10 follow-up was due. The outcome is **not re-verified in this Oct 13 docs pass**; check the current thread before any further outreach.
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

## Oct 9 Preview-only Fixes (NOT live)

- Mobile Book dock: use native `/book` navigation, keep the gesture handler off interactive links/buttons; the booking tab resets correctly after Contact/FAQ. Requires real iPhone tap-through QA, and safe preview backend configuration for a non-production inquiry.
- Club Cunt: the Oct 31 flyer reference is replaced with a dedicated **New flyer coming soon** placeholder; Vercel **preview only** overlays November 21, 2026 for the event's displayed date. The canonical `public.events` record remains Oct 31, 2026 until explicit production-release approval. **Before public production release, update the canonical event date and check the admin/booking calendar; do not rely on a production overlay.** The old slug is retained for link stability.

## Next

1. Reconcile the current Silent Disco and Elevate Social threads before sending anything else; the Oct 10 follow-up outcomes were not verified in this docs pass.
2. Fix and test Manager recurrence detection for phrases the benchmark missed, including forms such as `each year`, `annual fundraising event`, and `every Saturday`.
3. Reconcile the existing production DJ Connection agency signal that is already marked `converted`; current code blocks agency signals from becoming opportunities, but this older record needs data-state cleanup rather than another sourcing rule.
4. Test **Ego Lite** on the same frozen Manager research benchmark prepared in draft PR #180. Use the owner's local/logged-in browser, research-only permissions, and no submit/send/authorize actions. Compare evidence quality, unique useful leads, stale/duplicate rate, and measurable time/cost against the existing baseline.
5. Keep **agent-labs-dev/fastbrowse** at **TEST FURTHER** unless a compatible model key is already available and a side-by-side run is still useful after the Ego Lite test.
6. Review draft PR #182 independently from the external-tool experiments; its deterministic CI guardrails address a proven gap without a model API key.
7. Decide whether to resume the parked Discovery Runs UI only after the backend history is useful enough to justify it.
8. Prepare and review real Portfolio photo/video media separately before publishing media assets.

## Open / Held

- Public Vibe experience from PR #149 is live in production.
- Event-media lightbox fixes from PR #152 are live in production; superseded PR #151 is closed.
- PR #59: older Full Portfolio Archive media galleries branch — intentionally held/separate while real photo/video media is prepared.
- PR #179: HyperFrames / Media Curator experiment — held; prototype exists but real-media value is not yet proven.
- PR #180: agent-labs Fastbrowse Manager benchmark — draft / **TEST FURTHER**; baseline exists, Fastbrowse arm did not run because a model key was unavailable.
- PR #181: Abide + Jev agent-policy eval — draft / **TEST FURTHER**; frozen eval exists, live tool arms remain unmeasured without compatible API access.
- PR #182: deterministic CI guardrails — draft; separate from the paid/external-tool experiments because it can enforce some high-value repo rules at $0.
- PR #183: fast-jev-codex context-retention eval — draft / **TEST FURTHER**; benchmark is frozen, live side-by-side remains unmeasured without a Jev key.
- Ego Lite: next browser-research candidate to test against PR #180's frozen Manager benchmark; no production integration is approved.
- UnmappedStack/FastBrowse: unrelated Windows file-explorer project; not a Manager/browser-agent candidate.
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
