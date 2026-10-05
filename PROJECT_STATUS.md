# Project Status

Last reconciled: **2026-10-05**  
Repository: `imanisworld/bae-agenda`  
Production branch checked: `main` at `b74dcdd0397179e42ed4e30b81db50d916f34f25`

## Current State

The core Bae Agenda application is operational in production. Current overall production/runtime confidence is **~88-90%**.

### VERIFIED

- Current `main` has a READY Vercel production deployment.
- Latest PR CI passed:
  - tests
  - lint
  - production build
- `https://thebaeagenda.com/` returns HTTP 200.
- `/api/health` returns HTTP 200 and performs a real Supabase query before reporting `ok`.
- Supabase project status is `ACTIVE_HEALTHY`.
- Public Events is reading live event data successfully.
- `/book`, `/portal/login`, and the admin login route load successfully.
- Booking blocked-date API returns live blocked dates.
- Resend delivery webhook is enabled for the approved delivery lifecycle events.
- Supabase contains current `email.sent` and `email.delivered` events, including delivery activity on 2026-10-05.
- Stripe production environment variables are present in Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `CRON_SECRET` is present and `vercel.json` schedules `/api/cron/payment-reminders` daily.
- Current Supabase migrations include the booking, media, email-delivery, core-index, and Manager schema work.
- Manager foundation, source watchlist, opportunity tracking, activity history, outreach preparation, booking linkage, follow-up controls, and discovery work are now in the repository/database.

## Functional Confidence

| Area | Confidence | Evidence |
| --- | ---: | --- |
| Deployment / CI | ~98% | READY production deployment; tests/lint/build passing |
| App + database | ~97% | health endpoint + live Supabase query; project healthy |
| Public site / booking UI | ~97% | public routes and booking availability endpoint responding |
| Email / Resend | ~95% | live sent + delivered webhook events recorded |
| Booking / admin workflows | ~94% | regression tests + production data paths present |
| Payments / Stripe | ~90% | config present + webhook/payment tests; no fresh webhook transaction verified during audit |
| Client portal | ~90% | route/code/tests present; SMS configuration caveat below |
| Cron reminders | ~80% | schedule and secret verified; recent execution not independently observed |
| Manager | ~85% | current code/schema deployed; newer workflow with less runtime history |

## Known Gaps / Risks

### 1. Public rate limiting is currently not verified active

The application rate-limit code expects:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Those variables were **not found in the Vercel project environment listing** during the 2026-10-05 audit.

The code explicitly falls back to allowing requests when they are absent, so shared rate limiting is effectively disabled unless those values are being injected by another mechanism.

Existing `QSTASH_*` variables and `REDIS_URL` do not satisfy this code path. The README also states that `REDIS_URL` is unused.

Status: **LIKELY CONFIGURATION GAP**

### 2. Twilio / portal SMS is not verified configured

The code expects:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Those variables were **not found in the Vercel project environment listing** during the audit.

Portal SMS code returns `missing_config` when they are absent.

Status: **LIKELY CONFIGURATION GAP**

### 3. Cron execution needs runtime proof

The daily payment-reminder cron and `CRON_SECRET` are configured, but the audit did not find a recent invocation in the available Vercel runtime logs.

Status: **UNVERIFIED AT RUNTIME**

### 4. Stripe webhook needs one fresh end-to-end verification

Stripe configuration and webhook tests are present, and payment records exist, but the audit did not establish a fresh real Stripe webhook event flowing from Stripe -> Vercel -> Supabase.

Status: **UNVERIFIED END TO END**

### 5. Supabase advisories

Current Supabase advisor output includes:

- leaked-password protection disabled
- several RLS initialization-plan performance warnings
- multiple-permissive-policy performance warnings
- unused-index informational notices
- several RLS-enabled internal tables with no policies

The no-policy Manager/internal tables are not automatically a vulnerability: RLS with no client policies is deny-by-default for normal client roles. Review before changing anything.

Status: **REVIEW / HARDENING, NOT A CURRENT OUTAGE**

### 6. Historical Events permission error

Vercel recorded one `permission denied for table events` runtime error, last seen 2026-10-04.

Current production `/events` and `/api/health` both work and retrieve/query Events successfully, so this appears historical or resolved rather than an active failure.

Status: **CURRENTLY NOT REPRODUCING**

## Completed Core Capabilities

- Public site:
  - Home
  - Events
  - Lab
  - Portfolio / Past Work
  - Meet
  - Book
  - Contact / FAQ
  - Press kit / legal pages
- Booking intake:
  - availability/conflict checks
  - blocked-date calendar
  - submission idempotency
  - client receipt / owner notifications
- Protected admin:
  - bookings
  - clients
  - payments
  - events
  - mixes
  - portfolio/media
  - reviews
  - invoices
  - content
  - W-9
- Payments:
  - manual payment logging
  - Stripe deposit flow
  - signed webhook handling
  - payment deduplication
  - computed payment state
- Invoices:
  - draft creation
  - numbering
  - PDF generation
  - sending
  - paid state / stamp behavior
- Client portal
- Resend delivery-status tracking
- Daily reminder/follow-up/review cron code
- Vercel Analytics / Speed Insights
- Manager:
  - source watchlist
  - opportunity discovery
  - fit/economics
  - activity timeline
  - outreach prep
  - controlled dispatch/follow-up
  - booking conversion/linkage

## Exact Next Reliability Checks

1. Restore or configure the expected Upstash REST rate-limit variables and verify a real 429 path.
2. Decide whether portal SMS is intended to be active; if yes, configure Twilio and perform one controlled portal-code test.
3. Observe one successful scheduled `/api/cron/payment-reminders` production execution.
4. Verify one Stripe test/live webhook path end to end without creating duplicate payment state.
5. Re-run Vercel runtime errors and Supabase advisors after those checks.
6. Raise production functional confidence target to **95%+** only after the four runtime checks above are verified.

## Visual / Content State

Recent public-site cleanup on `main` includes:

- Book reduced to the single `Book` heading treatment.
- Contact reduced to the single `Contact` heading treatment.
- redundant Events labels removed.
- old top-right Indianapolis fallback removed.
- old Meet `Meet DJ B.A.E.` / `drag / tilt` treatment removed.
- Home hanging logo intentionally removed.
- Lab instruction sentence removed.
- AI-style contrast/filler copy cleanup merged.

Remaining visual confidence still depends on rendered browser QA for exact spacing, crop, clipping, and mobile/desktop composition.

## New Thread Handoff

```md
Project: Bae Agenda

As of 2026-10-05:
- Production app is operational.
- Overall functional confidence: ~88-90%.
- Current main was verified deployed with passing CI.
- Vercel + Supabase health checks pass.
- Public routes and live Events data work.
- Resend delivery tracking is live and has current delivered events.
- Stripe configuration exists, but one fresh webhook E2E verification is still needed.
- Daily cron is configured, but one observed production execution is still needed.
- Upstash REST rate-limit envs were not found, so rate limiting is likely disabled.
- Twilio envs were not found, so portal SMS is likely unavailable.
- Supabase has minor security/performance advisories; none currently indicate an outage.

Next reliability work:
1. verify/fix Upstash rate limiting
2. verify/configure Twilio if SMS is required
3. observe one cron execution
4. verify one Stripe webhook E2E
5. re-audit runtime errors/advisors

Do not rebuild completed booking/admin/payment/email/Manager features without checking current code first.
```
