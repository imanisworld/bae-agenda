# Local Media Curator

Read-only DJ media inventory and review, independent of the Next.js runtime. Originals are never renamed, moved, edited, overwritten, transcoded in place, or deleted. This tool has no upload, database-write, publishing, or approval action.

## Install

Requires Python 3.11+ and Pillow. Video scanning requires `ffmpeg` and `ffprobe` on `PATH` (for example, install FFmpeg through your OS package manager). Missing video tools stop the scan before outputs are created. HEIC/HEIF decoding is optional; unreadable files still appear with hashes and warnings.

From the repo root:

```sh
python3 -m venv tools/media-curator/.venv
source tools/media-curator/.venv/bin/activate
python -m pip install -e 'tools/media-curator[dev]'
# Optional HEIC/HEIF support:
python -m pip install -e 'tools/media-curator[heif]'
```

No npm dependencies, migrations, paid APIs, server, or background worker are added.

## Scan and review

```sh
media-curator scan '/path/to/DJ Media Inbox' --events /path/to/events.json
# Or choose a NEW output directory outside the inbox:
media-curator scan '/path/to/DJ Media Inbox' --events /path/to/events.json --output /path/to/review-run-001
```

Supported: JPEG, PNG, WebP, readable HEIC/HEIF, MP4, MOV, WebM. Traversal is recursive, sorted, and skips symlinks, non-regular files, and unsupported extensions. Keep the inbox stable while scanning.

Default output is `.media-curator/run-<UTC timestamp>/` beneath your current directory:

- `manifest.json`: source paths, SHA-256 hashes, extracted metadata/provenance, suggested event IDs, alternatives, confidence/reasons, technical measurements, duplicates, recommendations, video samples and timestamp ranges
- `index.html`: offline review grouped by suggested event, including NEEDS_REVIEW and UNMATCHED items
- `assets/`: bounded JPEG previews and contact sheets
- `.gitignore`: ignores all generated data, including in custom output directories

Open `index.html` directly in a browser. No server is required. Paths/metadata are private: do not publish or commit the output. Reports use escaped text, no JavaScript, no remote fonts/images, and no source-media links. No original media is copied into the workbench.

The output must be new, outside the source, and cannot contain the source. Existing output paths, symlinked source/output paths, and output under `public/` or `.git/` are rejected. Run again into a new directory. To remove generated data safely, delete only the specific review run directory shown by the CLI using your file manager. Never select the inbox. There is intentionally no cleanup command that could delete source files.

## Event catalog

Offline JSON is simplest and can include non-public events exported separately through an authorized workflow:

```json
[
  {
    "id": "existing-event-id",
    "title": "Example Night",
    "slug": "example-night",
    "event_date": "2025-05-09T02:00:00Z",
    "event_timezone": "America/Chicago",
    "venue": "Example Venue",
    "city": "Chicago"
  }
]
```

Use real existing event IDs. These seven fields match `lib/db/events.ts`. The current `events` schema has no end time or coordinates. You may add `duration_hours`, `latitude`, and `longitude` to **local JSON only**, if known. No geocoding or schema changes occur.

To read current public events directly, explicitly export the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into your shell, then run:

```sh
media-curator scan '/path/to/DJ Media Inbox' --supabase
```

The connector issues paginated HTTPS GET requests to `/rest/v1/events`, selecting only the seven fields above and `public=true`. It never uses the service-role key, loads `.env` automatically, reads bookings/clients, or follows redirects. Existing row-level permissions apply. Without a catalog, scanning still works and files remain UNMATCHED. No empty/error result is replaced with invented events.

## Matching and provenance

Scores are deterministic evidence scores, **not statistical probabilities**:

- Zoned capture timestamp within event start minus 1 hour through start plus 6 hours: +75. Change the assumed duration with `--window-hours`; local `duration_hours` overrides it per event.
- Within 24 hours but outside the window: +25.
- Matching calendar date on a legacy/unreviewed timezone record: +35, review only.
- Filename/relative-folder tokens matching event title, slug, venue, or city: +7 each, capped at +20.
- GPS within 3 km of locally supplied coordinates: +15; beyond 50 km: −40 and manual review.

