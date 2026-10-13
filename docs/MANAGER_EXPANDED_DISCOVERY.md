# Manager discovery: operating rules

Last reconciled: 2026-10-13. This documents the **existing** daily discovery workflow; it does not authorize a second scheduler, new database writes by Grok, autonomous outreach, or a production deployment.

Source of truth: live `public.manager_sources`, `manager_source_signals`, `manager_opportunities`, `manager_discovery_runs`, first-party event history, and `docs/MANAGER_EXECUTION_AGENDA.md`. Social research instructions are in `docs/GROK_MANAGER_SCOUT_PROMPT.md`.

## Business target

Find direct **buyers who actually commission and pay DJs**, repeat clients, and credible DJ-led collaborators for future well-compensated bookings. Announced/finalized lineups are useful **network intelligence**, not unfilled paid slots. Do not optimize for flyer or signal volume.

Search nationwide, prioritizing Indianapolis, Chicago, Detroit, Atlanta and DC where supported. Out-of-state paying-work qualification requires verified travel/pay economics. Unknown fee, set hours, travel or lodging = **research only**, no inferred net/hourly rate.

## Four daily lanes

1. **Due recurring sources:** Count active `manager_sources` due from `last_checked_at` and `check_frequency_hours` before checking. Respect cadence, incomplete social feeds, `last_seen_marker` and pauses. Only mark a source fully checked if its actual check completed; advance seen markers only on sourced facts.
2. **Buyer / independent DJ network:** Determine who organizes, curates, hires and **pays**. These roles may differ. Research independently hosted DJ series, repeat guest lineups, co-DJs, producer/venue connections, brands, campus and civic buyers, and contact routes. **Never assume a promoter exists.**
3. **Broad discovery:** Beyond the watchlist, search primary producer/venue/university/festival/nonprofit/brand pages and DJ-specific calls. Exclude staff/roster/touring/house DJ jobs, staffing/DJ agencies, wedding-DJ rosters, generic aggregators and exposure-only work. Do not add one-off listings as recurring sources.
4. **Warm rebooks:** Review `portfolio_entries`, completed `bookings` plus `clients`, past `events`, prior opportunities, source notes, and explicit rehire intent. Preserve real dates, fees, clients, introducers and user preference evidence. One past event **never proves recurrence, payment, current relationship or favorable conditions**. Store reviewed future rebooks only with a supported series/recurrence basis and internal follow-up timing; never invent an `event_date`.

## Permanent first-party exclusion

The user explicitly excluded **SoundOff Naptown / SoundOff / @soundoffnap**, related **Grapevine / @grapevine.317** productions and **Grapevine Naptown's Kickback** on 2026-10-13. Do **not** search, recommend, rank, cite as an opportunity, research from their event programs, reactivate, signal, or contact these organizers or their event aliases. This applies to **all four lanes** and Grok's broad search. Normalize event brand, handle, alternate names, URLs, cross-posted organizers and linked event pages **before** fit/selection. The intentionally inactive `manager_sources` record `49520525-7a03-4458-9b51-68b3407cac69`, its `USER-EXCLUDED` note and ignored signal must remain intact. Do not filter out otherwise independent venues or DJs merely for occupying the same location. Never include excluded sources in ranked/daily notifications, even as negative examples.

Other user-passed/blocked leads and introducer-first relationships remain authoritative. Do not write inferred preference or blacklist data from public lineups, social identity, demographics or the fact of a prior set.

## Evidence, storage and completion rules

- **First-party before new:** reconcile public discoveries against DJ B.A.E.'s archive and prior contact history to distinguish `previously_played`, `repeat_client`, `prior_introduction`, `old_event_unverified`, `poor_fit_user_confirmed`, and `unknown_user_preference`. Public X/Instagram/tagged flyers are incomplete; do not imply private DM/story access or a complete chronology.
- **One run row:** insert one unique UTC-start `run_key` with `status='running'`; record `sources_due` before source checks; complete the **same** row as `completed`, `partial` or `failed` with observed counts, source limitations, summary/provenance and `completed_at`. Do not backfill invented metrics or turn a partial check into completed coverage.
- **Record hygiene:** canonical org/URL dedup; stable signal fingerprint and primary URL; known publication time only; no guesses for pay, travel, contacts, dates or work hours. Add **at most five** verified repeatable sources per pass, with partial-reliability flags when coverage cannot be proved.
- **Promotion threshold:** only verified current DJ open calls, materially supported direct future buyer partnerships or concrete DJ co-productions with a real contact route can become `review` opportunities. A filled lineup, venue with music, or general directory listing is insufficient. Keep speculative relationships out of `Outreach Ready`. For new relationships, use the supported `source_payload` lead origin, decision-maker/booking-status distinction, and link signals to opportunities when verified. Leave calculated scoring/economics blank unless current `main` logic and inputs support them.
- **Warm keys:** avoid duplicate warm leads; preserve prior record identifiers and history. A planning reminder before the next plausible season is **not** proof of an event date.
- **Notification gate:** only send a discovery summary when a genuinely new **non-excluded** signal, recurring source, opportunity or warm rebook was saved. No contact, applications, booking/client/payment edits, or autonomous user-preference changes.

## 2026-10-13 observed run (historical snapshot)

`manager-discovery-20261013T140722.305418Z` finished `partial`: **10 due**, **10 checked/attempted**, **4 partial coverage**, **5 sources added**, **5 signals created**, **2 review opportunities created**, **0 warm rebooks added/updated**, **0 outreach**. The five saved recurring organizations were WERC Crew / Smothered + Covered, Delta Frost Productions, AfroCode Nation / The Sequel, Sun & Sound Detroit, and Atlanta Pride. Of these, only Delta Frost's public application explicitly represented itself as a **paid DJ call**, with rate/travel and artist-fit unverified. WERC is a **future relationship**, not an open booking. Atlanta Pride's **March 2027** application watch is not currently open. Delta Frost was also mentioned in a prior October 5 research report, so **new to Manager records** must not be conflated with **never previously researched**.

Do not rerun October 13 to fill partials or retroactively change its metrics. Four incomplete source checks are a coverage issue for the *next due pass*, subject to normal cadence and access limits.
