# Operations Checklist

This file tracks the current manual operating model for Bae Agenda and highlights the best future automation targets.

## Daily / Frequent Checks

- Review new bookings in `/admin/bookings`
- Check pending reviews in `/admin/reviews`
- Look for unpaid deposits or balances in booking detail pages
- Review recent email activity on bookings before sending follow-ups
- Check upcoming events and confirmed bookings on the admin dashboard

## Booking Detail Actions

From a booking detail page you can manually send:

- Inquiry receipt
- Confirmation email
- Deposit reminder
- Balance reminder
- Event reminder
- Invoice email

Each successful send writes a timeline note to the booking so the communication history stays visible.

## Current Manual Rules

- Use inquiry receipt resend when the client says they never got the original message
- Use confirmation resend only after the booking is confirmed or completed
- Use deposit reminder only when deposit is still outstanding
- Use balance reminder only when total balance is still outstanding
- Use event reminder only for confirmed or completed bookings

## Best Automation Candidates Later

These are the strongest automation opportunities once the manual workflow feels stable:

- Auto-follow-up for new inquiries after a set delay
- Auto-send confirmation when a booking becomes `confirmed`
- Scheduled deposit reminders based on event date or booking date
- Scheduled balance reminders based on event proximity
- Scheduled event reminders one or more days before the event
- Daily digest for stale inquiries, pending reviews, and upcoming events

## Things To Keep Manual For Now

- Money-sensitive reminders when booking data is incomplete
- Messages that depend on venue/time details being finalized
- Anything that could send to the wrong client if booking records are still being edited

## Environment / Service Checks

- Supabase env vars present
- Resend env vars present
- Upstash Redis env vars present
- Twilio env vars present if SMS alerts are expected
- `ADMIN_EMAILS` populated in production

## Verification

Before shipping changes, run:

```bash
npm run lint
npm run build
```

## Notes

- CI now runs lint and build on pushes to `main` and pull requests
- `.env.example` and the root `README.md` should stay current as env vars or flows change
