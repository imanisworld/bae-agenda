# Local Media Curator

Read-only DJ media analysis with durable human corrections and resumable caching, separate from the Next.js runtime. Originals are never renamed, moved, edited, overwritten, transcoded in place, or deleted. Approving media means **local review only**; there is no upload, DB-write, editing, or publishing operation.

## Install

Requires Python 3.11+ on macOS/Linux and Pillow. Video analysis requires `ffmpeg` and `ffprobe` on `PATH`; install FFmpeg through your OS package manager. Missing video prerequisites stop the scan before output creation. Optional `pillow-heif` enables HEIC/HEIF; otherwise unreadable items retain their hashes and warnings.

From the repo root:

```sh
python3 -m venv tools/media-curator/.venv
source tools/media-curator/.venv/bin/activate
python -m pip install -e 'tools/media-curator[dev]'
# Optional:
python -m pip install -e 'tools/media-curator[heif]'
```

No new dependencies were added for state, caching, or the UI. Local locking uses Python's standard-library `fcntl` (macOS/Linux). No npm packages, migrations, paid API, cloud service, or background daemon are involved.

## First scan → review → rescan

Keep the original inbox **outside** the workspace. Run from the same directory each time, or pass the same `--workspace` explicitly:

```sh
media-curator scan '/path/to/DJ Media Inbox' --events /path/to/events.json --workspace .media-curator
```

The CLI prints a new manifest/report path and a review command. Open the static `index.html` for a scan-time snapshot, or run the printed command to edit decisions:

```sh
media-curator review .media-curator/runs/run-EXAMPLE/manifest.json
```

Open the printed `http://127.0.0.1:<port>/` URL. This foreground server stops with Ctrl-C; it does not watch files or run in the background. Only loopback is supported; there is no network-bind option. `--port` selects a fixed local port when needed.

For each item:

- **Confirm suggested event**, **Change event**, **Mark unmatched**, or **Reject suggested event**. Choose a catalog event before Change event. Clear event corrections explicitly returns event assignment to automation.
- Set **Hero**, **Gallery**, **Social candidate**, **Maybe**, **Skip**, or **Duplicate**. Choose AUTO to remove the status override.
- **Approve**, **Reject**, or leave Pending; save notes alongside the decision.
- For videos, approve/reject each candidate range or add a manual range using start/end seconds. Manual ranges are initially approved. No clip is cut or exported.
- Click **Save review** after changing fields. Action buttons also save the other visible fields.

Saves go to review state, not the report snapshot or originals. Reloading the UI reads current durable decisions. A stale browser tab is rejected instead of overwriting a newer save. Close/reopen the server at any time.

Rescan using the same workspace and a new report directory (the default creates one):

```sh
media-curator scan '/path/to/DJ Media Inbox' --events /path/to/events.json --workspace .media-curator
```

Unchanged content reuses verified analysis; event matching/recommendations run again against the current catalog, then human decisions take precedence. The new static report/manifest incorporates those decisions. An older open review server keeps its original scan/catalog; reopen it on the new manifest to see new automatic results.

The CLI reports discovered, newly analyzed, reused, changed-at-a-known-path, ignored, and needing-review counts. Newly analyzed + reused equals discovered. **Changed is a subset**, not another additive total. Needing review means pending approval or a warning about a saved decision. Approval/rejection is never an upload instruction.

## Local files and privacy

```text
.media-curator/
  .gitignore
  state/
    review.json                 # durable human decisions — preserve/back up separately
    review.lock
  cache/
    paths.json                  # last observed path → content hash, by source root
    entries/<analysis-key>/
      current.json              # pointer to a completed generation
      <generation>/analysis.json
      <generation>/assets/     # verified generated JPEGs
  runs/<run-id>/
    manifest.json
    index.html
    assets/                    # copies, so reports survive cache reset
```

Custom workspaces write their own ignore-all `.gitignore`. Generated files include **local paths, GPS, capture times, event details, and review notes**. Keep them private; do not commit, publish, or share them unintentionally. New workspace/run/state files use private directory/file permissions. Source access times may change when files are read.

