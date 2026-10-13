# DJ B.A.E. Manager — Ordered Agenda

Last reconciled: 2026-10-13 (read-only Manager database review).

## Standing rules

- Prefer direct buyers: venues, promoters, festivals, brands, campuses, nonprofits, community-event organizers, and one-off event organizers.
- Exclude DJ staffing companies, DJ agencies, wedding-DJ companies, roster-building companies, house-DJ employment, and entertainment collectives recruiting staff/roster DJs.
- Do not invent pay, duration, travel time, contact information, application routes, or assets.
- A lead can't be outreach-ready until it records who is running it (or `Anonymous poster`), where a dated event is held, and what they asked for.
- Existing press kit: https://thebaeagenda.com/press-kit
- Outreach remains controlled and reviewed.
- Manager must not autonomously send outreach, submit applications, accept gigs, or book work.
- Use the existing Manager scoring and economics rules.

## 1. Daily action surface — DONE

Manager Today is live and prioritizes:

1. overdue follow-ups
2. follow-ups due today
3. negotiations
4. outreach-ready leads
5. active leads blocked by missing information/assets
6. new/review leads needing a decision

## 2. Work eligible live leads — ACTIVE

Current state as of 2026-10-13 (Manager records only; external replies unverified):

- Silent Disco (Oct 23, Westfield): contacted 2026-10-05 via Craigslist reply asking about gear, pickup/return, venue, and preferred music. October 10 follow-up is overdue; check for external replies before additional outreach. Re-check economics against any response.
- Elevate Social: contacted 2026-10-05 via partner form with a Chicago-leaning pitch. October 10 follow-up is overdue; check for external replies before additional outreach.
- Jazz Is Dead: passed 2026-10-05 because no Indianapolis date/open DJ slot was verified.
- Punch Bowl Social: the Galentine's 2026 booking came through Rich the Kid. Ask Rich before direct outreach about future Punch Bowl DJ nights.
- Other `contacted` leads with Oct 12–13 scheduled internal actions include Astrea Rooftop, hue., Untitled Supper Club, Vu Rooftop, Club Escape Chicago and Spybar Chicago. Verify each record and actual external communications before individual follow-up; do not bulk-send.
- Athenaeum Christkindlmarkt 2026 is a `review` performer-application lead. Actual DJ eligibility, current deadline and compensation remain **unverified**.

For each direct-buyer lead:

- verify the action route
- refresh/tighten outreach prep against the actual source
- user decides send/pass
- record the actual message sent
- log responses and negotiations
- pass weak leads promptly

## 3. Warm rebooks — ACTIVE

Prefer DJ B.A.E.'s own completed-event relationships over equivalent cold leads when recurrence or organizer interest is verified.

Current warm reviews:

- Room to Bloom monthly series — `review`, internal follow-up **overdue since Oct 8, 2026**; verify actual current organizer/series and prior relationship before any contact.
- Art & Soul 2027 — Oct 20, 2026 re-engagement
- Punch Bowl Social Galentine's 2027 — Nov 15, 2026 through the existing relationship route
- Level Up Walkathon 2027 — May 15, 2027 reconnect; high confidence because the organizer previously said they want DJ B.A.E. back next year

For warm rebooks, reference the prior relationship. Do not cold-pitch or invent a new date.

## 4. Discovery quality — ACTIVE

- favor official/primary sources
- expand venue/promoter/festival/campus/brand/community coverage
- mine individual DJs for venue/promoter relationships
- keep out-of-state leads only when travel can plausibly work
- deduplicate and suppress noisy/stale sources
- keep speculative relationship leads out of Outreach Ready
- track discovery-run output so source quality can be measured over time

### Discovery Runs

Backend + daily tracking logic are installed in production. As of October 13, the database records 67 sources and 6 runs. The latest run checked 10/10 due sources, generated 5 signals and 2 opportunities, and was marked partial (4 partial-coverage cases). Do not infer paid bookings or full sourcing reliability from these counts.

The Discovery Runs UI branch is parked and has no PR. Let the backend collect useful run history before deciding whether the UI is worth finishing.

### October 13 new-to-Manager source research and decisions

The last run `manager-discovery-20261013T140722.305418Z` also recorded **5 added recurring sources**, **5 relevant signals**, **2 new `review` opportunities**, **0 new/updated warm rebooks**, and **0 outreach**; 10 sources were due/attempted and 4 had incomplete coverage. First-party baseline: 70 portfolio entries, 5 booking rows and 14 event rows; 20 opportunities existed before the run, 22 afterward. Partial source coverage must remain documented, not silently upgraded.

