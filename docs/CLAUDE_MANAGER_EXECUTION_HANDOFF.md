# Claude Manager Execution Handoff

Work in `imanisworld/bae-agenda`.

Read the repository root `AGENTS.md` first. Its shared rules override duplicated or older agent-specific guidance.

Then read:

1. `PROJECT_STATUS.md`
2. `docs/MANAGER_EXECUTION_AGENDA.md`
3. `docs/MANAGER_EXPANDED_DISCOVERY.md`
4. current Manager code under `app/(admin)/admin/(protected)/manager`
5. `lib/manager-*.ts`
6. current production state only through approved/read-only project tools

Treat `PROJECT_STATUS.md` and `docs/MANAGER_EXECUTION_AGENDA.md` as the current source of truth. Old planning docs are historical unless they were reconciled on or after 2026-10-13.

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

1. reconcile the current Silent Disco and Elevate Social threads before any further outreach
2. work real eligible leads and scheduled follow-ups
3. prioritize warm rebooks over equivalent cold leads
4. let Discovery Runs collect enough history to measure source quality
5. fix the known recurrence-language gap and reconcile the stale converted agency signal
6. test Ego Lite against PR #180's frozen Manager benchmark before adding a browser-research dependency
7. improve discovery quality/enrichment only where it changes a decision
8. finish the Discovery Runs UI only if collected data shows it is useful
9. add Manager automation only after an observed workflow gap
10. keep content/video tooling separate from Manager business-development logic

## Current outreach state

- Silent Disco: contacted 2026-10-05; Oct 10 follow-up outcome is unverified in this Oct 13 reconciliation. Check the current thread before any further message.
- Elevate Social: contacted 2026-10-05; Oct 10 follow-up outcome is unverified in this Oct 13 reconciliation. Check the current thread before any further message.
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
- Public Vibe work from PR #149 is live and remains separate from Manager logic; closed #142 is obsolete.
- Event-media lightbox fixes from PR #152 are live; superseded PR #151 is closed.
- PR #59 Portfolio Archive media galleries remains separate/held while real photo/video media is prepared.
- PR #179 HyperFrames experiment is held pending a real-media value test.
- PR #180 agent-labs Fastbrowse benchmark remains TEST FURTHER; its live arm did not run without a compatible model key.
- PR #181 Abide/Jev and PR #183 fast-jev-codex remain TEST FURTHER; their frozen evals exist but live external-tool comparisons are unmeasured.
- PR #182 deterministic CI guardrails is a separate $0 enforcement path and should be reviewed independently.
- Ego Lite is test-only and is the next browser-research candidate; do not integrate it into Manager production before the frozen benchmark shows a material gain.

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
