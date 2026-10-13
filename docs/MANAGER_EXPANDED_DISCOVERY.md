# Manager Expanded Discovery

## Objective

Find repeatable, well-paid DJ B.A.E. bookings and aligned relationships with actual decision-makers. Indianapolis is one market, not the default boundary. Include regional and nationwide cultural/music networks; qualify out-of-state gigs against verified travel and economics before promoting them. Prioritize useful buyer and DJ networks over the number of event flyers found.

## Existing discovery infrastructure

Reuse the daily **DJ Manager Buyer & Network Watch** automation, existing Discovery Runs ledger, `manager_sources`, `manager_source_signals`, `manager_opportunities`, and Manager Relationships UI. Do **not** create another scheduler or table simply to track a new discovery lane. `scripts/seed-manager-expanded-discovery.sql` is historical Indianapolis source seeding, not the geographic boundary.

## Discovery lanes

1. **Due recurring watchlist.** Search only active sources whose saved cadence is due, using saved seen markers and prior checks. Verify concrete posts/lineups/calls from primary evidence. Label social chronology partial where exhaustive inspection cannot be proven.
2. **DJ-led / venue / organizer network mapping (priority).** Treat announced events, even with filled lineups, as clues. Trace the DJ, venue, venue programmer, series, co-host and organizer. Verify **who actually controls the booking**; many DJs independently produce, market and book their own events with no promoter. Identify aligned DJs who book guest artists, curate recurring parties or might collaborate on jointly produced events. Distinguish observation from speculation. Look for public contact routes and realistic future relationship actions.
3. **Broad buyer search.** Discover direct private/corporate/brand/campus/nonprofit/cultural bookings, curated parties, festival DJ calls, LGBTQ+ events, guest DJ opportunities and recurring producers. Explore Chicago, Detroit, Atlanta, DC and other relevant markets as well as Indianapolis. Apply actual travel constraints to paid opportunities; if economics are unknown retain research rather than inventing financial fit.
4. **Verified warm rebooks.** Compare completed booking/client history and past events with current evidence of recurrence or explicit rebook intent. Keep next_action_at internal. Do not infer a future event date from a historical anniversary.

## Relationship intelligence vs. openings

- **Confirmed open call:** Explicit active direct-buyer request or application that permits DJs. Save as a review opportunity when qualified.
- **Actionable future buyer / DJ-led collaboration:** Credible evidence of the booker/host, a public contact path and a concrete fit/rationale. May be a `review` opportunity (use `collaboration` for a grounded co-production prospect), but clearly tag `source_payload.lead_origin='relationship_prospect'`, `booking_status='future_relationship'`; keep event_date and unsupported economics NULL.
- **Filled lineup / discovery clue:** Preserve a relevant source signal or recurring source. Never treat the existing lineup as an open slot. Mere venue DJ programming by itself does not create an opportunity.

Store `source_payload` fields for `discovery_role` (`dj_led_organizer`, `dj_collaborator`, `venue_buyer`, `promoter`, `brand_buyer`, `paid_booking`, `warm_rebook`), relationship kind, provenance URLs, verified decision-maker versus unknown, and booking status. Use the DB's existing enumerations (`manager_source_signals.signal_type`: `post`, `event`, `booking_call`, `job`, `application`, `venue_programming`, `other`; `manager_sources.source_kind`: `dj`, `venue`, `promoter`, `event_brand`, `brand`, `agency`, `other`). No schema migration is required.

## Guardrails

- Prefer verified, culturally/music-aligned audiences and creative direction; do not infer someone's values or discriminatory preferences without evidence.
- Seek good compensation and repeat clients; deprioritize generic club nights and exposure-only events that lack economic fit.
- Exclude DJ staffing agencies, wedding-DJ/roster recruiters, house/touring/staff DJ employment and collectives recruiting staff, not legitimate independent DJ organizers.
- Prefer official pages; confirm aggregator claims against primary sources when possible. No invented event date, pay, contact, travel or hours.
- Deduplicate signals, sources and opportunities by canonical identity; add at most five repeatable sources per run and keep check_reliability partial unless fully supported.
- Keep speculative relationships out of Outreach Ready; proposals and outreach drafts always require user approval. Never automatically contact, apply, accept gigs or book.
- Track buyer/relationship intelligence separately from confirmed paid openings and ensure the daily Discovery Runs ledger records actual observed counts and coverage limitations.
