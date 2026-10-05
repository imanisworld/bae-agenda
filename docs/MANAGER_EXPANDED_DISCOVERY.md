# Manager Expanded Discovery

The Manager discovery layer uses two complementary lanes.

## 1. Curated recurring sources

`scripts/seed-manager-expanded-discovery.sql` adds recurring Indianapolis sources across:

- opportunity boards
- individual DJ network references for venue/promoter discovery
- festivals and event brands
- campus programming
- nightlife venues
- wedding / corporate event venues
- local DJ network references

The source list is deliberately biased toward official pages and recurring organizations rather than one-off aggregator pages.

## 2. Broad daily discovery

The scheduled Manager discovery task should also search beyond the saved watchlist for:

- direct DJ / MC booking calls from venues, promoters, festivals, brands, campuses, and event organizers
- guest-DJ and residency calls
- festival and artist submissions that explicitly include DJs
- campus / university event entertainment
- corporate, brand, nonprofit, and community-event entertainment
- LGBTQ+ event and nightlife programming
- venue calendars that reveal recurring promoters or guest DJs
- out-of-state venue/promoter relationships discovered through watched DJs

### Guardrails

- Prefer official organization, venue, festival, university, careers, and application pages.
- Treat directories/job aggregators as discovery clues, then verify against a primary source when possible.
- Do not contact or apply automatically.
- Do not create an opportunity merely because an organization books DJs generally.
- Exclude DJ staffing companies, DJ agencies, roster-building companies, wedding-DJ companies, and entertainment collectives recruiting a staff/house/touring DJ. These are not target leads.
- Do not auto-add excluded DJ companies as recurring sources, and do not mine them for employment/roster opportunities.
- Create an opportunity only for a current, actionable booking/application/hiring/partnership signal with a clear route to act.
- Store lower-confidence but relevant findings as signals for review.
- Auto-add at most five new recurring sources per discovery run.
- Do not auto-add a source unless it appears likely to produce repeatable DJ-relevant signals.
- Deduplicate by canonical URL and organization identity.
- Keep social chronology labeled partial when public indexing is incomplete.
