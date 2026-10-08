# Bae Agenda Roadmap

Last reconciled: 2026-10-07.

## Rule

Do not rebuild a feature because it appears in an old plan. Check current code, production state, Manager data, and `PROJECT_STATUS.md` first.

## Implemented

### Public site and business operations

- Public booking, events, mixes, portfolio, press kit, reviews, and contact flows
- Protected admin for bookings, clients, payments, invoices, events, mixes, portfolio, reviews, content, W-9, and Manager
- Booking intake with availability/conflict checks
- Supabase-backed booking/client/payment data
- Stripe Checkout deposit flow with signed webhook handling and payment deduplication
- Manual Zelle / Cash App payment handling
- Invoice generation, PDF download, email sending, void/restore
- Client portal
- Resend email delivery + signed delivery-status webhook tracking
- Optional Twilio SMS support
- Optional Upstash shared rate limiting
- Daily Vercel cron for final-payment reminders, post-event follow-ups, and review requests
- Vercel Analytics and Speed Insights
- W-9 automation

### DJ B.A.E. Manager

Live in production:

- Today action queue
- direct-buyer sourcing rules
- source-quality metrics and weak-lead guardrails
- scoring, economics, and outreach prep
- required event details / What They Asked For checks
- actual sent-message recording
- relationship intelligence
- warm-rebook scheduling and views
- negotiation assistant
- follow-up and history handling
- Opportunity → Booking conversion
- Active / Needs Action / Outreach Ready / Follow-up / Negotiating / Warm Rebooks / History / All views
- 25-row pagination across major admin views
- Discovery Runs backend + daily tracking logic

The Discovery Runs UI is intentionally parked while the backend collects useful history.

### Production security / deployment

- Automatic Vercel Git deployments were disabled in PR #135.
- Production is published deliberately after an intended batch is QA'd.
- The latest verified application release is `11a81157285a748182aca18d9f48b258106e3b92` and includes the Public Vibe experience from PR #149 plus event-media lightbox fixes from PR #152.
- Production database hardening from PR #101 is applied and verified.
- Older Supabase migration-history drift still exists, so blanket `supabase db push` remains prohibited.

## Current Work

### Manager real-use pass

- follow up Silent Disco and Elevate Social on Oct 10 if there is no reply
- prioritize verified warm rebooks over equivalent cold leads
- let daily Discovery Runs collect data
- measure which sources, pitches, and economics produce responses/bookings
- keep weak/speculative relationship leads out of Outreach Ready
- improve discovery quality before adding volume

### Held / review-on-purpose work

- Public Vibe experience from PR #149 is live.
- Event-media lightbox fixes from PR #152 are live; PR #151 was superseded.
- PR #59: older Full Portfolio Archive media galleries implementation — held/separate while real photo/video media is prepared
- Discovery Runs UI — parked
- Manager bot-access/suggestions design — parked until there is a demonstrated need

## Remaining Work — Only When Useful

- Manager junk/stale-record archive controls if History/Pass proves insufficient
- leaked-password protection
- duplicate-permissive-policy / unused-index cleanup
- expenses / tax-support workflow
- contracts / e-signature
- advanced media-library features
- richer calendar
- multi-user roles
- deeper analytics

## Do Not Add Now

Do not add these without a concrete failure or requirement:

- a second generic Manager scheduler or discovery cron
- Trigger.dev
- a second payment system
- a second generic analytics platform
- a new job queue for current reminder volume
- autonomous outreach, applications, booking acceptance, or negotiation decisions

## Manager Safety Rule

Manager may discover, score, research, draft, schedule follow-ups, record actual messages, and record decisions. It must not autonomously send outreach, submit applications, accept gigs, or book work.
