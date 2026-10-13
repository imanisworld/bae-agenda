# Project Status

Last reconciled: 2026-10-13 (GitHub, Vercel, and read-only Manager database checks).

## Current State

- Public site, booking intake, protected admin, invoice/payment operations, email tracking, and DJ Manager workflows are implemented. Booking/Lab end-to-end device QA remains open under issue #157.
- The Client Portal routes and server code exist, but sign-in is not usable for current client records. Portal links and booking-copy promises are withheld. Do not call this feature released or assume hiding navigation protects direct routes.
- The current production release includes the public-site visual work from merged PRs #170, #173, #174, #176, #177, the wording correction in #178, and approved mobile usability refinements from #191. The Built page remains unrouted; redesign is future issue #175.
- Media Curator scan, human review, and resumable cache (PRs #154/#155) are merged as **local-only** tooling. A real-media pilot is still unverified. No automatic editing/upload/publishing is provided.

## Verified Deployment — October 13

- **Latest targeted release:** PR #191 was squash-merged and deliberately deployed from `main` commit `727e39c149d6264c93fb7e3b64b60b72a916f950`. Vercel production deployment `dpl_9DkapbZYi5U3WpSu3xXh4tNZFCs5` is `READY`; Vercel's alias lookup confirms `thebaeagenda.com` points to that deployment, with the exact commit SHA. The approved changes cover Book/Portfolio phone spacing, Lab layout/motion, page-transition/preloading timings, and the 44 × 44px More touch target. PR CI passed and the owner approved the phone preview.
- **Verification boundary for #191:** merge, SHA, Vercel build, deployment readiness, and live-domain alias are verified. External direct HTTP checks of `/api/health`, `/book`, and protected admin were inaccessible from this session; no fresh live route/health or end-to-end booking/portal pass is claimed. Vercel returned no application logs for the new deployment in the checked window. Issue #157 remains open.
- **Earlier targeted release:** PR #178 production application commit: `5ab6f49b10ec8692b4def20044e9d15eef90db29` (squash merge).
- Earlier PR #178 production deployment `dpl_6rNrj7TsjfVjSXMCwQsMnVXbTL33` was `READY` and reported that exact Git commit SHA; the live alias now points to PR #191's deployment.
- The deliberate same-SHA preview was also `READY`; GitHub CI for PR #178 succeeded.
- PR #178 changed only `components/public/VibeExperience.tsx` and `AGENTS.md`: the two rejected homepage negation-style passages were replaced, and the public-copy writing rule now applies to all agents.
- **Earlier #178 verification boundary:** source diff, CI, Vercel build/alias and release SHA were verified. That prior check could not fetch a fresh browser-rendered homepage or `/api/health`; it did not establish current visual QA, booking submission, Lab interactions, client-portal login, or post-release runtime-log health.
- The last recorded full public/admin smoke audit was October 7: main public routes and health returned HTTP 200, protected admin redirected unauthenticated visitors, and the audited runtime-log window showed no new warning/error/fatal logs. Do not mislabel that historical audit as a check of today's release.
- Automatic Vercel Git deployments remain disabled by `vercel.json` (`git.deploymentEnabled: false`). Merge does not deploy. Docs-only changes need no production release.

## Manager — Read-Only Snapshot October 13

- 22 opportunities, 67 total sources (**59 active**), 30 relevant signals, and 6 recorded Discovery Runs. Portfolio/event baseline: **70 portfolio entries, 5 booking rows, 14 event rows**.
- Most recent run (October 13, key `manager-discovery-20261013T140722.305418Z`): 10/10 due sources attempted, **4 partial coverage**, **5 new recurring sources**, **5 signals**, **2 `review` opportunities**, 0 warm-rebook creations/updates, and 0 outreach; final status **partial**. Complete sourcing quality is not established by check counts.
- Silent Disco (October 23 event) and Elevate Social still show `contacted` with last recorded contact October 5 and follow-ups dated October 10. As of this check those follow-ups are overdue in Manager; external replies have not been checked.
- Art & Soul 2027 re-engagement remains set for October 20; Punch Bowl Social Galentine's for November 15; Level Up Walkathon 2027 for May 15, 2027. Use the known warm relationship route.
- Daily Discovery Runs backend is active. The separate Discovery Runs UI remains parked; do not create a second scheduler or infer bookings from signals.
- Manager follow-up review also includes Room to Bloom (Oct 8) and other `contacted` Oct 12–13 actions, not proof of unanswered messages. The new **WERC future collaboration** and **Delta Frost specialized paid-DJ application** stay review-only with missing buyer/fit/pay/travel evidence; AfroCode (DC), Sun & Sound (Detroit) and Atlanta Pride are recurring watch intelligence. See `docs/scouting/todo.md` for the decision queue.
- The mandatory user-excluded organizer/event source remains inactive with `USER-EXCLUDED` notes and an ignored signal; no alias may re-enter through Grok or another source. Grok's updated research-only brief in PR #185 was merged, but this **did not trigger a Grok run**.

## Public Site Finish Line — Issue #157 (Open)

1. Verify Book CTAs/navigation, mobile and desktop interaction, and a controlled isolated **non-production** inquiry end to end.
2. Verify Lab controls, cover taps, swipe/drag, keyboard, reduced-motion, mobile readability, and player persistence on actual devices.
3. Make client-portal contact verification usable and test an authorized client's own booking/payment access and denial of other-client records; keep public links hidden until it passes.
4. Collect fresh public routes, `/api/health`, protected-admin, relevant logs, and final visual QA evidence before calling the **full site acceptance** complete.

PRs #178 and #191 were completed as targeted releases; neither closes these full-site gates. Closed, unmerged preview PRs #156/#158 are not outstanding PRs; validate behavior in current `main` rather than trying to merge superseded code.

## Events, Media, and Held Work

- Club Cunt and Saints and Sinners public TBA notices are **code-level presentations**, without confirmed event dates/locations; issue #171 is the future admin-managed TBA/signup/special-instructions model. The existing `events.event_date` database column is non-nullable. Do not treat a display placeholder as canonical event data.
- PR #59 for Full Portfolio Archive galleries remains held. Production `portfolio_media` contained 0 rows as of October 13; select and review real photos/videos before considering publication.
- Built redesign stays in issue #175, held outside current public-site finish work.
- PRs #179–#183 are optional/tooling experiments (HyperFrames, Fastbrowse, Abide/Jev, CI guardrails, context retention). None is adopted on verified improvement evidence; keep them separate from website release.
- Manager bot access is not started and stays approval-gated.

## Database / Safety

- Targeted production RLS/grant hardening from PR #101 is complete; migration `20261007171755_harden_legacy_authenticated_policies` was already applied and verified.
- Production migration history remains historically drifted. **Never run a blanket `supabase db push`**. Review any new migration narrowly and verify grants/RLS/row integrity.
- Deferred advisory/optional work: leaked-password protection; duplicate-permissive-policy/unused-index cleanup; Manager archival UX if needed; expenses/tax support; e-signatures; richer calendar/analytics; multi-user roles.

## Immediate To-Do (no open-ended audit)

1. In Manager, verify external replies before resolving overdue Silent Disco/Elevate Social and other dated contacted/warm-review follow-ups. Evaluate the new two review opportunities and source provenance without autonomous contact or database changes. Record only actions actually taken.
2. Complete the explicit tests in issue #157; fix only specific failures and close the issue when all gates are evidenced.
3. On October 20, evaluate Art & Soul warm-rebook re-engagement using existing relationship history.
4. When the Mac/media library is available, run one real-event Media Curator pilot; do not upload or publish without review.
5. Leave issues #171/#175 and held experimental PRs parked until real requirements justify them.

Use `AGENTS.md` and `docs/ROADMAP.MD` for policy and roadmap; do not infer deployment or live-feature completion from stale docs or merged code.