Inputs: JPEG, PNG, WebP, readable HEIC/HEIF, MP4, MOV, WebM. Traversal is sorted and recursive; symlinks, non-regular files, and unsupported extensions are skipped. An unreadable subtree fails rather than silently disappearing. Keep the inbox stable while scanning.

Source, workspace, and report safety checks reject symlinks and overlap with originals. Reports cannot overlap state/cache, reuse an existing output directory, or live under `public/` or `.git/`. All source accesses are reads. SHA-256, size, and mtime are checked after analysis on cache hits and misses. Concurrent modification aborts before publishing a completed manifest; completed cache entries remain reusable. Use a read-only filesystem mount for OS-enforced immutability.

The review server serves only generated HTML and allowlisted JPEGs. It does not expose source files, manifests, notes/state files as endpoints, or arbitrary paths. It uses exact loopback Host checks, Origin checks, a session form token, escaped HTML, no JavaScript or remote assets, and no-store responses. Normal offline review has no network client, Supabase call, or DB write. Only your browser's loopback requests are needed.

## Human state and stable identity

Content SHA-256 is the primary identity. Moving/reorganizing a file retains its decisions and analysis if bytes are identical. Changed content gets a new identity and **does not inherit** the prior decision. Identical copies share decisions intentionally; path occurrences remain distinct rows and duplicate labels remain visible. Metadata edits also change bytes/identity.

`state/review.json` is versioned separately from scan manifests:

```json
{
  "schema_version": 1,
  "reviews": {
    "<64-character-content-sha256>": {
      "event_id": "existing-event-id",
      "rejected_event_ids": [],
      "status": "HERO",
      "approved": true,
      "note": "best crowd shot",
      "highlights": [{"start_seconds": 10, "end_seconds": 24, "approved": true}],
      "last_known_relative_path": "event/clip.mov",
      "updated_at": "2026-10-08T01:00:00+00:00",
      "revision": 1
    }
  }
}
```

Omitted `event_id` follows automation except for rejected event IDs; explicit `null` means intentionally unmatched. A rejected automatic assignment becomes effectively unmatched; an alternative is not silently substituted. Status null/omitted follows the recommendation. Approval null means pending. Range approval is independent of whole-file approval. `last_known_relative_path` records the path at manual review; current paths remain in each manifest and the cache path index.

Saves use a process lock, revision check, and atomic file replacement. Automatic scans never write human state. Malformed/unknown-version review state fails closed with an error and is never reset or silently discarded. Restore a known-good backup or correct it intentionally. Assignments absent from a newer catalog remain intact with a warning. Revisions prevent lost updates; this is a current-decision store, not a full historical revision log.

New manifests use `schema_version: 2`. Each item retains `auto_match`, `auto_recommendation`, `human_review`, `effective_event_id`, `effective_status`, `effective_approved`, `effective_highlights`, and `decision_source`. Legacy `match`/`status` remain the automatic values for compatibility. `content_id` is SHA-256; `id` only distinguishes report occurrences.

- **AUTO**: no saved human review.
- **HUMAN_CONFIRMED**: saved review agrees with current auto event/status (approval, notes, and ranges are still independently recorded).
- **HUMAN_OVERRIDDEN**: saved review changes the effective event or status.

Version-1 manifests can be opened with `media-curator review old/manifest.json --workspace .media-curator`. They already contain SHA-256, so an in-memory adapter adds the new concepts without rewriting the old report. Version-1 derived assets are served from their original report directory. Old reports are **not imported into the cache**; the first new scan populates it. A version-2 review server uses the workspace recorded by the scan unless explicitly overridden.

## Cache validity, resuming, and reset

Cache keys include content SHA-256, media kind, analysis schema, Pillow/optional HEIF version, FFmpeg/ffprobe versions, and hashes of the metadata/analysis implementation (including sampling settings). No matching/catalog results or human decisions are cached as analysis. Source paths and filesystem timestamps are refreshed on every scan.

On reuse, the analysis record checksum, expected asset inventory, each asset SHA-256, and JPEG decoding are verified. Missing/corrupt records or assets trigger regeneration. Cache/schema/tool/config changes invalidate reuse. Failed/unreadable analysis is retried rather than permanently cached as success.

