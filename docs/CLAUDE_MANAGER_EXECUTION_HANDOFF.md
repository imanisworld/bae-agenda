# Claude Manager Execution Handoff

Work in `imanisworld/bae-agenda`.

Read the repository root `AGENTS.md` first. Its shared rules override duplicated or older agent-specific guidance.

Then read:

1. `PROJECT_STATUS.md`
2. `docs/MANAGER_EXECUTION_AGENDA.md`
3. `docs/MANAGER_EXPANDED_DISCOVERY.md` and `docs/GROK_MANAGER_SCOUT_PROMPT.md` for mandatory user exclusions, DJ network sourcing and previous-history guardrails
4. current Manager code under `app/(admin)/admin/(protected)/manager`
5. `lib/manager-*.ts`
6. current production state only through approved/read-only project tools

Treat `PROJECT_STATUS.md` and `docs/MANAGER_EXECUTION_AGENDA.md` as the current source of truth; check the documented as-of dates and live Manager state before acting. Historical planning docs and old chat summaries do not override current evidence.

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

- Silent Disco: last recorded contact October 5; October 10 follow-up overdue as of October 13. Check for external replies first.
- Elevate Social: last recorded contact October 5; October 10 follow-up overdue as of October 13. Check for external replies first.
- Jazz Is Dead: passed
- Punch Bowl Social: use the existing Rich the Kid relationship first
- warm rebooks: Art & Soul on October 20, Punch Bowl Social Galentine's on November 15, and Level Up Walkathon on May 15, 2027
- October 13 Manager snapshot: 22 opportunities, 67 sources, 6 Discovery Runs; latest run marked partial. These are not paid-booking results.

## October 13 verified discovery and cross-agent handoff

- Run `manager-discovery-20261013T140722.305418Z` was **partial** (10 due/attempted, 4 partial coverage, 5 sources added, 5 relevant signals, 2 review opportunities, 0 new/updated warm rebooks, 0 outreach). Live snapshot: **67 total sources, 22 opportunities, 6 runs**, with **59 active sources**. These are discovery records, not paid bookings.
- Room to Bloom monthly warm rebook remains `review` with an **Oct 8** internal date. Several contacted leads have Oct 12–13 internal actions. Check recorded contact and external responses before user-approved follow-up.
- **WERC Atlanta** is an existing future collaboration `review`: guest DJ payment history verified, but current booking decision-maker/opening, fee and travel are not. Its opportunity's lead-origin and source-signal link need verified provenance before any database correction.
- **Delta Frost Chicago** is an existing `review` for a paid, specialized adults-only application. Artistic/brand fit requires the user's decision; rate/travel are unknown. Previously appeared in the Oct 5 scouting report, so it is not previously unseen research.
- AfroCode Nation (DC), Sun & Sound Detroit, Atlanta Pride's expected March 2027 application are **saved recurring research/watch sources**, not verified paid vacancies now.
- **Permanent exclusions apply across Manager, Grok, Claude, and any broader research lane.** Read exact forbidden organizer/event aliases in the two discovery/scout documents **before** using a line-up or other aggregator. The inactive/ignored production suppression is intentional. Never infer artist preferences, buyer relationships or bookings from a past public flyer, tagged co-DJ, or demographics.
- Grok's research-only brief is on `main` via PR #185; no Grok run occurred by merging the instructions. Manager owns review and any explicitly approved data changes. Existing bot-access and Discovery Runs UI projects stay parked; Fastbrowse PR #180 was closed unmerged October 29 as an unadopted experiment.
- Portfolio PR #184 and DJ playback-history PR #186 are **separate drafts**, not licenses to publish a scheduled gig as completed or infer a DJ setlist from a calendar event.

## Important rules

- Direct buyers include **independent DJs running/booking their own parties**, venues, brands, campuses, festivals, nonprofits/community buyers and genuine one-off organizers. Determine who actually commissions and pays. Do not assume a promoter.
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
- Public Vibe work from PR #149 and homepage wording correction from merged PR #178 are live and separate from Manager logic; closed #142 is obsolete.
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
