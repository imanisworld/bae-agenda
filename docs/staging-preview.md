# Preview / Staging Workflow

Last reconciled: 2026-10-07.

## Current rule

Automatic Vercel Git deployments are disabled. Pushing or merging a branch should not be assumed to create a preview or production deployment.

The old long-lived `staging` workflow is currently parked. The `staging` branch has no unique work and is far behind `main`; do not use it as a source of truth until it is intentionally revived and rebased.

## Normal preview workflow

For a change that needs runtime or visual QA:

1. merge or identify the exact candidate commit
2. create one deliberate Vercel preview deployment from that commit/branch
3. confirm the preview deployment metadata points to the intended SHA
4. test the affected public/admin routes
5. inspect preview runtime logs
6. only then create a deliberate production deployment if approved

Do not assume every PR needs a preview. Docs-only changes normally do not.

## Preview environment caveat

Preview deployments may not have production-only environment variables.

For example, a preview can build successfully while `/api/health` reports degraded if `SUPABASE_SERVICE_ROLE_KEY` or another production-only credential is intentionally absent.

When a preview health check fails:

- inspect the exact runtime error
- distinguish missing preview configuration from an application regression
- compare against current production health before blocking a release

Do not copy production write credentials into preview merely to make a health check green.

## Browser reproduction

When visual/browser reproduction is needed:

- use the deliberate preview URL
- test Safari/Chrome as needed
- use staging-safe or redirect-mode email settings
- never test client-facing sends or production writes casually from preview

Non-production builds should remain noindex/nofollow.

## If long-lived staging is revived later

Only revive `staging` deliberately:

1. reset/rebase it from current `main`
2. configure staging-only Supabase/service credentials
3. use Stripe test mode
4. set `EMAIL_DELIVERY_MODE=redirect`
5. set `EMAIL_REDIRECT_TO` to a controlled inbox
6. assign a stable staging domain if useful
7. document the reason long-lived staging is needed

Do not revive it just because an old document references it.

## Production promotion rule

Production is a separate deliberate deployment from the reviewed `main` commit.

Do not:

- use Vercel Redeploy to publish newer merges
- deploy an unreviewed feature branch directly to production
- assume merge = publish

After production deployment, verify:

- exact Git SHA
- `/api/health`
- key public routes
- protected admin behavior
- relevant runtime logs
