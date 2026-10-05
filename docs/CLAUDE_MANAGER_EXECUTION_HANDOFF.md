# Claude Manager Execution Handoff

Work in `imanisworld/bae-agenda`.

Start by reading:

1. `docs/MANAGER_EXECUTION_AGENDA.md`
2. `docs/MANAGER_EXPANDED_DISCOVERY.md`
3. the current Manager code under `app/(admin)/admin/(protected)/manager`
4. `lib/manager-*.ts`
5. current production state only through approved/read-only project tools

Treat `docs/MANAGER_EXECUTION_AGENDA.md` as the ordered backlog. Do not reorder it without a concrete dependency or safety reason.

Important current rules:

- Direct buyers are targets: venues, promoters, festivals, brands, campuses, nonprofits/community organizers, and one-off event organizers.
- DJ staffing companies, DJ agencies, wedding-DJ companies, roster-building companies, house-DJ employment, and entertainment collectives recruiting roster/staff DJs are excluded.
- The press kit already exists at `https://thebaeagenda.com/press-kit`; do not create another EPK.
- Manager already has scoring, gig economics, Sources/Watchlist, activity history, outreach prep, controlled dispatch, follow-up queue, Opportunity → Booking conversion, and recurring public-web discovery.
- Do not invent contacts, pay, event hours, travel, application routes, or assets.
- Do not send outreach or submit applications automatically.
- Preserve the existing Booking → Invoice → Payment → Event workflow.
- Production Supabase migration history is drifted from the repo. Never blanket-push migrations. Use narrow reviewed production changes only.
- Prefer no new paid infrastructure.

Current execution priority:

1. finish/QA the Manager Today/action surface
2. improve real eligible lead execution and enrichment
3. improve discovery quality before adding volume
4. build negotiation assistance
5. create new demo assets only when repeated direct-buyer demand proves the need
6. Manager hygiene/mobile/filtering
7. optional Grok/X scout lane
8. selective automation later
9. separate content/video editor later

For every change:

- inspect existing implementation first
- avoid duplicating features already present
- use a branch + PR
- run tests, lint, and production build
- verify production before saying live
- report VERIFIED / LIKELY / UNVERIFIED / BLOCKED where useful
- stop before any action requiring the user's creative/business judgment and state exactly what decision is needed
