# Project Guidance

This is the shared project guidance for work in `imanisworld/bae-agenda`. Use it for Claude, Cursor, ChatGPT, or any other coding agent unless a task-specific handoff says otherwise.

## Source of truth

Read these in this order when they are relevant:

1. `README.md` — setup, stack, core flows, verification commands
2. `PROJECT_STATUS.md` — current operational/deployment state and held work
3. existing code in the area being changed
4. task-specific docs under `docs/`

Manager-specific work should also read:

- `docs/MANAGER_EXECUTION_AGENDA.md`
- `docs/MANAGER_EXPANDED_DISCOVERY.md`
- `docs/CLAUDE_MANAGER_EXECUTION_HANDOFF.md`

Grok/X scouting uses `docs/GROK_MANAGER_SCOUT_PROMPT.md` and remains research-only.

## Current stack

The application is already implemented in:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- Resend
- Vercel
- optional Twilio and Upstash integrations

Do not replace the stack or rebuild the application from scratch unless explicitly requested.

## Product shape

The Bae Agenda is one connected DJ business system:

- public brand / booking site
- events, portfolio, Lab/mixes, press kit, reviews, and client-facing flows
- booking → invoice → payment → event workflow
- protected admin tools
- DJ Manager for discovery, relationships, outreach preparation, follow-up, and warm rebooks

Preserve existing working flows instead of creating parallel replacements.

## Design direction

Keep the current visual system cohesive:

- intentional, editorial, modern
- dark/moody base with burgundy, warm neutrals, gold/chrome accents
- strong photography and restrained copy
- interaction should demonstrate taste or make a task easier
- mobile behavior is first-class

Prefer fewer strong interactions over many small widgets. Remove duplication before adding another layer.

## Engineering rules

- Inspect the existing implementation before editing.
- Prefer targeted edits over rewrites.
- Reuse existing components, data, and helpers when they already solve the problem.
- Simplify before adding dependencies, schema, routes, or UI states.
- Do not invent event facts, client history, pay, contacts, dates, testimonials, or music provenance.
- Keep public claims tied to stored/verified data.
- Treat related/recommended mixes as recommendations unless there is evidence they are recordings from a specific event.
- Preserve accessibility, responsive behavior, and reduced-motion support.
- Keep secrets and service-role credentials server-side.
- Use a feature branch + PR for meaningful changes.
- No direct pushes to `main`.
- Run `npm run test`, `npm run lint`, and `npm run build` before calling a code change ready.
- Do not publish production unless the user explicitly approves a production deployment.

## Deployment model

Automatic production deployment from Git merges is disabled.

Normal flow:

1. branch
2. PR
3. tests/lint/build
4. local or preview review when needed
5. merge only after approval
6. deliberate production deployment from the intended latest `main`

Do not use an old Vercel Redeploy action to publish newer commits.

## Active public-site experiment

PR #142 (`feat/public-vibe-experience`) is a local-review prototype and must remain unmerged/unpublished until the user reviews it.

Current simplified direction:

- homepage vibe selector
- two focused “From the Booth” project cards
- Portfolio event-type/city browsing
- inline factual event detail expansion
- metadata-based related listening
- Lab lanes clarified as full sets vs mashups/experiments
- booking links prefill the existing event-type field
- swipe/snap behavior where useful on mobile

Deliberately removed from this prototype as redundant:

- Room Reader
- separate Selected Work Stories layer
- separate Lab context rail
- second booking intent selector
- raw Portfolio tag filter wall
- nested event-detail drawer
- duplicate CTAs

The rule for further public-site work is: make it more distinctive without making it more complicated.
