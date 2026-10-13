# HyperFrames × Media Curator — experiment todos

Isolated experiment only. See [FINDINGS.md](./FINDINGS.md) and [README.md](./README.md). PR: [#179](https://github.com/imanisworld/bae-agenda/pull/179).

## Done

- [x] Phase 1 — verify HyperFrames locally (`doctor`, deps, licensing)
- [x] Golden-path bridge (`media-curator-hyperframes candidates` + `scaffold`) + unit test
- [x] Synthetic proof — scan → approve highlight → render MP4
- [x] Open PR on `experiment/hyperframes-media-curator`

## Next (validation)

- [ ] Review PR #179; **do not merge** until real-clip validation
- [ ] Run **2–3 real inbox clips**: scan → review/approve highlight → `scaffold` → edit in Studio → render; log time vs current NLE workflow
- [ ] Update [FINDINGS.md](./FINDINGS.md) with real-clip notes (quality, edit time, postable without heavy rework)
- [ ] **Go/no-go**: keep separate CLI, fold into curator, or abandon — only if real clips clearly beat the current path

## Template / tooling polish (optional before merge)

- [ ] Fix HyperFrames lint: move title overlay into a **sub-composition** (`nested_structure_needs_subcomposition`)
- [ ] Re-run `scaffold --render` after 30 fps keyframe extract; confirm no sparse-keyframe warnings
- [ ] Brand template: local DJ B.A.E. fonts/colors (offline render, no Google Fonts fetch)
- [ ] Audio policy: keep strip-by-default vs add licensed bed in HyperFrames

## Out of scope (unless go/no-go changes)

- [ ] Website integration, Vercel deploy, Supabase, media uploads, auto-publish
