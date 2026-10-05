# Project Status

Last reconciled: 2026-10-05.

## Current State

Core public-site, booking, admin, payment, invoice, client-portal, email, analytics, and Manager workflows are implemented.

Latest merged Manager work through PR #128 adds:

- warm-rebook scheduling
- negotiation guidance
- pipeline filters/history
- 25-row pagination for Manager, Bookings, Events, Clients, and Invoices
- Booking History for Completed + Lost
- Events Upcoming / Past / All

Current GitHub `main` before this status-only reconciliation is `6bb749a1ecca8c3f7dfe60895c031b28195b38bd`.

## Verified Operational

### Resend delivery tracking

Resend delivery-status tracking is complete and operational:

- `email_delivery_events` exists in Supabase
- `RESEND_WEBHOOK_SECRET` exists in Vercel production
- Resend webhook endpoint: `https://thebaeagenda.com/api/resend/webhook`
- webhook is enabled for sent, delivered, delivery-delayed, bounced, complained, failed, and suppressed
- successful `email.sent` and `email.delivered` webhook events have been observed

This is observability only and does not alter booking state or resend messages automatically.

### Manager live state

- Silent Disco: Outreach Ready; strongest immediate direct-buyer lead
- Elevate Social: Outreach Ready; verified creative-partnership route
- Jazz Is Dead: Review / relationship-only because no current DJ opening is verified
- Art & Soul 2027: warm rebook scheduled
- Punch Bowl Social Galentine's 2027: warm rebook scheduled
- Level Up Walkathon 2027: high-confidence warm rebook; prior organizer interest in having DJ B.A.E. back next year is recorded

Grok has authenticated X access for secondary scouting and Resend access. X findings remain candidate signals and must be verified before becoming actionable Manager leads. Resend access does not change the safety rule: no autonomous outreach or sending.

## Deployment State

Vercel Hobby deployment quota is currently blocking new production and preview builds.

Production therefore still trails current `main`. Do not create a replacement Vercel project or churn deployments to work around the quota.

## Next

1. After the Vercel quota resets, deploy current `main`.
2. Verify exact deployed SHA.
3. Run mobile/desktop visual and functional QA.
4. Fix verified deployment/UI regressions only.
5. Work Silent Disco and Elevate Social through user-controlled send/pass decisions.
6. Use Manager in real conditions and measure source quality, response rate, booked rate, and economics.
7. Add further automation only when real usage identifies a concrete gap.

## Deferred / Optional

- Manager junk/stale archive controls if History/Pass proves insufficient
- expenses/tax reporting
- content-publish notifications
- contracts/e-signature
- advanced media library
- richer calendar
- multi-user roles
- deeper analytics
