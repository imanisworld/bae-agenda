# Fastbrowse versus Manager discovery

Frozen on 2026-10-11. This is a controlled comparison. It does not replace Manager, add a scheduler, write to production, send outreach, or deploy.

## What the current workflow actually is

Verified on `main` and with read-only production queries:

- `public.manager_sources`, `public.manager_source_signals`, and `public.manager_discovery_runs` exist in production.
- Three discovery runs are stored, all `partial` (2026-10-08 through 2026-10-10).
- The repository has scoring, source-health, source-quality, requirements checks, warm-rebook queueing, and relationship recurrence detection.
- The repository does not contain the job that writes discovery-run rows. `vercel.json` schedules only payment reminders.
- Signal dedup is a database unique pair `(source_id, fingerprint)`. No fingerprint function is in the repository. Fingerprint values are variable-length text, not a title or URL hash.
- Staffing exclusion is a written rule. Code blocks `source_kind === 'agency'` and non-actionable or venue-programming signals from becoming opportunities. It does not classify wedding-DJ employment by page text.

The baseline run below is the part that can be executed here: public HTTP fetches of the frozen URLs, the frozen web queries, then the existing TypeScript rules. It is not a replay of the missing external runner.

## Frozen tasks

`tasks.json` is the task set for both systems. Do not edit it after the first baseline fetch.

## Fastbrowse gate

Fastbrowse 0.5.20 (`agent-labs-dev/fastbrowse`) needs Python 3.13 or newer, which `uv` can fetch, and one of `OPENROUTER_API_KEY` or `AI_GATEWAY_API_KEY`. Jev can use `TYPESAFE_API_KEY`. The cloud browser needs `BROWSER_USE_API_KEY`; local Chrome is the supported unpaid browser path via `--local`.

If those model keys are absent, stop. Do not create accounts, do not read production secrets, and do not run the eight tasks.

## Safety

No production writes. No `--authorize`. No forms, outreach, applications, or messages. No new paid infrastructure.