- **WERC Crew / Smothered + Covered (Atlanta):** documented guest DJ payment history and recurring music programming support a future **collaboration review**; **no verified present opening, named current person who pays, fee or travel terms**. Check organizer/curator and real buyer. Its opportunity currently lacks `source_payload.lead_origin` and its relevant source signal is not linked to the opportunity; **validate primary provenance before proposing any narrow correction, without speculative production writes**.
- **Delta Frost Productions (Chicago):** current public page says **paid DJ application**, for specialized adults-only programming; **artist fit is a user decision**, pay amount and travel/economics remain unknown. It was already noted in the Oct 5 scouting report, so its Oct 13 addition was **new to the Manager database**, not unprecedented research.
- **AfroCode Nation / The Sequel (DC)** and **Sun & Sound Detroit:** confirmed recurring DJ programming signals, neither a current paid opening; investigate actual DJs running events, buyers and verified contact routes.
- **Atlanta Pride 2027:** official performer application watch for **March 2027**; currently closed, DJ eligibility, rate and travel remain unverified.

All lanes must enforce the user exclusion and aliases in `docs/MANAGER_EXPANDED_DISCOVERY.md` before examining or promoting a prospect. Independently DJ-produced events and real clients/payers count; already-filled lineups are network evidence only. First-party archive, warm history, prior introducers, user preference, source cadence and pay/travel verification outrank number of event flyers. No second scheduler or speculative outreach.

## 5. Lead enrichment — ACTIVE

Improve only decision-relevant facts:

- contact/application route
- event date/deadline
- guaranteed compensation
- supported work hours
- one-way travel time
- travel coverage/cost
- equipment expectations
- event format/audience
- organizer clarity

## 6. Negotiation assistant — DONE

For negotiating leads, Manager can:

- compare offer to fee and hourly targets
- include travel/equipment/time economics
- show Accept / Counter / Pass / Needs Info guidance
- prepare editable counter copy
- log negotiated terms

User still makes the decision and sends any communication.

## 7. Manager hygiene / UX — LIVE

Live:

- source-quality indicators
- weak-lead guardrails
- relationship intelligence
- warm-rebook views
- What They Asked For checks before outreach
- actual sent-message recording
- Active/History separation
- Needs Action / Outreach Ready / Follow-up / Negotiating / Warm Rebooks / History filters
- 25-row Manager pagination

Pending only if real usage shows a need:

- junk/stale-record archive controls

## 8. Grok/X scout lane — RESEARCH-ONLY

The standing research-only task and October 13 evidence handoff were merged in [PR #185](https://github.com/imanisworld/bae-agenda/pull/185) and are in `docs/GROK_MANAGER_SCOUT_PROMPT.md`. A merged prompt is **not evidence that Grok has run**. Grok/X is a secondary social discovery source, **not** a separate daily Manager, independent database writer, or outreach agent.

- Map independent DJs who organize and pay for their own parties, DJ co-production partners, actual event buyers, repeat series, and publicly evidenced contact routes. Never assume a promoter exists.
- Search strategically nationwide (especially Indianapolis, Chicago, Detroit, Atlanta, and DC). Out-of-state paid-gig qualification needs supported travel economics.
- De-duplicate against portfolio/bookings/events and existing Manager sources/opportunities when trusted first-party history is supplied. Historical participation alone does not establish preference or rebooking interest.
- Enforce **all user exclusions before returning candidates**, including the permanent October 13 organizer/event exclusion detailed in the scout prompt. Do not resurface through reposts or alternate accounts.
- Use publicly accessible individual social posts; X access may help discover signals but does not establish comprehensive social chronology or access to private messages.
- Report only net-new actionable evidence or meaningful updates. Record verified organizer/decision-maker distinctions, uncertainties and sources; Manager validates before changing data.

No messages, applications, outreach, Supabase writes, GitHub writes by Grok, booking changes, or parallel scheduled runs.

## 9. Selective automation later

Only after enough real usage data:

- structured application assistance
- richer contact discovery
- digest/reminder improvements
- other automation supported by an observed workflow gap

## 10. Separate content/video editor agent

Keep this separate from Manager business-development logic.

## Open to-do — intentionally not started

- **Bot access for Manager.** Give Claude, Grok, and ChatGPT separate private keys, switchable off. Bots may read Manager and submit suggested changes for approval. Bots must never send outreach, delete records, or touch bookings, invoices, or payments. This remains parked until there is a clear need.
- **Discovery Runs UI.** Backend and tracking are already live; UI remains parked until enough run data exists to justify finishing it.

## Outreach facts confirmed by Imani

- Co-created Chi Chi's with Brooke Billions and Slim: a nightlife series centering Black women, open to everyone. The venue moves; the first night was at Blind Tiger Indy (May 8, 2025). Still running.
- Former resident DJ at Club Plex, Indianapolis, including the live NYE 12.31.24 set.
- Club Plex sets (NYE 12.31.24, Plex Mix 19) are open format with house/club/bounce. Ask buyers what sound they want before picking a mix.
