# Claude Manager Execution Handoff

Work in `imanisworld/bae-agenda`.

Read the repository root `AGENTS.md` first. Its shared rules override duplicated or older agent-specific guidance.

Then read:

1. `PROJECT_STATUS.md`
2. `docs/MANAGER_EXECUTION_AGENDA.md`
3. `docs/MANAGER_EXPANDED_DISCOVERY.md` and `docs/GROK_MANAGER_SCOUT_PROMPT.md` for permanent user exclusions, first-party history and independent DJ network rules
4. current Manager code under `app/(admin)/admin/(protected)/manager`
5. `lib/manager-*.ts`
6. current production state only through approved/read-only project tools

Treat `PROJECT_STATUS.md` and `docs/MANAGER_EXECUTION_AGENDA.md` as the current source of truth. Old planning notes and dated contact statuses are historical. As of 2026-10-13, use live Manager records plus the reconciled agenda and scout to-do; deployment claims retain their own verification dates.

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

## Manager execution priority — 2026-10-13

1. **Check real messages before follow-ups.** Silent Disco and Elevate Social still show `contacted` with Oct 10 next actions; other `contacted` opportunities have Oct 12–13 next actions. Room to Bloom warm rebook remains `review` with an Oct 8 internal date. Stale dates do **not** prove no reply.
2. **Review actual new choices.** The Oct 13 pass created 5 recurring sources, 5 signals and 2 review opportunities: WERC Crew future Atlanta collaboration (verified organizer's prior DJ payments, current booking route/pay unknown) and Delta Frost Chicago paid application (specialized adult-themed programming; user fit/fee/travel unknown). No external contact/application without user approval.
3. **Map real independent DJ buyers and repeat organizers.** Find who books **and pays**. Cross-check all discoveries against DJ B.A.E.'s prior portfolio/bookings/events and existing relationships; respect the Rich the Kid introducer route for Punch Bowl Social. Past tags or billed shows do not prove user preference or current relationships.
4. **Preserve user exclusions before every candidate evaluation.** Read the exact mandatory 2026-10-13 organizer and event aliases in the scout/discovery docs; they are blocked from all Manager/Grok/warm-rebook/new-source lanes. The production suppression row remains inactive/ignored.
5. **Use existing infrastructure.** Discovery Runs backend and daily tracking exist; Grok's updated social scout instructions were merged in PR #185 and are **read-only**, not proof Grok ran. Keep the Discovery Runs UI, bot database-access design, and third-party browser benchmark parked pending actual value.

## Verified evidence / limits

- Oct 13 run `manager-discovery-20261013T140722.305418Z` has status **partial**, with 10 due/attempted, 4 partial, 5 new sources, 5 relevant signals, 2 review opportunities, 0 warm rebooks created or updated and 0 outreach.
- First-party baseline: 70 portfolio entries, 5 bookings and 14 events. Production currently has 22 opportunities following the new entries. Chronology of public Instagram/X posts is incomplete; private DMs/stories are unavailable.
- Four existing warm reviews include Room to Bloom, Art & Soul 2027 (Oct 20), Punch Bowl Social Galentine's (Nov 15, through Rich), and Level Up Walkathon 2027 (May 15).
- WERC opportunity metadata requires provenance check before considering a narrow correction; do not infer missing links or write data from scouting.
- [PR #184](https://github.com/imanisworld/bae-agenda/pull/184) portfolio evidence and [PR #186](https://github.com/imanisworld/bae-agenda/pull/186) DJ playback-history handoff are separate **draft** work. [PR #180](https://github.com/imanisworld/bae-agenda/pull/180) Fastbrowse benchmark is **not adopted**.

## Important rules

- Direct buyers are targets: independent DJ-organizers and their own parties, venues, festivals, brands, campuses, nonprofits/community organizers, and genuine one-off event producers. Never assume a separate promoter exists.
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
