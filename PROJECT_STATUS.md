# Project Status

## Current State

- Rebase conflicts were resolved and the local branch is stable.
- Booking form UX/conflict flow has been improved.
- Booking email eligibility helpers were added and tested.
- W-9 auto-send on qualifying received payments was added.
- Invoice draft auto-create/refresh on booking confirmation was added.
- Computed payment state (`unpaid` / `partial` / `paid`) was added to the admin UI.
- Daily cron route was added for 7-day unpaid balance reminders.

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
- Invoice draft automation:
  - `invoices` table introduced
  - invoice draft created/refreshed when booking is confirmed
- Payment state automation:
  - computed `unpaid` / `partial` / `paid`
  - shown in admin views
  - invoice payment state synced on payment logging
- Timed reminder foundation:
  - protected cron endpoint for payment reminders
  - once-only reminder timestamp on bookings
  - `vercel.json` cron schedule added

## Still Needs Setup

- Apply the latest Supabase migrations.
- Set `CRON_SECRET` in Vercel.
- Deploy so production cron jobs can run.

## Next

1. Implement `48 hours before event -> auto-send event reminder` using the same cron/timestamp pattern.
2. Add post-event review request automation.
3. Add completed-booking auto-archive.
4. Add content-publish email notifications.
5. Add a pipeline health-check cron.

## New Thread Handoff

Use this in a fresh thread when context gets messy:

```md
Project: Bae Agenda

Current state:
- Rebase conflicts resolved, branch stable.
- Booking form UX/conflict flow fixed.
- Booking email eligibility helpers added and tested.
- W-9 auto-send on qualifying received payments added.
- Invoice draft auto-create on booking confirmation added.
- Computed payment state (`unpaid/partial/paid`) added to admin UI.
- Daily cron route added for 7-day unpaid balance reminders.

Important pending setup:
- Apply newest Supabase migrations.
- Set `CRON_SECRET` in Vercel.
- Deploy so cron runs in production.

Next task:
- Implement 48-hours-before-event automatic event reminder using the same cron/timestamp pattern.
```
