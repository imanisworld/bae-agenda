# Bae Agenda Roadmap

Last reconciled: 2026-10-13.

## Rule

Do not rebuild a feature because it appears in an old plan. Check current code, production state, Manager data, and `PROJECT_STATUS.md` first.

## Implemented

### Public site and business operations

- Public booking, events, mixes, portfolio, press kit, reviews, and contact flows
- Public design/Press Kit revisions merged through #177; Built page removed from public routing for future redesign (#175)
- Homepage copy clean-up (#178), with shared agent writing rule in `AGENTS.md`
- Protected admin for bookings, clients, payments, invoices, events, mixes, portfolio, reviews, content, W-9, and Manager
- Booking intake with availability/conflict checks
- Supabase-backed booking/client/payment data
- Stripe Checkout deposit flow with signed webhook handling and payment deduplication
- Manual Zelle / Cash App payment handling
- Invoice generation, PDF download, email sending, void/restore
- Client Portal code/routes (not publicly released: current client sign-in cannot complete; issue #157)
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
- Latest verified production security release: `9d3b045fa5f0fee9913829ef78de94224d1cbcb7` (October 18, PR #193), Vercel `dpl_DG2rfFw6YUnpUdvhtFFHmwFyKADg`, READY and assigned to `thebaeagenda.com`. Next.js and matching ESLint config are `16.4.2`; six read-only live routes (including health and blocked-date availability) returned HTTP 200 before and after. Full inquiry, invoice, portal and device QA remain open under issue #157. Prior production build was `727e39c` (October 13, PR #191).
- Production database hardening from PR #101 is applied and verified.
- Older Supabase migration-history drift still exists, so blanket `supabase db push` remains prohibited.

## Current Work

### Manager real-use pass

- reconcile overdue Silent Disco/Elevate Social (Oct 10), other Oct 12–13 contacted leads, and Room to Bloom warm review (Oct 8) against **actual user communications** before any follow-up.
- prioritize verified warm rebooks over equivalent cold leads
- let daily Discovery Runs collect data
- measure which sources, pitches, and economics produce responses/bookings
- keep weak/speculative relationship leads out of Outreach Ready
- improve discovery quality before adding volume: Oct 13 run was **partial**, with 5 sources, 5 signals, 2 review opportunities, but no warm rebooks or outreach. Prioritize who **actually books/pays** and the user-exclusion rules over flyer counts.
- review WERC Atlanta future collaboration (current buyer/opening, economics unverified) and the Chicago specialized paid-DJ application (user fit/pay/travel not established); keep AfroCode, Sun & Sound and Atlanta Pride as future-watch intelligence.
- Grok research instructions were updated in PR #185; research-only, not a second scheduler or proof Grok executed. Use `docs/MANAGER_EXECUTION_AGENDA.md` for all Manager next actions and first-party-history safeguards.

### Current public-site acceptance — #157

- Test Book links/form and one isolated non-production inquiry; confirm mobile and desktop usability
- Test Lab cover/tap/drag/swipe/keyboard/reduced-motion on real devices
- Make Client Portal login/contact verification usable before restoring public links; test client isolation
- Run fresh live health/route/log/browser checks before closing the **full site** milestone; PR #178's targeted release does not satisfy those tests

### Held / review-on-purpose work

- Local-only Media Curator #154/#155 is merged; run one real-event review before publishing any assets
- PR #59: Full Portfolio Archive galleries remain held; 0 `portfolio_media` rows as of October 13
- Issue #171: admin-managed TBA dates, optional event signup and special instructions — no invented dates
- Issue #175: Built redesign — backlog, page not publicly routed
- Discovery Runs UI and Manager bot suggestions — parked
- PRs #179–#183: tool evaluations/experiments held without proven adoption value

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
