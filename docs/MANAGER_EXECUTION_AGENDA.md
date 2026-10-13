# DJ B.A.E. Manager — Ordered Agenda

Last reconciled: 2026-10-13 (Manager discovery, queue, and Grok scope; app-deployment status is a separate verification).

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

## 2. Work eligible leads — REVIEW LIVE STATUS BEFORE ACTION

Read-only production snapshot on **2026-10-13**:

- Silent Disco and Elevate Social remain `contacted`; `next_action_at=2026-10-10` is **overdue**. The stored status **does not** establish no reply; check actual communications before drafting or following up.
- Other `contacted` leads with Oct 12–13 actions include Astrea Rooftop, hue., Untitled Supper Club, Vu Rooftop, Club Escape Chicago and Spybar Chicago. Review individually; no bulk outreach.
- Athenaeum Christkindlmarkt 2026 performer application is a `review` lead; explicit DJ eligibility, current deadline and compensation are **unverified**.
- Jazz Is Dead was previously passed for lack of a verified local slot. Do not re-add without new actual evidence.
- Punch Bowl Social Galentine's prior booking came through Rich the Kid: **ask Rich before any direct venue contact**.

For each eligible lead, inspect the current Manager record, source date and exact user-sent message, verify who is hiring and the response status, update only decision-relevant facts through approved workflows, and let the user decide any outreach, application or pass. Never infer an unanswered message from a stale follow-up date.

## 3. Warm rebooks — ACTIVE

Prefer DJ B.A.E.'s own completed-event relationships over equivalent cold leads when recurrence or organizer interest is verified.

Current warm reviews:

- Room to Bloom monthly series — internal follow-up **overdue Oct 8, 2026**, still in `review`; recheck prior client/organizer evidence and actual current series before any follow-up.
- Art & Soul 2027 — Oct 20, 2026 re-engagement
- Punch Bowl Social Galentine's 2027 — Nov 15, 2026 through the existing relationship route
- Level Up Walkathon 2027 — May 15, 2027 reconnect; high confidence because the organizer previously said they want DJ B.A.E. back next year

For warm rebooks, reference the prior relationship. Do not cold-pitch or invent a new date.

## 4. Discovery quality / October 13 evidence — ACTIVE

Live 2026-10-13 run `manager-discovery-20261013T140722.305418Z`: **10** recurring sources due and attempted, **4** partial coverage checks, **5** sources added, **5** relevant signals, **2** new opportunities in `review`, **0** warm rebook creations/updates, **0** outreach. Run status **partial**, not complete. The portfolio/history baseline used **70 portfolio rows, 5 bookings, 14 events and 20 pre-existing opportunities**; after this run there are **22 opportunities total** in production.

New-to-Manager sources: WERC Crew / Smothered + Covered (Atlanta), Delta Frost Productions (Chicago), AfroCode Nation / The Sequel (DC), Sun & Sound Detroit, and Atlanta Pride Festival. All five have saved signals; **only the Chicago application currently explicitly advertises a paid DJ call**. A prior October 5 scouting report had already mentioned the Chicago call, so it is **not** necessarily new research.

**User decisions and follow-up research:**
1. **WERC — collaboration review:** past organizer payment evidence and compatible programming, but **no open DJ slot**, exact current buyer/curator or proven travel economics. Find the actual booking/payer relationship before treating it as a route to paid work. Database hygiene check needed: observed WERC `manager_opportunities.source_payload.lead_origin` absent and the saved signal not linked to the opportunity. **Do not patch production speculatively**; validate primary record/provenance then propose a narrow correction only if warranted.
2. **Delta Frost — paid application review:** user must decide whether the specialized adults-only event programming is an acceptable artistic/brand fit. Fee, travel and terms remain unknown; no application before approval. Saved signal and opportunity existed separately when inspected; confirm correct linking only after verified evidence.
3. **AfroCode / Sun & Sound — relationship research:** recurring DJ programming is verified, but no current paid vacancy or specific booking payer was verified. Use independent DJ/venue networks to identify decision-makers, not generic venue flyers.
4. **Atlanta Pride 2027 — future seasonal watch:** official entertainment application is expected **March 2027**; **not open now**. DJ eligibility, pay and travel unverified.

**Discovery discipline:**
- Read first-party portfolio, booking/client, event and prior contact/introducer history before declaring a new relationship. A past gig or tag alone does not establish preference, current affiliation, fair pay or recurrence.
- Search independent DJs **who run or pay for their own parties**, actual direct buyers, DJ collaborations, and campus/brand/cultural producer series nationwide. A filled lineup is research intelligence, not an opening.
- Observe source cadence; keep partial/check failures visible instead of pretending exhaustive IG/X coverage. Four October 13 checks were incomplete; retry only when due and supported.
- The **permanent user exclusion** and all alias/event filters in `docs/MANAGER_EXPANDED_DISCOVERY.md` and `docs/GROK_MANAGER_SCOUT_PROMPT.md` apply to **every** Manager lane, including warm rebooks and secondary scouts. Production inactive/ignored suppression stays intact.
- Only exact supported open calls or credible partnership routes may advance to `review`. Unknown outside-market pay/travel remains research-only. Do not create duplicate generic discovery automation or another Manager database writer.

### Discovery Runs

Backend + daily tracking logic are installed in production. The UI branch is parked and has no PR. Do not resume merely to visualize today's run.

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

The updated task and October 13, 2026 evidence handoff were merged in [PR #185](https://github.com/imanisworld/bae-agenda/pull/185) and live on `main` in `docs/GROK_MANAGER_SCOUT_PROMPT.md`. **This verifies the instructions only; no Grok run was triggered by the merge.** Grok/X is a secondary social discovery source, **not** a separate daily Manager, independent database writer, or outreach agent.

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
- **Separate open PRs:** [#184 portfolio reconciliation](https://github.com/imanisworld/bae-agenda/pull/184), [#186 playback-history roadmap handoff](https://github.com/imanisworld/bae-agenda/pull/186), and [#180 Fastbrowse benchmark](https://github.com/imanisworld/bae-agenda/pull/180) remain draft/experimental. Do not merge their contents or treat an unproven benchmark as a Manager replacement.

## Outreach facts confirmed by Imani

- Co-created Chi Chi's with Brooke Billions and Slim: a nightlife series centering Black women, open to everyone. The venue moves; the first night was at Blind Tiger Indy (May 8, 2025). Still running.
- Former resident DJ at Club Plex, Indianapolis, including the live NYE 12.31.24 set.
- Club Plex sets (NYE 12.31.24, Plex Mix 19) are open format with house/club/bounce. Ask buyers what sound they want before picking a mix.
