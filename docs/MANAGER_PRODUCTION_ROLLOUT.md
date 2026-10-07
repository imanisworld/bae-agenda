# Manager Production Rollout — Completed

Last reconciled: 2026-10-07.

This document is now a historical record of the Manager production rollout. Do not reuse its original preflight as if Manager were not installed.

## Current production state

Manager is already live in production.

Production migration history records the Manager foundation and follow-on work, including:

- `20261004214429_create_manager_foundation`
- `20261004221308_add_manager_demo_recommendation`
- `20261004221926_create_manager_sources_watchlist`
- `20261004223040_add_manager_fit_score_details`
- `20261005021451_add_manager_gig_economics`
- `20261005133058_create_manager_opportunity_activity`
- `20261005134153_add_manager_outreach_prep`
- `20261007165421_create_manager_discovery_runs`

Manager tables already contain real operating state. Do not run the original foundation migration again and do not use the old “tables must not exist” preflight.

## What is live

- Manager profile/opportunities
- sources/watchlist and source signals
- scoring and fit details
- gig economics
- opportunity activity/history
- outreach preparation and controlled dispatch support
- relationship intelligence
- warm rebooks
- actual sent-message recording
- source health / weak-lead guardrails
- Discovery Runs backend + daily tracking

## Database safety rule

Production migration history remains historically drifted from the repository.

Therefore:

- never run a blanket `supabase db push`
- inspect live schema first
- use one narrow reviewed migration for any future DB change
- verify RLS/grants and advisors after a change
- preserve existing Manager data

PR #101 separately hardened legacy invoice/review/client-portal access and is already applied.

## Application release rule

Automatic Vercel Git deployments are disabled.

For future Manager application changes:

1. merge reviewed changes into `main`
2. create one deliberate preview if runtime/visual QA is needed
3. verify the intended commit
4. create one deliberate production deployment
5. verify production SHA, routes, health, and runtime logs

Do not use Vercel Redeploy to publish newer merged commits.

## Parked work

- Discovery Runs UI: backend is live; UI branch is parked until enough data exists to justify it.
- Manager bot access/suggestions: intentionally not started.
