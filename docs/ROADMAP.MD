# Bae Agenda Roadmap

Last reconciled: 2026-10-13 for Manager discovery/action queue; previously verified site/release facts retain their cited dates.

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
- Client portal code exists; user sign-in/release remains **blocked** pending a verified authenticated contact path and client isolation (see `PROJECT_STATUS.md`).
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

- **Overdue items in Manager:** Oct 8 Room to Bloom; Oct 10 Silent Disco/Elevate Social; other contacted leads Oct 12–13. Verify actual responses before any user-approved follow-up. Stale due dates do not prove no reply.
- **Oct 13 review decisions:** WERC Atlanta buyer/co-production relationship (no current opening/pay/travel), Chicago specialized paid-DJ application (user fit, fee, travel unknown), Athenaeum DJ eligibility; preserve prior introducer protocol and warm rebook context.
- **Oct 13 discovery evidence:** 10 due/attempted, 4 partial checks, 5 new sources, 5 signals, 2 review opportunities, 0 warm rebook creations/updates. Source/metric details: `docs/MANAGER_EXPANDED_DISCOVERY.md`.
- **Read-only Grok scout:** PR #185 updated the existing X/social prompt and Manager handoff; no Grok run or separate scheduler initiated.
- prioritize verified warm rebooks over equivalent cold leads and keep weak/speculative relationships out of Outreach Ready.
- measure whether source and network research produces **verified bookers, replies and paid gigs**, rather than collecting flyer volume. Preserve first-party history, user exclusions and incomplete social coverage.

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
