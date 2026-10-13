# Operations Checklist

Last reconciled: 2026-10-13 for Manager discovery/follow-up review; other production-state checks retain their original dates.

This file tracks the current operating model for Bae Agenda and the best future automation targets.

## Daily / Frequent Checks

- Review new bookings in `/admin/bookings`
- Check pending reviews in `/admin/reviews`
- Look for unpaid deposits or balances in booking detail pages
- Review recent email activity before manual follow-ups
- Check upcoming events and confirmed bookings
- Review Manager Today for follow-ups, negotiations, outreach-ready leads, and blocked leads
- Review any **overdue** Manager follow-up against actual communications **before** resending, not solely the `next_action_at` or `contacted` status.
- Let Manager Discovery Runs collect source-quality history; do not create a duplicate generic discovery scheduler.
- Before adding or ranking discoveries, consult `docs/MANAGER_EXPANDED_DISCOVERY.md` for first-party portfolio/booking history, prior introducers, hard user-excluded aliases and source cadence. Preserve inactive/ignored exclusions.
- Use `docs/GROK_MANAGER_SCOUT_PROMPT.md` as a **read-only** secondary X/social research lane. Verify source evidence, existing opportunity links, the real buyer/payer, and feasible travel before recommending a paid booking. No Grok-side Supabase writes or messages.

## Booking Detail Actions

From a booking detail page you can manually send:

- inquiry receipt
- confirmation email
- final payment reminder
- post-event thank-you
- invoice email

Each successful send writes a timeline note to the booking.

## Automated Today

The daily Vercel cron already handles eligible:

- final-payment reminders
- post-event follow-ups
- review requests

Do not rebuild these as new schedulers unless the current workflow fails.

## Current Manual Rules

- Use inquiry receipt resend when the client says they never got the original message.
- Use confirmation resend only after the booking is confirmed or completed.
- Use a manual final-payment reminder only when the balance is still outstanding and the automated reminder is not sufficient.
- Keep money-sensitive or ambiguous messages manual.
- Manager outreach remains user-controlled; Manager may research/draft/record but must not autonomously send or submit.
- Daily discovery creates **one** run row per pass and records only observed coverage/counters; do not invent a successful check when an official/social page is blocked, or duplicate a previously saved signal/relationship.
- Previous appearances, shared flyers and tags do not establish artist preferences, favorable pay or a currently active booking relationship.

## Best Automation Candidates Later

Only automate after repeated real-world friction is observed:

- digest/reminder improvements
- richer contact discovery
- structured application assistance
- Manager suggestion workflow for external AI agents
- content-publish notifications if a real audience/workflow exists

## Environment / Service Checks

- Supabase env vars present
- Resend env vars present
- Upstash Redis env vars present when shared rate limiting is expected
- Twilio env vars present if SMS alerts are expected
- `ADMIN_EMAILS` populated in production
- `CRON_SECRET` present for the payment-reminder cron

## Database Safety

Production Supabase migration history is historically drifted.

- do not run blanket `supabase db push`
- inspect live schema first
- use narrow reviewed migrations
- verify RLS/grants and advisors after database changes

PR #101 legacy access hardening is already applied and verified.

## Deployment / Verification

Automatic Vercel Git deployments are disabled.

For an application release:

1. merge reviewed work into `main`
2. create a deliberate preview when runtime/visual QA is needed
3. verify the intended commit
4. create one deliberate production deployment
5. verify production SHA, `/api/health`, key routes, and runtime logs

Do not use Vercel Redeploy to publish newer merged commits.

Before shipping code changes, run the relevant checks:

```bash
npm run lint
npm run test
npm run build
```

## Notes

- Merging docs/database-history-only PRs does not require an application deployment.
- `.env.example`, the root `README.md`, `PROJECT_STATUS.md`, and Manager agenda should stay current as flows change.
