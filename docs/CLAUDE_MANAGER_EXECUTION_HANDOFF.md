# Claude Manager Execution Handoff

Work in `imanisworld/bae-agenda`.

Start by reading:

1. `PROJECT_STATUS.md`
2. `docs/MANAGER_EXECUTION_AGENDA.md`
3. `docs/MANAGER_EXPANDED_DISCOVERY.md`
4. current Manager code under `app/(admin)/admin/(protected)/manager`
5. `lib/manager-*.ts`
6. current production state only through approved/read-only project tools

Treat `PROJECT_STATUS.md` and `docs/MANAGER_EXECUTION_AGENDA.md` as the current source of truth. Old planning docs are historical unless they were reconciled on or after 2026-10-07.

## Current Manager state

Already live:

- Today action surface
- scoring and gig economics
- Sources / Watchlist
- source-quality metrics and weak-lead guardrails
- activity/history
- outreach prep
- What They Asked For checks
- actual sent-message recording
- controlled dispatch support
- follow-up queue
- Opportunity → Booking conversion
- relationship intelligence
- warm-rebook views
- negotiation assistance
- Discovery Runs backend + daily tracking

Do not rebuild these.

## Current execution priority

1. work real eligible leads and scheduled follow-ups
2. prioritize warm rebooks over equivalent cold leads
3. let Discovery Runs collect enough history to measure source quality
4. improve discovery quality/enrichment only where it changes a decision
5. finish the Discovery Runs UI only if collected data shows it is useful
6. add Manager automation only after an observed workflow gap
7. keep content/video tooling separate from Manager business-development logic

## Current outreach state

- Silent Disco: contacted 2026-10-05; follow up Oct 10 if no reply
- Elevate Social: contacted 2026-10-05; follow up Oct 10 if no reply
- Jazz Is Dead: passed
- Punch Bowl Social: use the existing Rich the Kid relationship first
- warm rebooks are scheduled for Art & Soul, Punch Bowl Social Galentine's, and Level Up Walkathon

## Important rules

- Direct buyers are targets: venues, promoters, festivals, brands, campuses, nonprofits/community organizers, and one-off event organizers.
- Exclude DJ staffing companies, DJ agencies, wedding-DJ companies, roster-building companies, house-DJ employment, and entertainment collectives recruiting staff/roster DJs.
- The press kit already exists at `https://thebaeagenda.com/press-kit`; do not create another EPK.
- Do not invent contacts, pay, event hours, travel, application routes, or assets.
- Do not send outreach or submit applications automatically.
- Preserve Booking → Invoice → Payment → Event.
- Production Supabase migration history is drifted. Never blanket-push migrations; use narrow reviewed production changes only.
- Automatic Vercel Git deployments are disabled. Merging a PR does not publish the site.
- Do not use Vercel Redeploy to publish newer merged commits.
- Prefer no new paid infrastructure.

## Held work

- Discovery Runs UI branch is parked.
- Manager bot-access/suggestions design is intentionally not started.
- PR #142 Public Vibe prototype is separate from Manager.
- PR #59 Portfolio Archive media galleries is separate from Manager.

## For every change

- inspect current implementation first
- avoid duplicating live features
- use a branch + PR
- run relevant tests/lint/build
- create a deliberate preview when runtime/visual QA is needed
- deploy production only when explicitly intended
- verify the exact production commit before saying live
- report VERIFIED / LIKELY / UNVERIFIED / BLOCKED where useful
- stop before any action requiring Imani's creative/business judgment and state exactly what decision is needed
