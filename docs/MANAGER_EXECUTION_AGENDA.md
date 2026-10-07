# DJ B.A.E. Manager — Ordered Agenda

Last reconciled: 2026-10-05.

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

Manager Today is implemented and prioritizes:

1. overdue follow-ups
2. follow-ups due today
3. negotiations
4. outreach-ready leads
5. active leads blocked by missing information/assets
6. new/review leads needing a decision

## 2. Work eligible live leads — ACTIVE

Current priority:

Status as of 2026-10-05:

- Silent Disco (Oct 23, Westfield): Contacted 2026-10-05 via Craigslist reply asking about gear, pickup/return, venue, and preferred music. Follow-up Oct 10. Real time is ~7 hours with ~62 miles of driving (~$110–115/hr before gas), so re-check economics against the reply.
- Elevate Social: Contacted 2026-10-05 via partner form with a Chicago-leaning pitch. Follow-up Oct 10.
- Jazz Is Dead: Passed 2026-10-05 (no Indianapolis dates, no open slot).
- Punch Bowl Social: the Galentine's 2026 booking came through Rich the Kid. Ask Rich before contacting Punch Bowl directly about After Dark / Halloween / NYE DJ nights.

For each direct-buyer lead:

- verify the action route
- refresh/tighten outreach prep against the actual source
- user decides send/pass
- log responses and negotiations
- pass weak leads promptly

## 3. Warm rebooks — ACTIVE

Prefer DJ B.A.E.'s own completed-event relationships over equivalent cold leads when recurrence or organizer interest is verified.

Current examples:

- Art & Soul 2027
- Punch Bowl Social Galentine's 2027
- Level Up Walkathon 2027 — high confidence because the organizer previously said they want DJ B.A.E. back next year

For warm rebooks, reference the prior relationship. Do not cold-pitch or invent a new date.

## 4. Discovery quality — ACTIVE

- favor official/primary sources
- expand venue/promoter/festival/campus/brand/community coverage
- mine individual DJs for venue/promoter relationships
- keep out-of-state leads only when travel can plausibly work
- deduplicate and suppress noisy/stale sources
- keep speculative relationship leads out of Outreach Ready

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

## 7. Manager hygiene / UX

Done:

- source-quality indicators
- Active/History separation
- Needs Action / Outreach Ready / Follow-up / Negotiating / Warm Rebooks / History filters
- 25-row Manager pagination

Pending only if useful:

- junk/stale-record archive controls
- live mobile/visual QA after the next Vercel deployment

## 8. Grok/X scout lane — CONNECTED

Grok has authenticated X access and may be used as a secondary discovery source for:

- X posts from promoters, venues, DJs, and brands
- venue/promoter relationship discovery
- event chatter that ordinary indexing misses

Treat Grok/X findings as candidate signals. Verify actionable claims through the normal Manager process before advancing them.

## 9. Selective automation later

Only after enough real usage data:

- structured application assistance
- richer contact discovery
- digest/reminder improvements
- other automation supported by an observed workflow gap

## 10. Separate content/video editor agent

Keep this separate from Manager business-development logic.

## Open to-do (not started)

- **Bot access for Manager.** Give Claude, Grok, and ChatGPT their own private keys, stored in Vercel env and switchable off. Bots can read Manager and submit *suggested changes* that Imani approves or rejects in a Manager "Suggestions" list. Bots can never send outreach, delete records, or touch bookings, invoices, or payments. Needs one new table (narrow reviewed SQL, no blanket migration push). Open decisions: approve everything vs. allow small edits automatically (recommend approve everything); which bots get keys. Imani said don't build yet.
- **Mark Sent records the real message.** Built in PR #133 (stacked on #129). Rebase on main after #129 merges.

## Outreach facts confirmed by Imani (2026-10-05)

- Co-created Chi Chi's with Brooke Billions and Slim: a nightlife series centering Black women, open to everyone. The venue moves; the first night was at Blind Tiger Indy (May 8, 2025). Still running.
- Former resident DJ at Club Plex, Indianapolis (including the live NYE 12.31.24 set).
- Club Plex sets (NYE 12.31.24, Plex Mix 19) are open format with house/club/bounce. Ask buyers what sound they want before picking a mix.

