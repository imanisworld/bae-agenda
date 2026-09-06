# Project Status

## Current State

- Booking form UX/conflict flow has been improved.
- Booking email eligibility helpers were added and tested.
- W-9 auto-send on qualifying received payments was added.
- Invoice draft auto-create/refresh on booking confirmation was added.
- Computed payment state (`unpaid` / `partial` / `paid`) was added to the admin UI.
- Booking client email flow was trimmed to four sends.
- Daily Vercel cron handles final-payment reminders, post-event follow-ups, and review requests.
- Client portal, Stripe deposit flow, invoice sending, rate limiting, and Vercel analytics are already implemented.
- Resend delivery-status webhook tracking is being added without changing the existing send flow.

## Completed

- Booking form updates:
  - blocked-date calendar
  - structured time selection
  - clearer field-level validation
  - better availability/conflict feedback
- Booking email payload logic extracted into shared helpers with tests.
- W-9 automation:
  - threshold-based auto-send for qualifying received payments
  - shared W-9 PDF generator
- Invoice automation:
  - `invoices` table introduced
  - invoice draft created/refreshed when booking is confirmed
  - invoice PDF generation/download/email sending
- Payment state automation:
  - computed `unpaid` / `partial` / `paid`
  - shown in admin views
  - invoice payment state synced on payment logging
- Booking email cleanup:
  - extra deposit/event/fully-paid emails removed from active flow
  - admin email actions trimmed to the lean set
- Review request automation:
  - scheduled review request email sends 3-10 days after completed bookings
  - review request send history stamps on the booking record
- Booking cron:
  - daily cron is configured in `vercel.json` for reminder/follow-up/review sends
- Client portal and public payment page
- Stripe signed webhook with payment deduplication
- Upstash rate limiting
- Vercel Analytics and Speed Insights

## Still Needs Setup

- Link the Supabase project locally and apply the latest migrations.
- For Resend delivery tracking after merge/deploy:
  - apply the `email_delivery_events` migration
  - set `RESEND_WEBHOOK_SECRET`
  - register `https://thebaeagenda.com/api/resend/webhook` in Resend for the approved delivery lifecycle events

## Next

1. Finish and verify Resend delivery-status tracking.
2. Add completed-booking auto-archive.
3. Add content-publish email notifications.
4. Add a pipeline health-check cron.
5. Revisit expenses/tax support when that workflow becomes a priority.

## New Thread Handoff

Use this in a fresh thread when context gets messy:

```md
Project: Bae Agenda

Current state:
- Core booking/admin/payment/client-portal/invoice flows already exist.
- Stripe signed webhook, Vercel cron reminders, Upstash rate limiting, and Vercel analytics already exist.
- Booking email flow is inquiry, confirmation, final payment reminder, and thank-you, with scheduled review requests.
- Resend delivery-status tracking is the current observability addition; it must not alter booking state or resend messages automatically.

Important pending setup:
- Link Supabase locally and apply newest migrations.
- After Resend webhook deployment, set RESEND_WEBHOOK_SECRET and register the endpoint in Resend.

Next task after delivery tracking:
- Completed-booking auto-archive.
```