Each completed file publishes an atomic pointer to its cache generation. After interruption, rerun the scan into a fresh report directory; previous complete files are reused. Partial report/cache generations may remain but are never trusted. Hashing still reads each original before/after analysis, so large videos have unavoidable disk-I/O cost even on reuse. There is no size/mtime-only identity shortcut.

To reset generated analysis safely:

1. Stop active scans/review sessions.
2. In your file manager, remove **only `<workspace>/cache/`**. Existing reports contain independent copies of previews.
3. Keep `<workspace>/state/` and the inbox. Next scan recomputes analysis and reapplies decisions.
4. Optionally remove individual old `<workspace>/runs/<run-id>/` directories.

To **intentionally reset all human decisions**, first back up `<workspace>/state/review.json` outside the state directory, then remove only that file while review servers are stopped. The next scan/review session treats all items as AUTO. Never delete the entire workspace to clear the cache: that would discard human state too. No automatic cleanup/delete command is provided.

## Event catalog, including non-public events

The existing `--events` option accepts an offline JSON array with existing event IDs:

```json
[{"id":"existing-event-id","title":"Example Night","slug":"example-night",
  "event_date":"2025-05-09T02:00:00Z","event_timezone":"America/Chicago",
  "venue":"Example Venue","city":"Chicago"}]
```

Create this file yourself through an **already authorized** admin export workflow. For example, in an existing authorized Supabase dashboard session, export the `events` table's `id,title,slug,event_date,event_timezone,venue,city` columns and convert that export to the JSON-array shape above locally. Include non-public events only if your existing access permits it. Exclude booking/client columns. No new permission, credential, or privileged connection is needed by this tool. Do not put exports in tracked folders; an ignored file under the workspace is suitable.

Optional `duration_hours`, `latitude`, and `longitude` may be added to local JSON when known. They are local enrichment only; no schema changes/geocoding occur.

For current public events, export the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into your shell and explicitly use `--supabase`. It performs paginated HTTPS GETs for the seven columns with `public=true`. It never uses service-role credentials, automatically loads `.env`, reads bookings/clients, follows redirects, or writes. Without a catalog, automatic matches remain UNMATCHED; existing human assignments are preserved with absent-catalog warnings.

## Existing analysis limits

Matching is an evidence score, not a probability: +75 within start −1h to start +6h (override with `--window-hours` or local `duration_hours`), +25 within 24h outside the window, +35 for a matching unreviewed legacy calendar date, up to +20 for filename/folder clues, and +15/−40 for near/conflicting locally supplied GPS coordinates. HIGH_CONFIDENCE requires ≥90, reliable explicit-offset capture time, corroboration, and a ≥15-point lead. LIKELY requires ≥70 and strong time evidence. Conflicts, ties, or weak evidence require review. Filesystem timestamps are never capture-time substitutes; DST-ambiguous/nonexistent camera times are not trusted.

Exact duplicates use SHA-256. Possible image duplicates use dHash distance ≤5 within an event group; no video near-duplicate analysis. Technical quality is 40% resolution, 30% unclipped exposure, 30% edge strength, with limitations for dark lighting and intentional focus. Automatic picks balance image/video and orientation, not semantic content.

Videos get 3–24 samples, contact sheets, sampled visual-change signals, and up to three technical candidate ranges. These are **not verified highlights or frame-accurate scene cuts**. No vision/content judgments, audio/shake scoring, cutting, FFmpeg clip exports, social edits, uploads, cloud processing, DB writes, or publishing are added.

## Verify

```sh
python -m unittest discover -s tools/media-curator/tests -v
ruff check tools/media-curator
ruff format --check tools/media-curator
```

Synthetic tests cover the MVP, durable review/moves/changed content, cache reuse/invalidation/missing assets/interrupted scans, immutable originals, malformed state, duplicate behavior, escaping, compatibility, and loopback review/security boundaries. No fixture contains personal media. CI installs FFmpeg for the synthetic video integration test.
