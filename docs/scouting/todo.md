# DJ B.A.E. Manager scouting — action list

Reconciled **2026-10-13** against `main`, recent open PRs, and read-only production Manager data. This list is a **review queue**, not permission to send/submit anything. Operational details live in `docs/MANAGER_EXECUTION_AGENDA.md`; evidence/suppression rules live in `docs/MANAGER_EXPANDED_DISCOVERY.md`.

## Completed / already installed

- [x] Daily recurring-source + broad discovery and `manager_discovery_runs` tracking exist. Do not duplicate the scheduler.
- [x] Existing Manager scoring/economics, source quality, relationship view, warm rebooks, controlled outreach, and prior history are available.
- [x] Existing press kit: https://thebaeagenda.com/press-kit. No new EPK.
- [x] Grok/X social scout read-only brief refreshed and merged in [PR #185](https://github.com/imanisworld/bae-agenda/pull/185); it is **instructions**, not proof Grok ran.
- [x] The 2026-10-13 discovery pass created **5 recurring sources**, **5 signals**, **2 review opportunities** (10 due/attempted; 4 incomplete checks); no outreach or new warm rebooks. Findings are **already in Supabase**.
- [x] User-excluded organizer/event aliases remain suppressed in the Manager database. Do not resurface them, even from another site/agent.
- [x] Historical sources are preserved for provenance; no automatic portfolio changes or user-fit assumptions from flyers.

## Work from Manager Today (review actual response before any action)

- [ ] **Overdue since Oct 8:** Room to Bloom monthly warm rebook remains `review`; check existing relationship/history before deciding timing or contacting.
- [ ] **Overdue since Oct 10:** Silent Disco and Elevate Social both still show `contacted` with Oct 10 `next_action_at`. Verify responses and existing messages first; the database does **not** prove no reply.
- [ ] **Due Oct 12–13:** review the actual next actions/statuses for Astrea Rooftop, hue., Untitled Supper Club, Vu Rooftop, Club Escape Chicago and Spybar Chicago. No bulk follow-up or autonomous outreach.
- [ ] **Existing review:** Athenaeum Christkindlmarkt 2026 performer application — confirm DJs are eligible, deadline/open status, event fit and fee before acting; do not mistake a general performer form for a verified DJ call.

## Two Oct 13 prospects requiring user/business review

- [ ] **WERC Crew / Smothered + Covered, Atlanta — collaboration `review`:** promising documented programming and history of paying guest DJs, but no current opening, verified specific payer/guest curator, fee or travel terms. Research who actually commissions guests and a verified contact route. Review metadata quality: the saved opportunity lacked `lead_origin` and its related signal was not linked when inspected; verify provenance before any narrow, approved correction. Avoid creating another lead.
- [ ] **Delta Frost Productions, Chicago — application `review`:** specialized adult/kink-themed event format requires explicit DJ B.A.E. fit judgment; the posted call says paid but rate/travel are unknown. This was mentioned in the October 5 scouting report, so this is newly *saved*, not first ever discovered. No application without approval.
- [ ] **Research-only, already saved:** AfroCode Nation / The Sequel (DC) and Sun & Sound Detroit. Find the actual named buyer/DJ organizer and evidence of recurring paid guest booking; neither is a verified open call.
- [ ] **Future watch, already saved:** Atlanta Pride 2027 — check official entertainment application in March 2027; currently closed, DJ eligibility/compensation/travel unverified.

## Scheduled warm rebooks

- [ ] **Oct 20, 2026:** Art & Soul 2027 — existing warm review; confirm actual contact path and scope before proposing a re-engagement.
- [ ] **Nov 15, 2026:** Punch Bowl Social Galentine's 2027 — approach first through the existing Rich the Kid introduction protocol, not a cold venue email.
- [ ] **May 15, 2027:** Level Up Walkathon 2027 — reconnect regarding actual date, scope, fee and logistics; recorded verbal interest is not a confirmed booking.

## Local / national seasonal watches (timing may change)

- [ ] Recheck official 2027 CHREECE DJ/artist window around Jan; no unverified date treated as an open application.
- [ ] Recheck Indy Pride entertainment application Jan–Apr 2027 and Indy Arts Council Start with Art around Apr–May 2027; confirm live 2027 terms.
- [ ] Preserve useful recurring relationship intelligence from Indy Arts Council, GANGGANG, Monsterz Inc., Forty5, campus/brand/private organizers, and independent DJ-led series. Revisit each only on its source cadence.
- [ ] Review optional GANGGANG directory and free Indy Arts Council artist listing terms **before** user submission; listings are not paid bookings.
- [ ] Pride Toronto 2027 public application watch around Nov 2026 — verify official window, authorization and travel economics before promoting.
- [ ] Out-of-state Chicago/Detroit/Atlanta/DC house, bounce, R&B and culturally aligned events: identify the buyer and compensation route; do not rank speculative travel as a profitable gig.

## Deferred / separate ownership

- [ ] [PR #184](https://github.com/imanisworld/bae-agenda/pull/184) **draft** owns portfolio-history reconciliation evidence. Do not treat archived scheduled sets as performed or publish speculative portfolio additions.
- [ ] [PR #186](https://github.com/imanisworld/bae-agenda/pull/186) **draft** owns the DJ playback-history cross-repo roadmap handoff. Event calendar metadata is not Serato/Rekordbox playback evidence.
- [ ] [PR #180](https://github.com/imanisworld/bae-agenda/pull/180) **draft** benchmarks Fastbrowse; not adopted, no measured improvement. Do not install a replacement or create paid infrastructure without verified benefit.
- [ ] Discovery Runs UI and bot database-access/suggestion infrastructure remain **parked**. Grok research can operate with a read-only prompt; neither warrants a new production integration now.

## Archived / weak leads

Do not promote SXSW, NXNE, The Great Escape, FuTopia or generic international/open-call aggregators without a specifically evidenced paid DJ opening and viable economics. Do not relist historical rejected/expired prospects as novel opportunities.

**Stop rule:** only user-approved outreach/applications; no booking, payment, contact or preference mutations from scouting. The objective is an accurate, small decision queue and actual paid relationships.
