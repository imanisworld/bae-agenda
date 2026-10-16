# Tool verification — 2026-10-11

Verified source: [chrismathew3/fast-jev-codex](https://github.com/chrismathew3/fast-jev-codex/tree/0b3a958116ebe45e8cf4f8b2f41e5bc3736c6dff), exact HEAD `0b3a958116ebe45e8cf4f8b2f41e5bc3736c6dff`. Package and plugin manifest both declare **0.1.0**, MIT license. Source was cloned into a disposable directory and inspected, not installed globally.

## Packaging and dependencies

Node >=22 is required. Runtime dependencies are absent. Development dependencies declared in package.json: `@types/node ^22.20.4`, `typescript ^7.0.2`, `vitest ^5.0.1`; `npm ci --ignore-scripts` used the upstream lockfile. Local Node was v26.0.0. Standard upstream installation uses `codex plugin marketplace add chrismathew3/fast-jev-codex` then `codex plugin add fast-jev-codex@fast-jev-codex`, with a prebuilt payload and hook trust. These global-install commands were **not run**. For the future evaluation use the pinned prebuilt payload and temporary project hooks described in the protocol.

`npm audit --json` reported one high development-tree finding in source-map-js, [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). No dependency changes or audit fixes were applied. This is additional maintenance information, not proof of a runtime plugin vulnerability.

## Actual hook mechanism and data handling

Inspected `hooks/hooks.json`, `src/hooks.ts`, `src/client.ts`, `src/transcript.ts`, `src/codex.ts`, and `src/jev/state.ts`:

- PreCompact (manual/auto, 25-second deadline) reads the supplied local transcript, calls Jev to score eligible tool history, and writes a separate pruned archive and report. It does not replace Codex's history.
- PostCompact marks the pending archive ready. SessionStart with source compact restores supplementary `additionalContext` once. Hook timeouts for these two phases are 5 seconds.
- Recovery is approximately 1,800 heuristic tokens within the hook output limit; recent user messages are preferred, then explicitly kept older tool outputs, then assistant messages. Whole excerpts that do not fit are omitted. The archive path enables later retrieval. More retained text is not inherently better memory.
- The scorer needs environment variable `TYPESAFE_API_KEY`; it defaults to `jev-latest` at `https://api.typesafe.ai/v1/systemone`. ChatGPT subscription credentials do not supply this key. A key was absent from this process; private credential stores were not searched. Live provider access and resolved Jev model version remain unverified.
- Conversation text and tool inputs are sent externally for scoring. Tool result bodies are represented by metadata/counts rather than sent verbatim; encrypted reasoning is not sent. Conversation text can itself contain copied repository content, so this is not a privacy boundary for repo information. Future runs must use only synthetic inputs.
- User/assistant text remains in the separate archive. The pruning engine can remove or truncate eligible paired tool calls/results; recent/pinned and unsupported/multimodal items are retained. Original rollout/history files are not edited. Native summarization is still responsible for the active history.
- Local archives use 0600 files under 0700 session directories and persist until deleted; uninstall may leave them behind. Remote provider retention was not independently verified and must not be represented as zero retention.

## Compatibility checks actually run

Installed runtime: `codex-cli 0.162.0-alpha.17.2`.

1. Upstream `npm run check`: first sandbox attempt had 62 passes and one local-server failure (`listen EPERM 127.0.0.1`). After allowing loopback binding, rerun completed **63/63 tests, 4/4 files passed**; TypeScript build passed.
2. Upstream `npm run test:native`: **4/4 scenarios passed** using the installed real Codex app-server with synthetic loopback model and scorer. Legacy and paginated manual compaction both restored context. Missing-key and invalid-score paths completed native compaction without restoration. Temporary tasks were archived by the upstream harness.
3. Observed hook times (PreCompact/PostCompact/SessionStart, ms): legacy 157/174/108; paginated 200/107/96; missing-key 100/94/92; invalid-scores 154/94/106. These are **mock compatibility timings**, not real retention latency or Jev API latency. Synthetic model token usage is not measured model usage and is excluded.

This verifies the manual hook lifecycle on the local CLI version. It does not verify real Jev scoring, installed desktop plugin behavior, automatic mid-turn compaction, or retention quality. No real Codex model benchmark turns or Jev scoring requests were made.

## Limitations / maintenance

The parser rejects legacy summary-only checkpoints, rolled-back history, malformed/truncated transcripts, and inputs over 64 MiB. It cannot recover already summarized content. Paginated/cloud sessions without usable transcript content skip preservation. Missing credentials, malformed scores, timeouts, insufficient pruning and unsupported histories leave native compaction running. Budgeted replay can omit an important early fact even when that fact is in the archive. Staged scorer-state fitting can abridge older context before Jev judges relevance.

Added maintenance includes a separate credential and provider, network availability at compaction, pinned plugin upgrades, exact hook trust, private archive cleanup, transcript-format compatibility checks and review of restoration noise. No permanent integration is justified by the compatibility tests.
