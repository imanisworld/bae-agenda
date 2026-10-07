# AGENTS.md

Shared operating rules for any AI/coding agent working in `imanisworld/bae-agenda`.

## Read first

Before substantial work, read:

1. `PROJECT_STATUS.md`
2. `README.md`
3. `docs/ROADMAP.MD`
4. `docs/operations.md`
5. the task-specific doc below, when relevant:
   - Manager/outreach: `docs/MANAGER_EXECUTION_AGENDA.md`
   - Manager discovery: `docs/MANAGER_EXPANDED_DISCOVERY.md`
   - production DB changes: `docs/PRODUCTION_DATABASE_CHANGE_POLICY.md`
   - routes: `docs/ROUTES.md`
   - preview/deploy workflow: `docs/staging-preview.md`

Treat those current files as source of truth. Historical plans in git history are not instructions.

## Verify current state first

This repo is touched by multiple agents.

Before changing code:

- inspect current `main`
- inspect current open PRs and relevant branches
- inspect the existing implementation before adding a feature
- do not assume a prior chat, branch, PR number, deployment, or migration is still current
- do not rebuild features that already exist
- label facts VERIFIED / LIKELY / UNVERIFIED / BLOCKED when useful

## Git workflow

- use a feature/docs/chore branch + PR
- do not push directly to `main`
- keep unrelated work out of the same PR
- preserve intentionally held/parked work unless the task explicitly revives it
- verify the final PR diff before merging

## Vercel / releases

Automatic Vercel Git deployments are disabled.

Therefore:

- merge does **not** mean deploy
- do not assume a PR creates a preview
- create deliberate previews only when runtime/visual QA is useful
- production deploys must be deliberate and from the intended reviewed commit
- do not use Vercel **Redeploy** to publish newer merged commits
- after production release, verify exact SHA, key routes, `/api/health`, protected-admin behavior, and relevant runtime logs
- docs-only changes normally do not require an application deployment

## Supabase / production DB

Production migration history is historically drifted from the repo.

- never run blanket `supabase db push`
- inspect live schema/migration state first
- apply only one narrow reviewed migration at a time
- use fail-closed preconditions where practical
- rerun security/performance advisors after DB changes
- verify RLS, grants, row counts/integrity, affected app flows, health, and logs
- do not reapply migrations already recorded in production
- do not expose secrets, admin emails, or service-role credentials

## Manager / outreach safety

Manager may:

- discover and research
- score/evaluate
- enrich leads
- draft outreach
- schedule follow-ups/warm rebooks
- record actual messages that the user sent
- prepare negotiation guidance

Manager must **not** autonomously:

- send outreach
- submit applications
- accept gigs
- book work
- delete business records
- alter bookings/invoices/payments without explicit user direction

Prefer direct buyers and real relationships. Exclude DJ staffing/roster/wedding-DJ employment leads unless explicitly requested.

Daily Discovery Runs/source tracking already exist. Do not add a duplicate generic discovery scheduler.

## Product / architecture

- prefer current stack and existing services
- prefer no new paid infrastructure
- preserve Booking → Invoice → Payment → Event
- favor targeted edits over rewrites
- do not add tools or automation without a concrete workflow gap
- keep experimental public-site work separate until intentionally reviewed

## Definition of done

Do not say something is live/done merely because code was written or a PR merged.

For code:
- run relevant tests/lint/build
- verify the intended diff
- verify preview/production when the task requires it

For docs:
- reconcile against current code and production state
- remove stale instructions rather than layering contradictory notes
