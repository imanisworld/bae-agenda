# Staging homepage preview

The stable pre-production target is `staging`. Production remains the Vercel production branch (`main`) and must not be used to reproduce homepage failures.

## One-time Git branch setup

No `staging` branch existed when this workflow was added. Create it from a known-good production commit after the current work is committed:

```bash
git fetch origin
git switch -c staging origin/main
git push -u origin staging
git switch main
```

## One-time Vercel setup

Preferred (Vercel Pro/Enterprise):

1. Create a custom environment named `staging` and map the Git branch `staging` to it.
2. Attach a stable domain such as `staging.thebaeagenda.com` to that environment.
3. Configure staging-only Supabase, Stripe test-mode, Resend, and Upstash values in that environment. Do not copy production write credentials.
4. Set `EMAIL_DELIVERY_MODE=redirect` and `EMAIL_REDIRECT_TO` to a controlled staging inbox. Staging and preview email otherwise fails closed without contacting the original recipient.
5. Set `NEXT_PUBLIC_APP_URL` to the stable staging domain. `NEXT_PUBLIC_DEPLOYMENT_ENV` is derived from `VERCEL_TARGET_ENV`, but setting it to `staging` explicitly is harmless.

Hobby fallback:

1. Keep a long-lived `staging` branch and assign a stable branch domain to it.
2. Add branch-specific Preview environment variables for the `staging` branch, including `NEXT_PUBLIC_DEPLOYMENT_ENV=staging` and the staging service credentials.

## Vercel deployment budget / rate-limit discipline

Treat Vercel builds as a limited deployment budget, especially on the Hobby plan. Preview deployments are QA checkpoints, not feedback for every small edit.

- Batch related code and content changes before pushing a preview checkpoint.
- Run GitHub CI first and get tests, lint, and build green before spending a Vercel build on QA.
- Avoid many small pushes or commits whose only purpose is to see an incremental preview.
- Prefer one Vercel preview for each meaningful, testable checkpoint.
- Check recent Vercel deployment volume before starting a large preview-heavy work session.
- If Vercel reports a build-rate limit, stop triggering new deployments. Continue work on the branch and use GitHub CI until deployment capacity returns.
- Keep production deployments deliberate: promote only a reviewed, tested checkpoint rather than using production to test unfinished work.

## Normal debugging workflow

```bash
git fetch origin
git switch staging
git merge --ff-only origin/staging
git merge --no-ff <homepage-debug-branch>
npm test
npm run build:staging
git push origin staging
```

Open the stable staging domain in Safari and Chrome. A failed homepage section now leaves the other sections rendered and sends a structured `client_render_error` entry to the deployment logs. Filter logs by:

- `message=client_render_error`
- `environment=staging`
- `section=hero` (or `mixes`, `events`, `photo-strip`, `portfolio`, `booking`, `reviews`, `connect`)
- `release=<git commit SHA>`

The endpoint records the browser user agent, bounded error/component stacks, path without query parameters, deployment label, and release SHA. It does not intentionally collect cookies, form values, URL query strings, or page content.

Every response includes `X-Deployment-Environment`, and all non-production builds emit `X-Robots-Tag: noindex, nofollow, noarchive`. Their `/robots.txt` also disallows crawling the entire deployment.

## Local staging-mode check

Use `npm run dev:staging` for an interactive staging-labeled run, or `npm run build:staging` to verify the exact production build mode. Local staging mode should use a non-production `.env.local`.

## Promotion rule

Reproduce and verify the fix on `staging`, then merge the tested commit into `main`. Never promote by running `vercel --prod` from an unreviewed homepage-debug branch.
