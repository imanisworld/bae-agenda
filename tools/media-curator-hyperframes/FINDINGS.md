# Experiment findings — HyperFrames × Media Curator

**Branch:** `experiment/hyperframes-media-curator`  
**Date:** 2026-10-11

## Verdict

**Promising for a manual follow-up workflow, not ready to integrate into production.**

HyperFrames can turn an approved curator highlight into a **real, editable 9:16 MP4 promo** locally, with no API keys and Apache 2.0 tooling. The bridge respects curator SHA-256 identity and review state. The remaining cost is operational: two runtimes (Python + Node), a deliberate HyperFrames edit pass, and better clip encoding defaults for seek-heavy renders.

## Synthetic proof (local)

1. `media-curator scan` on a 20s lavfi test clip → candidate highlight range.
2. Saved review: `SOCIAL_CANDIDATE`, highlight approved.
3. `media-curator-hyperframes scaffold … --render` → **1080×1920 MP4**, ~14.5s, ~1.6 MB, ~18s render on M1 Pro.

`hyperframes check` passed with one layout warning (nested overlay — fixable by moving overlay to a sub-composition). Initial extract triggered a sparse-keyframe warning; extract now re-encodes at 30 fps with `-g 30` for seek stability.

## What materially helps the curator workflow

| Benefit | Notes |
| --- | --- |
| Jump from “approved range” to editable project | No re-marking in/out in an NLE just to add titles |
| Same files in Studio / CLI / agent | Matches how you already work in code |
| Deterministic local MP4 | Good for regression if templates stabilize |
| No cloud/publish coupling | Fits curator’s local-only privacy model |

## What does not (yet)

| Gap | Notes |
| --- | --- |
| Curator highlights are sampled, not frame-accurate | Promos inherit that imprecision until trimmed in Studio |
| Default template is minimal | Beat-sync, captions, brand blocks still manual or skill-driven |
| No single-command UX inside `media-curator` | Separate `media-curator-hyperframes` CLI by design |
| Render time / machine weight | Fine for occasional social clips, not bulk batch without Lambda (out of scope) |
| Google Fonts fetch during render | Offline render may need local `@font-face` assets |

## Recommendation

- **Keep** the experiment tool on a branch; use it on real approved highlights when you want a social cut.
- **Do not merge** into the website or wire automatic publish.
- **Revisit integration** only if, on 2–3 real event clips, edit time to a postable promo is clearly faster than your current NLE/template path.

## Licensing reminder

- HyperFrames: Apache 2.0 (commercial use OK for the toolchain).
- DJ footage / event audio: unchanged — you still control rights; bridge strips audio by default on extract.
