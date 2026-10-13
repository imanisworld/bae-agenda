# Media Curator × HyperFrames (isolated experiment)

This folder tests whether [HyperFrames](https://github.com/heygen-com/hyperframes) can turn an **already-approved Media Curator highlight** into an **editable local promo project** (HTML + Studio/CLI), without changing the production site or the curator itself.

Nothing here uploads media, writes to Supabase, deploys, or posts automatically.

## Phase 1 — HyperFrames verification (2026-10-11)

| Question | Finding |
| --- | --- |
| Runs locally? | **Yes.** `npx hyperframes@0.8.147 doctor` passes on macOS with Node 22+ (tested on Node 26), FFmpeg, and Puppeteer-managed headless Chrome. Docker is optional. |
| Runtime / deps | Node.js **22+**, **FFmpeg/ffprobe**, headless Chrome (pulled on first use). Optional: whisper-cpp, Kokoro TTS, MusicGen — only for transcription/music generation skills. |
| API keys / paid services? | **Not required** for local preview/render. HyperFrames is Apache 2.0 with no per-render fee. Optional HeyGen cloud render / some `media-use` skills may call external models if you opt in — this experiment does not use them. |
| Video output | Deterministic **MP4** via headless Chrome frame seek + FFmpeg encode (`hyperframes render`). |
| Editable after generation? | **Yes.** Projects are plain `index.html`, `assets/`, and `hyperframes.json`. [HyperFrames Studio](https://hyperframes.heygen.com/studio) edits the same files as the CLI/agents — no import step. |
| Licensing (commercial DJ content) | HyperFrames toolchain is **Apache 2.0**. Your **footage and music** remain your responsibility; this bridge only copies an approved time range into a project folder and does not add stock music or cloud generation. |

## Phase 2 — One defined experiment

**Golden path:** After human review approves a highlight range on a video, scaffold a **9:16 social promo** HyperFrames project that:

1. Re-reads the scan `manifest.json` and durable `state/review.json` (same rules as review UI).
2. Verifies the source file still matches `content_id` (SHA-256).
3. Extracts **only** the approved `[start, end)` range into `assets/highlight.mp4` (original inbox untouched).
4. Writes a minimal editable composition (full-bleed clip + event title/venue overlay).
5. Records provenance in `curator-bridge.json` for audit.

Out of scope for this experiment: beat-sync, auto captions, catalog blocks, cloud render, website integration.

## Install

Requires the existing Media Curator venv (Python 3.11+) plus Node 22+ and FFmpeg for render.

```sh
python3 -m venv tools/media-curator/.venv
source tools/media-curator/.venv/bin/activate
python -m pip install -e 'tools/media-curator[dev]'
python -m pip install -e 'tools/media-curator-hyperframes[dev]'
```

## Use (after scan + review)

List videos that have at least one approved highlight:

```sh
media-curator-hyperframes candidates .media-curator/runs/run-EXAMPLE/manifest.json
```

Scaffold a fresh project directory (must not exist yet):

```sh
media-curator-hyperframes scaffold .media-curator/runs/run-EXAMPLE/manifest.json \
  --output ~/HyperFramesPromos/example-night-001 \
  --aspect 9:16
```

Optional flags: `--content-id <sha256>`, `--highlight-index N`, `--workspace .media-curator`.

Preview and render locally:

```sh
cd ~/HyperFramesPromos/example-night-001
npm run dev
npm run check
npm run render
```

Or one-shot render after scaffold:

```sh
media-curator-hyperframes scaffold ... --output ~/HyperFramesPromos/example-night-001 --render
```

## Verify

```sh
python -m unittest discover -s tools/media-curator-hyperframes/tests -v
ruff check tools/media-curator-hyperframes
```

## Phase 4 — Local proof result

See [FINDINGS.md](./FINDINGS.md) for the synthetic end-to-end render notes from this branch.

## Experiment checklist

Track open work in [TODO.md](./TODO.md).

## Safety

- Read-only on curator manifests, review state, and inbox originals.
- Output directories are private (`700`) and gitignored when created under this tool.
- Do not commit `.media-curator/`, promo output folders, or personal media.
