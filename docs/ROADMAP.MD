# Bae Agenda Roadmap

Last reconciled against `main` at `09e1e7ef6039da52b92af7448bcfc9d667dae9e7` on 2026-09-06.

## Rule

Do not rebuild a feature just because it still appears in an old plan. Check the current code first.
The previous phase-by-phase roadmap is preserved in Git history; this file now tracks only the
current implementation state and genuinely pending work.

## Implemented

These capabilities already exist in the current codebase:

- Public site: booking, events, mixes, portfolio, press kit, reviews, and contact flows
- Protected admin area: dashboard, bookings, clients, payments, events, mixes, portfolio, reviews, content, and W-9
- Booking intake with availability/conflict checks
- Supabase-backed booking/client/payment data
- Stripe Checkout deposit flow with signed webhook handling and payment deduplication
- Manual Zelle / Cash App payment handling
- Invoice draft generation, PDF generation, download, and email sending
- Client portal
- Resend email delivery
- Twilio SMS support
- Upstash rate limiting
- Daily Vercel cron for final-payment reminders, post-event follow-ups, and review requests
- Vercel Analytics and Speed Insights
- Client-render error reporting and structured server logging
- W-9 automation

## Current Work

### Resend delivery-status tracking

Add provider-confirmed delivery lifecycle evidence without changing the existing email-send flow.

Required pieces:

- verified Resend webhook endpoint
- raw-body signature verification
- idempotent event storage
- track only sent/delivered/delayed/bounced/complained/failed/suppressed events
- intentionally ignore open/click tracking
- apply the Supabase migration
- configure `RESEND_WEBHOOK_SECRET`
- register `https://thebaeagenda.com/api/resend/webhook` in Resend

This is infrastructure/observability only. It must not change booking state or resend messages automatically.

## Still Genuinely Pending

These are not already implemented based on the current repository audit:

- Expenses / tax-support workflow and exportable reporting
- Completed-booking auto-archive
- Content-publish email notifications
- Pipeline health-check cron
- FullCalendar-style admin calendar, if the existing event/admin views prove insufficient
- Contracts / e-signature integration
- Advanced media-library features
- Role-based permissions, if the app grows beyond the current admin allowlist model
- Deeper funnel/session analytics only if Vercel Analytics is insufficient

## Cleanup / Reuse Opportunities

Do these only when the relevant area is being worked on:

- Migrate hand-built email HTML to React Email when email templates next need meaningful changes.
  Do not rewrite working templates solely for this migration.
- Use an established e-signature provider for contracts rather than building signature infrastructure.
- Use FullCalendar or another mature calendar component if a richer admin calendar becomes necessary.

## Do Not Add Now

Do not add these unless a concrete failure or requirement appears:

- Trigger.dev
- a second cron/scheduler just to reproduce the existing Vercel reminder cron
- a second payment system to replace working Stripe flows
- a second generic analytics platform solely to duplicate Vercel Analytics
- a new job queue for the current reminder volume

## Deployment / Setup Debt

`PROJECT_STATUS.md` currently records one important environment task:

- link the Supabase project locally and apply the latest migrations

Any new migration, including Resend delivery-event storage, remains inactive until it is actually
applied to the intended Supabase environment.
