# Bae Agenda Roadmap

Last reconciled on 2026-10-05 against the repository through PR #128.

## Rule

Do not rebuild a feature because it appears in an old plan. Check current code, production state, and Manager data first.

## Implemented

### Public site and business operations

- Public booking, events, mixes, portfolio, press kit, reviews, and contact flows
- Protected admin for bookings, clients, payments, invoices, events, mixes, portfolio, reviews, content, W-9, and Manager
- Booking intake with availability/conflict checks
- Supabase-backed booking/client/payment data
- Stripe Checkout deposit flow with signed webhook handling and payment deduplication
- Manual Zelle / Cash App payment handling
- Invoice draft generation, PDF generation, download, email sending, void/restore
- Client portal
- Resend email delivery
- Twilio SMS support
- Upstash rate limiting
- Daily Vercel cron for final-payment reminders, post-event follow-ups, and review requests
- Vercel Analytics and Speed Insights
- W-9 automation

### Resend delivery-status tracking

Verified operational:

- signed Resend webhook endpoint exists at `/api/resend/webhook`
- `email_delivery_events` exists in Supabase
- `RESEND_WEBHOOK_SECRET` is configured in Vercel production
- Resend webhook is enabled for sent/delivered/delayed/bounced/complained/failed/suppressed
- successful sent and delivered webhook events have been observed
- open/click tracking is intentionally excluded

### DJ B.A.E. Manager

Implemented:

- Today action queue
- direct-buyer sourcing rules and source-quality metrics
- scoring/economics and outreach prep
- warm-rebook scheduling
- negotiation assistant
- Active / Needs Action / Outreach Ready / Follow-up / Negotiating / Warm Rebooks / History / All views
- History handling for booked/passed/lost Manager leads
- 25-row admin pagination for Manager, Bookings, Events, Clients, and Invoices
- Booking History for completed/lost
- Events Upcoming / Past / All
- source-specific draft review and status correction during real-use QA

## Current Work

### Deployment and QA

Latest repository work through PR #128 is merged but not yet deployed because the Vercel Hobby deployment quota is temporarily blocking new production and preview builds.

After the quota resets:

1. deploy current `main`
2. verify the deployment SHA
3. run desktop/mobile visual and functional QA
4. fix only verified regressions

### Manager real-use pass

- work high-value live leads rather than adding more infrastructure
- prioritize verified warm rebooks over equivalent cold leads
- measure which sources, pitches, and economics produce responses/bookings
- keep weak or speculative relationship leads out of Outreach Ready

## Remaining Work — Only When Useful

- Manager junk/stale-record archive controls if real usage proves History/Pass is insufficient
- expenses / tax-support workflow and exportable reporting
- content-publish email notifications if there is a real audience/workflow for them
- contracts / e-signature integration
- advanced media-library features
- richer calendar only if current event/admin views prove insufficient
- role-based permissions only if the app grows beyond the current admin allowlist model
- deeper funnel/session analytics only if Vercel Analytics is insufficient

## Do Not Add Now

Do not add these without a concrete failure or requirement:

- a second generic Manager scheduler or pipeline-health cron
- Trigger.dev
- a second payment system
- a second generic analytics platform
- a new job queue for current reminder volume
- autonomous outreach, applications, booking acceptance, or negotiation decisions

## Manager Safety Rule

Manager may discover, score, research, draft, schedule follow-ups, and record decisions. It must not autonomously send outreach, submit applications, accept gigs, or book work.
