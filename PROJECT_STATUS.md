# Project Status

Last reconciled: 2026-10-07.

## Current State

Core public-site, booking, admin, payment, invoice, client-portal, email, analytics, and Manager workflows are implemented.

Current GitHub `main`: `712bcfaa6d32fb04c92ebdb5c498236ce59ef63e` (PR #138).

Latest merged Manager work through PR #138 adds warm-rebook scheduling, negotiation guidance, pipeline filters/history, admin pagination, required lead/event details before outreach, the Manager lead-save fix, actual externally sent-message recording, relationship intelligence/warm-rebook views, and source-health/weak-lead guardrails.

## Verified Production

Audit on 2026-10-07:

- Home, Book, Portfolio, Lab, and Press Kit return HTTP 200.
- Admin routes to login as expected.
- No recent production runtime warnings/errors were found in the available retention window.
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

Current production is `78fd1907b13a57489de7145043367e9430cf6c75` (PR #134). PRs #136, #137, and #138 are merged but not live yet. The payment-reminders cron remains configured against production.

## Next

1. QA #136-#138 together.
2. If clean, publish latest `main` once.
3. Verify deployed SHA and run mobile/desktop functional QA.
4. Follow up Silent Disco and Elevate Social on Oct 10.
5. Use Manager in real conditions and measure source quality, response rate, booked rate, and economics.
6. Address production DB hardening separately in PR #101 after review; do not blanket-push drifted Supabase migration history.

## Open / Held

- PR #101: production DB/RLS hardening — unresolved security work; keep separate.
- PR #59: Full Portfolio Archive media galleries — intentionally held/separate.
- Bot access for Manager — not started; approval-gated design only.

## Deferred / Optional

- Manager junk/stale archive controls if History/Pass proves insufficient
- expenses/tax reporting
- content-publish notifications
- contracts/e-signature
- advanced media library
- richer calendar
- multi-user roles
- deeper analytics
