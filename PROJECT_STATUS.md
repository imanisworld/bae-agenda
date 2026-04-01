# Project Status

## Current State

- Rebase conflicts were resolved and the local branch is stable.
- Booking form UX/conflict flow has been improved.
- Booking email eligibility helpers were added and tested.
- W-9 auto-send on qualifying received payments was added.
- Invoice draft auto-create/refresh on booking confirmation was added.
- Computed payment state (`unpaid` / `partial` / `paid`) was added to the admin UI.
- Booking client email flow was trimmed to four sends.
- Scheduled review request emails were added for completed bookings.

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
- Booking email cleanup:
  - extra deposit/event/fully-paid emails removed from active flow
  - admin email actions trimmed to the lean set
- Review request automation:
  - scheduled review request email sends 3-10 days after completed bookings
  - review request send history now stamps on the booking record
- Booking cron:
  - daily cron restored in `vercel.json` for reminder/follow-up/review sends

## Still Needs Setup

- Link the Supabase project locally and apply the latest migrations.

## Next

1. Decide later whether final payment reminders or thank-you emails should be re-automated.
2. Add completed-booking auto-archive.
3. Add content-publish email notifications.
4. Add a pipeline health-check cron.

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
- Booking email flow trimmed to inquiry, confirmation, final payment reminder, and thank-you.
- Scheduled review request email automation added.

Important pending setup:
- Link Supabase locally and apply newest migrations.

Next task:
- Add the next lightweight automation after review requests, likely completed-booking auto-archive.
```
