# Fastbrowse comparison

Verdict: **TEST FURTHER**

Fastbrowse did not run the frozen tasks. There is no measured improvement, so this is not an adoption. The tool also was not shown to fail the research, so this is not a rejection.

## 1. Branch

`cursor/fastbrowse-manager-benchmark-3d1d`

## 2. Pull request

Opened from `cursor/fastbrowse-manager-benchmark-3d1d` into `main`. The GitHub URL is in the pull request body.

## 3. Commit

Benchmark commit: `e7f0d5fba1a34b082698d700346bb0475e5fc365`

## 4. Files

Only `experiments/fastbrowse-manager-benchmark/`. No application code, migration, scheduler, or production write.

## 5. Checks

- `npx vitest run experiments/fastbrowse-manager-benchmark/scripts/apply-manager-rules.test.ts experiments/fastbrowse-manager-benchmark/scripts/score-run.test.ts`
- Result: 2 files, 7 tests, all passed (Vitest 4.1.11).
- Fastbrowse probe: exit code 1, status `error`, zero steps, zero evidence, no cost lines.

## 6. Baseline

Method that actually ran: 36 HTTP fetches and 11 web searches against the frozen tasks, then `scoreManagerOpportunity`, `managerSignalCanBecomeOpportunity`, `hasRecurringRelationshipEvidence`, `splitManagerAsks`, and `summarizeManagerSourceSignals`.

| Metric | Result |
| --- | --- |
| Useful leads | 6, all relationship or watch records. None is an open DJ booking call. |
| Valid original sources | 15 |
| Duplicate groups | 1 (the two IndyFringe records share one URL; that page returned 403) |
| Stale or expired | 5 |
| False positives in this run | 0 |
| Unsupported or invented details | 0 |
| Buyer or contact with a quote | 16 evidenced, 0 claimed without a quote, 2 unknown |
| Requirements with at least one ask | 5 of 18 records |
| Recurring labels | 5 labeled recurring; the existing matcher disagreed with 3 |
| Opportunity guardrail | 0 records would become an opportunity |
| Tool calls | 36 fetches, 11 searches |
| Cost | null |

Task notes:

- Indianapolis opportunities on 2026-10-11: the Indy Arts Council opportunities page had no DJ mention. Wayback Wednesdays, Scream Queens, and Punch Bowl After Dark are programmed nights, not open calls.
- Warm rebooks: the Art & Soul 2027 interest form is closed (deadline 2026-09-06; the program page says the form is closed). Activation grants stay open until 2027-01-03 for organizations. Level Up Walkathon, Chi Chi's, and Club Plex did not yield a fetched public page that states the next date. Instagram returned a login shell.
- Who books Punch Bowl DJs: the venue's plan-a-party page says a DJ is allowed for a full buyout and names the Event Sales Manager plus `events@punchbowlsocial.com`. After Dark is organized by Punch Bowl Social. A 2026-02-13 listing names DJ Bae as the performer. No page fetched here names Rich the Kid or a 2027 Galentine's date.
- Direct buyers: DJ Connection's "DJ/MC and Dancefloor Architect" listing was classified as staffing and not kept as a lead. Deckademics' book-a-DJ page sells DJs to clients. MOKB's form is a rolling directory, not a dated gig.
- Still active: Start with Art 2026 and the CHREECE 2026 call are closed. Their pages still use open-call titles.
- Sparse Elevate Social lead: Instagram had no facts. A fetched Chicago listing for 2026-06-20 says the event ended. Pay, requirements, and an Indianapolis date stayed null.
- Duplicates: IndyFringe records are the same URL. Art & Soul Sunday (Social Haus) is a different event from the Indy Arts Council program. Two Monsterz nights on one calendar were kept apart.
- Claims: 2 evidenced, 3 contradicted, 1 unknown. The unknown claim is that DJ B.A.E. is booked for Scream, Queens. The page advertises a DJ set and does not name the DJ.

Production context, read-only: 3 discovery runs, all `partial`, from 2026-10-08 through 2026-10-10. 53 sources, 46 active. The writer of those runs is not in this repository. `vercel.json` schedules only payment reminders.

## 7. Fastbrowse

Verified package: `agent-labs-dev/fastbrowse` 0.5.20. It needs Python 3.13 or newer and one of `OPENROUTER_API_KEY`, `AI_GATEWAY_API_KEY`, or `TYPESAFE_API_KEY`. Local Chrome is supported with `--local`. This machine has Chrome and did not have those keys.

`uv` 0.13.0 fetched Python 3.13.16 and ran `fastbrowse --help`. One probe, without `--authorize`, exited 1 before a page opened:

`set AI_GATEWAY_API_KEY for Jev via the gateway, OPENROUTER_API_KEY or TYPESAFE_API_KEY`

Cost lines were empty. The eight tasks were not run.

## 8. Regressions and false positives

This experiment changes no Manager runtime, so it introduces no regression.

This run's false-positive count is 0. A pre-existing production signal is different: `DJ/MC and Dancefloor Architect` from `https://www.djconnection.com/jobs` has status `converted`, and that source is an inactive agency. Current code blocks `source_kind === 'agency'`.

The recurrence matcher disagreed where the page said "each year", "annual fundraising event", or "every Saturday" and those words were not in the fields the function reads.

## 9. Verdict

**TEST FURTHER**

Adoption would need the same eight tasks to finish under Fastbrowse with a better measured result. That run did not happen. Rejection would need a completed run that only adds complexity or makes the research worse. That run did not happen either.

## 10. Still needs the owner's Mac

Rerun `tasks.json` with Fastbrowse only if a model key is already available. Use `--local`, a dollar cap, and no `--authorize`. Do not send forms, outreach, or applications. Do not put the key in the repo. Browser Use Cloud is a separate paid browser and was not used here. Instagram and other login-walled sources still need a browser profile the owner signs into. This cloud environment cannot finish that rerun until one of the three model keys is present.