| Confidence | Meaning |
| --- | --- |
| HIGH_CONFIDENCE | At least 90 points, strong date/window evidence with explicit capture offset, high-reliability EXIF timestamp, corroboration, no conflict, and a 15-point lead over alternatives |
| LIKELY | At least 70 points and strong date/window evidence, with no close competitor or known conflict; container creation time or assumed camera timezone caps confidence here |
| NEEDS_REVIEW | Weak evidence, legacy timezone, conflicting timestamps/location, or another event within 15 points; displayed event is a suggestion |
| UNMATCHED | No supported positive evidence |

EXIF original/digitized times and video container/stream creation tags retain their provenance. Container creation may represent export time, so it is lower reliability. Filesystem modified/birth times are stored **separately and never substituted for capture time**. Conflicting comparable embedded timestamps force review. Unzoned camera times assume each event's timezone and cannot yield HIGH_CONFIDENCE; ambiguous/nonexistent daylight-saving wall times are rejected. Unknown timezone records are never silently reinterpreted as local instants. Neighbor-based propagation is deferred to avoid amplifying a wrong match.

## Duplicates, quality, and selections

Exact SHA-256 duplicates are labeled, never deleted. Images also use a difference hash (Hamming distance ≤5) for **possible** visual duplicates within an event group; false positives are possible. Video near-duplicate detection is deferred.

Technical quality is a transparent heuristic: 40% usable resolution, 30% unclipped exposure, 30% edge strength. Intentional dark lighting, grain, shallow focus, and stage lighting can affect it. Portrait/landscape and duration are metadata, not content judgments. Shake and audio energy remain null.

The `VisionAdapter` protocol in `analysis.py` is an extension point. There is no configured provider or CLI vision option. DJ visibility, crowd activity, dancing, reaction, venue, detail, performance, and social-content judgments remain null. No media is sent to a model.

Selections rank technical quality, suppress exact/possible duplicates, and limit each suggested event to six picks and three of the same media type/orientation. This provides basic format diversity; semantic diversity requires future human or vision labels.

| Status | Meaning |
| --- | --- |
| HERO | Highest-ranked usable representative for a likely/confident event; provisional |
| GALLERY | Additional usable representative within diversity quotas |
| SOCIAL_CANDIDATE | Portrait video candidate; no crop or social encode created |
| MAYBE | Assignment, similarity, decoding, or selection quota needs review |
| SKIP | Low technical score; original retained |
| DUPLICATE | Exact content match to another file; original retained |

Each video gets 3–24 evenly spaced samples, a labeled contact sheet, sampled visual-change intervals, and up to three nonoverlapping 14-second candidate ranges (clamped for short clips). These use sampled exposure, edges, and frame differences. **They are starting points for review, not verified highlights or frame-accurate scene cuts.** Sparse sampling can miss the best moment. FFmpeg reads sources and emits JPEGs through a pipe; no full proxies, audio analysis, edits, or encodes are generated.

## Safety and scope

The tool opens sources only for reading and hashes them before and after analysis, also comparing size and nanosecond mtime. A change aborts before writing a completed manifest. Read access can update filesystem access times. This is application-level immutability, not protection from another process changing the inbox; use a read-only filesystem mount for stronger OS enforcement. Partial derived assets may remain after interruption/failure, in that run directory only.

This phase does not invoke the existing uploader or server actions, change `event_media`, store assets in `site-media`, revive PR #59, deploy, or publish. Future phases can consume `schema_version: 1`, `event_id`, and `media_type` after explicit human review.

## Verify

```sh
python -m unittest discover -s tools/media-curator/tests -v
ruff check tools/media-curator
ruff format --check tools/media-curator
```

Tests generate synthetic images/videos in temporary directories; no fixtures contain personal media. With FFmpeg installed, the suite includes a synthetic three-minute video, metadata extraction, contact sheet generation, candidate ranges, and before/after source hashes. It also covers timezones/DST, thresholds/conflicts, metadata absence, duplicates, path safety, GET pagination, HTML escaping, and unsupported/corrupt files. Without FFmpeg the video integration test is explicitly skipped. GitHub CI installs FFmpeg to require that coverage.
