# DJ B.A.E. portfolio evidence reconciliation — 2026-10-13

**Scope:** One-time review of the 70 existing `public.portfolio_entries`, comparison with 14 `public.events` and 5 `public.bookings`, plus publicly indexed historic lineups. **This is a candidate-evidence ledger, not a second source of truth or approval to publish unverified performances.** Database remains authoritative; never overwrite a recorded venue/date with general festival calendar details. Evidence of an announced lineup proves a scheduled appearance, not completion, fee, or preference to return.

## Results and status

- Portfolio inventory: **70 rows**; **16** with venue, **1** with exact date; **54** venue missing, **69** exact date missing. No existing `portfolio_media` rows or portfolio `notes`.
- **One exact cross-table correction applied and verified:** Events row `3076943c-514d-4abe-9deb-952d7a20ed6a` (“Host/EMCEE for the 1st Annual Level Up Walkathon,” 2026-09-26) originally had null venue/city. First-party portfolio row `32e3ffb0-3e3c-40a9-9e45-ae0a0acdd2fb` is the same event/date, identifying **Pike High School, Indianapolis**. Those two missing Events fields were populated with no change to date, description, or portfolio. Post-update database read confirmed both values. Reverse operation, if needed: set only that Events row's venue and city back to NULL, guarded by currently matching values.
- **No portfolio rows created, merged, or edited.** General event dates and venues must not silently become DJ B.A.E.'s specific set dates/venues.
- **Public Instagram is incomplete:** Accessible indexed results do not establish full account chronology, stories, DMs, or private tagging history. A true IG archival reconciliation needs accessible exact posts/flyers or first-party exports, not invented dates.
- **No preference judgments:** Past booking does not imply suitable venue, fair fee, good treatment, or wish to return. No inferred blacklist.
- **Remaining unresolved:** 54 venue fields and 69 dates in the portfolio. Resolving these needs individual flyer/post/invoice-level evidence, not a guessed date based on event series.

## Verifiable public scheduled appearances missing or ambiguous in the 70-row archive

These are **review candidates**, never published automatically:

1. **2023-06-02 — Spot Patio Friday**: DJ B.A.E. listed at **The Spot Tavern, 409 S Fourth St, Lafayette**, alongside Circle T, Sweater Disco, Genderotic and Kyle Robert Paquin. [Local contemporaneous article](https://www.basedinlafayette.com/p/tims-picks-summer-sounds-mostly-outside). No 2023 portfolio rows.
2. **2023-12-09 — Public Universal Friend at HI-FI**: HI-FI's original concert archive lists IV King and DJ B.A.E. [Venue 10th Anniversary concert log](https://hifiindy.com/10th-anniversary/). No 2023 portfolio rows.
3. **2023-12-31 — The Spot Tavern New Year's Eve**: locally published lineup names DJ B.A.E. and Sweater Disco at The Spot, Lafayette. [Contemporaneous article](https://www.basedinlafayette.com/p/tims-picks-whats-up-heading-into). No 2023 portfolio rows.
4. **2024-06-22 — Madam Walker Legacy Fest Block Party**: public 2024 radio/talent schedule lists DJ B.A.E. 2:00–2:30pm at Madam Walker Legacy Center. [Historical public lineup](https://hot1009.com/events/madam-cj-walker-legacy-fest-block-party/). **May be the existing 2024 “Legacy Festival” row**; verify alias before updating or adding.
5. **2025-08-31 — BUTTER Fine Art Fair**: official schedule includes B.A.E. 12–1pm in the **10th Street DJs** lineup. [Official 2025 lineup](https://butterartfair.com/schedule-2025/). Existing portfolio has BUTTER entries for 2022 and two for 2024, but **none for 2025**.

These lineups support date/place of a *scheduled* set. They do not independently prove a completed performance or compensation. Before adding to a public portfolio, confirm performance from user media, post-event organizer recap, invoice, or a first-party record.

## Cross-table / data quality blockers

Private booking/event timing discrepancies were inspected, but their details are intentionally excluded from this public-repo file. Handle them privately in Manager or a restricted review.

- **2024 BUTTER records:** “Butter 2024 Art Festival” and “Butter Art Fair” share event/year context. Could be different performances and must remain separate until actual set dates are known. The fair ran **Aug 29–Sep 1, 2024 at The Stutz**: [official release](https://butterartfair.com/press-release-july-9-2024/), [visitor listing](https://downtownindy.org/do/butter-fine-art-fair).
- **2024 CHREECE records:** “Chreece Music Festival” and “Spark Indy Chreece” might represent different programming. Broad festival date **Aug 24, 2024** is context only. [Local guide](https://mirrorindy.org/chreece-hip-hop-festival-guide-indianapolis-2024/).
- **2022 Lari Pati:** A historical organizer lineup names DJ B.A.E. at 416 Wabash, but the retrieved post appears **circa 2019**, before the existing archive's 2022 year. Do not overwrite the 2022 row with older event details. [Historic organizer archive](https://www.tumgik.com/laripati).
- **Public site city mismatch candidate:** A recent homepage search crawl printed “Art Show @ Madam Walker Legacy Center — Chicago, IL,” but Supabase portfolio says Indianapolis. Check the current rendered page before proposing a website edit. No site edit made.

## Full 70-row first-party inventory

Columns are **existing** stored values, except Review Notes which are evidence or unresolved status. “Year + city only” is the actual completeness state.

| # | Year | Portfolio entry | Existing exact date | Existing venue | Field coverage | Review note |
|---:|---:|---|---|---|---|---|
| 1 | 2026 | LEVEL UP Walkathon | 2026-09-26 | Pike High School | Date + venue | Strong first-party match to Sep 26, 2026 Events row; blank Events venue/city corrected to Pike High School, Indianapolis and independently re-read. |
| 2 | 2025 | 6th Annual International Women's Gathering | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 3 | 2025 | Art Show @ Madam Walker Legacy Center | — | Madam Walker Legacy Center | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 4 | 2025 | Chi Chi's Resident DJ | — | Saints and Sinners | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 5 | 2025 | Club Cunt | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 6 | 2025 | Club Plex powered by Karlala Soundsystem | — | Club Plex | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 7 | 2025 | HoopVision | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 8 | 2025 | House of Queer | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 9 | 2025 | Indy Artgarden Art Show | — | Artsgarden | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 10 | 2025 | Indy Gay Market | — | — | Year + city only | Indy Gay Market moves among venues; never infer a particular date/site from the brand. [source](https://indygaymarket.com/about-us/) |
| 11 | 2025 | Sundry & Vice | — | — | Year + city only | Event name suggests the venue, but available address listings conflict (Bottleworks/Carrollton); verify exact 2025 appearance first. |
| 12 | 2025 | WNBA All-Star Weekend | — | — | Year + city only | Event weekend Jul 18–19, 2025, multiple sites. Cannot assign exact DJ appearance/date or venue. [source](https://www.wnba.com/news/att-all-star-2025-faq) |
| 13 | 2024 | 1000 Words Indy Noir Art Show | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 14 | 2024 | All Star Weekend @ The Cultural Corridor | — | The Cultural Corridor | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 15 | 2024 | Boss Babe Brunch | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 16 | 2024 | Boss Ladies Gala | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 17 | 2024 | Butter 2024 Art Festival | — | — | Year + city only | BUTTER 2024 venue was The Stutz; Aug 29–Sep 1 event-wide. May overlap with separate 'Butter Art Fair' record; do not merge or choose performance day. [source](https://butterartfair.com/press-release-july-9-2024/) |
| 18 | 2024 | Butter Art Fair | — | — | Year + city only | Same BUTTER 2024 fair dates and location as 'Butter 2024 Art Festival'. Could be a distinct set; do not merge. [source](https://downtownindy.org/do/butter-fine-art-fair) |
| 19 | 2024 | Chreece Music Festival | — | — | Year + city only | Festival-wide Aug 24, 2024 across multiple Fountain Square venues. Artist-specific stage/time unverified. [source](https://mirrorindy.org/chreece-hip-hop-festival-guide-indianapolis-2024/) |
| 20 | 2024 | Club Plex | — | Club Plex | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 21 | 2024 | Columbus Area Arts | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 22 | 2024 | Damien Center & IYG Garage Dance Party | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 23 | 2024 | Evansville Culture Festival | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 24 | 2024 | Family & Friends R&B Night | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 25 | 2024 | GangGang Game Night | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 26 | 2024 | Harrison Center First Fridays | — | Harrison Center | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 27 | 2024 | Indy Big Gay Market | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 28 | 2024 | Indy Pride Festival | — | — | Year + city only | Event-wide Jun 8, 2024 at Military Park; exact DJ B.A.E. participation/slot unverified independently. [source](https://mokbpresents.com/event/indy-pride-festival-2024/) |
| 29 | 2024 | Indy Sleaze | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 30 | 2024 | IUPUI The Howl Festival | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 31 | 2024 | IYG Youth Prom | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 32 | 2024 | J.U.I.C.Y | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 33 | 2024 | Juneteenth Columbus Festival | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 34 | 2024 | Lafayette Pride | — | — | Year + city only | Pride Lafayette OUTfest held Aug 17, 2024; determine whether this portfolio entry refers to that specific event. [source](https://lafayette.in.gov/Calendar.aspx?EID=3731&calType=0&day=3&month=8&year=2024) |
| 35 | 2024 | Legacy Festival | — | — | Year + city only | Candidate match: Madam Walker Legacy Fest, June 22, 2024. Official DJ B.A.E. lineup; event identity still needs confirmation. [source](https://hot1009.com/events/madam-cj-walker-legacy-fest-block-party/) |
| 36 | 2024 | Melt Butter Official Afterparty | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 37 | 2024 | MilkTooth Butter Mixer | — | MilkTooth | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 38 | 2024 | Nourishing Well: Black Women and the Poetics of Sacred Space | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 39 | 2024 | One Drop Art Show | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 40 | 2024 | Pacers Bikeshare E-Bike | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 41 | 2024 | Plex Airplay | — | Club Plex | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 42 | 2024 | Purdue Polytechnic Homecoming | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 43 | 2024 | Purdue Polytechnic Prom | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 44 | 2024 | Queer Dance Party w/Indy Pride | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 45 | 2024 | Red Lion Lounge | — | Red Lion Lounge | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 46 | 2024 | Rock N Roll Festival | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 47 | 2024 | Spark Indy Chreece | — | — | Year + city only | Possible CHREECE-related activation. Keep distinct from Chreece Festival pending flyer/timestamp/stage proof. [festival context](https://mirrorindy.org/chreece-hip-hop-festival-guide-indianapolis-2024/) |
| 48 | 2024 | Spin Warz | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 49 | 2024 | SweatBox | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 50 | 2024 | That Peace Open Mic | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 51 | 2024 | Trap X Tacos | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 52 | 2024 | Ya'll For All | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 53 | 2022 | BossBabeNetwork | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 54 | 2022 | Butter Art Fair | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 55 | 2022 | Lari Pati | — | — | Year + city only | Old organizer archive names DJ B.A.E. and 416 Wabash, but appears years before 2022; does not establish 2022 venue/date. [source](https://www.tumgik.com/laripati) |
| 56 | 2022 | Mission Control | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 57 | 2022 | PPHS Homecoming | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 58 | 2022 | Trap and Soul Yoga | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 59 | 2019 | 100 Black Men Silent Party | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 60 | 2019 | Chreece Music Festival | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 61 | 2019 | Cubby Bear | — | Cubby Bear | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 62 | 2019 | Sub T | — | SubTerranean | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 63 | 2019 | Urban League | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 64 | 2018 | ATL Center Stage | — | Center Stage | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 65 | 2018 | Bless The Mic Open Mic | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 66 | 2018 | Epic Silent Party | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 67 | 2018 | House of Blues | — | House of Blues | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 68 | 2018 | ICON Lounge | — | ICON Lounge | Venue only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 69 | 2018 | Indiana State University Homecoming | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |
| 70 | 2018 | Sycamore Sessions | — | — | Year + city only | No reliable date/venue evidence for this particular DJ B.A.E. appearance in this pass. |

## Bounded next actions

1. Confirm five public scheduled-appearance candidates above against proof of performance; for Legacy Festival, resolve identity first.
2. Reconcile the two booking/event date conflicts from event confirmation evidence.
3. For each remaining undated row, search the exact public flyer/tag/photo or ask for original evidence; mark “unresolved” if unavailable.
4. Apply only verified narrow database changes with original-value backup and post-write verification, preserving distinct performances; any public-portfolio publication needs confirmed performance.
5. Keep the Manager's recurring discovery focused on new future buyers. This one-time evidence ledger is an archive, **not** a new scheduler or competing lead pipeline.
