"""Read-only bridge from Media Curator manifests to HyperFrames project folders."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import textwrap
from datetime import datetime, timezone
from pathlib import Path

from media_curator.reviews import ReviewStore, apply_reviews
from media_curator.storage import read_json

HASH = re.compile(r"^[a-f0-9]{64}$")
PROMO_STATUSES = {"HERO", "GALLERY", "SOCIAL_CANDIDATE"}
ASPECTS = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
}


def digest(path: Path) -> str:
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def load_manifest(manifest_path: Path, workspace: Path | None) -> dict:
    manifest = read_json(manifest_path)
    if manifest.get("schema_version") not in (1, 2):
        raise ValueError("Manifest must be schema_version 1 or 2.")
    if workspace is None:
        recorded = manifest.get("workspace")
        workspace = Path(recorded) if recorded else manifest_path.parent.parent
    store = ReviewStore(workspace)
    return apply_reviews(manifest, store.load())


def approved_highlights(item: dict) -> list[dict]:
    segments = item.get("effective_highlights") or item.get("highlights") or []
    approved = [segment for segment in segments if segment.get("approved") is True]
    if approved:
        return approved
    if item.get("effective_approved") is True and segments:
        return [segments[0]]
    return []


def pick_item(manifest: dict, content_id: str | None) -> dict:
    videos = [
        item
        for item in manifest["files"]
        if item.get("media_type") == "video" and approved_highlights(item)
    ]
    if content_id:
        matches = [item for item in videos if item.get("content_id") == content_id]
        if not matches:
            raise ValueError("No video with an approved highlight matches that content_id.")
        return matches[0]
    preferred = [
        item
        for item in videos
        if item.get("effective_approved") is True
        and (item.get("effective_status") in PROMO_STATUSES or item.get("status") in PROMO_STATUSES)
    ]
    pool = preferred or [item for item in videos if item.get("effective_approved") is True] or videos
    if not pool:
        raise ValueError(
            "No video with an approved highlight was found. Approve a highlight range in review first."
        )
    return pool[0]


def event_label(manifest: dict, event_id: str | None) -> tuple[str, str]:
    if not event_id:
        return "DJ B.A.E.", ""
    for event in manifest.get("events") or []:
        if event.get("id") == event_id:
            title = event.get("title") or "DJ B.A.E."
            venue = event.get("venue") or ""
            city = event.get("city") or ""
            subtitle = " · ".join(part for part in (venue, city) if part)
            return title, subtitle
    return event_id, ""


def safe_output(output: Path, source_root: Path) -> Path:
    output = output.expanduser().resolve()
    source_root = source_root.resolve()
    if output.exists():
        raise ValueError("Output directory already exists; choose a fresh path.")
    if output == source_root or source_root in output.parents or output in source_root.parents:
        raise ValueError("Output must not overlap the media inbox source tree.")
    if any(part in {".git", "public"} for part in output.parts):
        raise ValueError("Output cannot live under public/ or .git/.")
    return output


def extract_highlight(source: Path, start: float, end: float, destination: Path) -> None:
    if not shutil.which("ffmpeg"):
        raise ValueError("ffmpeg is required to copy the approved highlight into the HyperFrames project.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-nostdin",
        "-y",
        "-ss",
        str(start),
        "-to",
        str(end),
        "-i",
        str(source),
        "-an",
        "-c:v",
        "libx264",
        "-r",
        "30",
        "-g",
        "30",
        "-keyint_min",
        "30",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(destination),
    ]
    subprocess.run(command, check=True, capture_output=True, text=True)


def composition_html(
    *,
    width: int,
    height: int,
    duration: float,
    title: str,
    subtitle: str,
    project_id: str,
) -> str:
    title_block = (
        f'<p id="subtitle" class="clip" data-start="0.2" data-duration="2.5" data-track-index="1">{subtitle}</p>'
        if subtitle
        else ""
    )
    subtitle_motion = (
        'tl.from("#subtitle", { opacity: 0, y: 18, duration: 0.6, ease: "power2.out" }, 0.45);'
        if subtitle
        else ""
    )
    return textwrap.dedent(
        f"""\
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width={width}, height={height}" />
            <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
            <style>
              * {{ margin: 0; padding: 0; box-sizing: border-box; }}
              html, body {{
                margin: 0;
                width: {width}px;
                height: {height}px;
                overflow: hidden;
                background: #0a0a0a;
                font-family: Inter, ui-sans-serif, system-ui, sans-serif;
              }}
              #stage {{
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
              }}
              #clip {{
                width: 100%;
                height: 100%;
                object-fit: cover;
              }}
              #overlay {{
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 48px;
                background: linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%);
              }}
              #title {{
                color: #f4f4f5;
                font-size: {72 if width >= height else 56}px;
                font-weight: 700;
                letter-spacing: -0.03em;
                line-height: 1.05;
              }}
              #subtitle {{
                margin-top: 12px;
                color: #d4d4d8;
                font-size: 32px;
                font-weight: 500;
              }}
            </style>
          </head>
          <body>
            <div
              id="stage"
              data-composition-id="main"
              data-start="0"
              data-duration="{duration:.3f}"
              data-width="{width}"
              data-height="{height}"
            >
              <video
                id="clip"
                class="clip"
                data-start="0"
                data-duration="{duration:.3f}"
                data-track-index="0"
                src="assets/highlight.mp4"
                muted
                playsinline
              ></video>
              <div id="overlay" class="clip" data-start="0" data-duration="{duration:.3f}" data-track-index="2">
                <h1 id="title" class="clip" data-start="0.2" data-duration="2.8" data-track-index="3">{title}</h1>
                {title_block}
              </div>
            </div>
            <script>
              const tl = gsap.timeline({{ paused: true }});
              tl.from("#title", {{ opacity: 0, y: 28, duration: 0.7, ease: "power2.out" }}, 0.25);
              {subtitle_motion}
              window.__timelines = window.__timelines || {{}};
              window.__timelines.main = tl;
              tl.seek(0);
            </script>
          </body>
        </html>
        """
    )


def scaffold(
    *,
    manifest_path: Path,
    output: Path,
    workspace: Path | None,
    content_id: str | None,
    highlight_index: int,
    aspect: str,
) -> dict:
    if aspect not in ASPECTS:
        raise ValueError(f"Unsupported aspect {aspect!r}; choose from {', '.join(ASPECTS)}.")
    manifest = load_manifest(manifest_path, workspace)
    item = pick_item(manifest, content_id)
    if not HASH.fullmatch(item.get("content_id", "")):
        raise ValueError("Manifest item is missing content_id (SHA-256).")
    segments = approved_highlights(item)
    if highlight_index < 0 or highlight_index >= len(segments):
        raise ValueError(f"highlight-index {highlight_index} is out of range (0..{len(segments) - 1}).")
    segment = segments[highlight_index]
    source_root = Path(manifest["source"])
    source_file = (source_root / item["relative_path"]).resolve()
    output = safe_output(output, source_root)
    if not source_file.is_file() or source_file.is_symlink():
        raise ValueError("Source media is missing or not a regular file.")
    if digest(source_file) != item["content_id"]:
        raise ValueError("Source bytes no longer match manifest content_id; rescan before scaffolding.")

    width, height = ASPECTS[aspect]
    start = float(segment["start_seconds"])
    end = float(segment["end_seconds"])
    clip_duration = max(0.5, end - start)
    comp_duration = min(clip_duration + 0.5, 90.0)
    title, subtitle = event_label(manifest, item.get("effective_event_id"))

    output.mkdir(parents=True, exist_ok=False, mode=0o700)
    (output / ".gitignore").write_text("*\n", encoding="utf-8")
    assets = output / "assets"
    assets.mkdir(mode=0o700)
    extract_highlight(source_file, start, end, assets / "highlight.mp4")

    project_id = f"curator-{item['content_id'][:12]}"
    (output / "hyperframes.json").write_text(
        json.dumps(
            {
                "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
                "paths": {
                    "blocks": "compositions",
                    "components": "compositions/components",
                    "assets": "assets",
                },
                "media": {"autoProxy": True},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (output / "meta.json").write_text(
        json.dumps(
            {
                "id": project_id,
                "name": project_id,
                "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (output / "package.json").write_text(
        json.dumps(
            {
                "name": project_id,
                "private": True,
                "type": "module",
                "scripts": {
                    "dev": "npx --yes hyperframes@0.8.147 preview",
                    "check": "npx --yes hyperframes@0.8.147 check",
                    "render": "npx --yes hyperframes@0.8.147 render --output renders/promo.mp4",
                },
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (output / "index.html").write_text(
        composition_html(
            width=width,
            height=height,
            duration=comp_duration,
            title=title,
            subtitle=subtitle,
            project_id=project_id,
        ),
        encoding="utf-8",
    )
    provenance = {
        "experiment": "media-curator-hyperframes",
        "schema_version": 1,
        "manifest": str(manifest_path.resolve()),
        "content_id": item["content_id"],
        "relative_path": item["relative_path"],
        "highlight": {
            "start_seconds": start,
            "end_seconds": end,
            "approved": segment.get("approved"),
        },
        "effective_status": item.get("effective_status"),
        "effective_approved": item.get("effective_approved"),
        "aspect": aspect,
        "hyperframes_cli": "npx hyperframes@0.8.147",
        "next_steps": [
            "cd <output> && npm run dev",
            "npm run check",
            "npm run render",
        ],
    }
    (output / "curator-bridge.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return provenance


def list_candidates(manifest_path: Path, workspace: Path | None) -> list[dict]:
    manifest = load_manifest(manifest_path, workspace)
    rows = []
    for item in manifest["files"]:
        if item.get("media_type") != "video":
            continue
        segments = approved_highlights(item)
        if not segments:
            continue
        rows.append(
            {
                "content_id": item.get("content_id"),
                "relative_path": item.get("relative_path"),
                "effective_status": item.get("effective_status"),
                "effective_approved": item.get("effective_approved"),
                "highlights": [
                    {
                        "index": index,
                        "start_seconds": segment["start_seconds"],
                        "end_seconds": segment["end_seconds"],
                        "approved": segment.get("approved"),
                    }
                    for index, segment in enumerate(segments)
                ],
            }
        )
    return rows
