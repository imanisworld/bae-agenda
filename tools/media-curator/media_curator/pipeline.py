"""Immutable source reads, durable human review, and per-file analysis checkpoints."""

import copy
import hashlib
import os
import shutil
import stat
import subprocess
from pathlib import Path

from .analysis import recommend, review
from .cache import AnalysisCache
from .matching import match
from .metadata import IMAGES, VIDEOS, extract, filesystem_metadata
from .report import render
from .reviews import ReviewStore, apply_reviews
from .storage import atomic_json, checked_path, initialize, workspace_path


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def safe_paths(source, output):
    source, output = checked_path(source), checked_path(output)
    if not source.is_dir():
        raise ValueError("Source must be an existing directory.")
    if source == output or source in output.parents or output in source.parents:
        raise ValueError("Source and output directories must be disjoint (neither may contain the other).")
    if output.exists():
        raise ValueError(
            "Output already exists. Choose a new directory; existing files are never overwritten."
        )
    if any(part in {".git", "public"} for part in output.parts):
        raise ValueError("Output cannot be inside public/ or .git/.")
    return source, output


def discover(source):
    paths, ignored = [], []

    def onerror(error):
        raise error  # An unreadable subtree must not silently appear to be an empty inbox.

    for root, dirs, files in os.walk(source, followlinks=False, onerror=onerror):
        for name in sorted(dirs.copy()):
            path = Path(root) / name
            if path.is_symlink():
                dirs.remove(name)
                ignored.append({"path": str(path.relative_to(source)), "reason": "symlink directory"})
        dirs.sort()
        for name in sorted(files):
            path = Path(root) / name
            reason = None
            if path.is_symlink() or not stat.S_ISREG(path.lstat().st_mode):
                reason = "symlink or non-regular file"
            elif path.suffix.lower() not in IMAGES | VIDEOS:
                reason = "unsupported type"
            if reason:
                ignored.append({"path": str(path.relative_to(source)), "reason": reason})
            else:
                paths.append(path)
    return paths, ignored


def scan(source, output, events, window_hours=6, workspace=None, cache_config=None):
    source, output = safe_paths(source, output)
    workspace = workspace_path(workspace or output.parent / ".media-curator", source, output)
    store = ReviewStore(workspace)
    store.load()  # Malformed human state aborts BEFORE creating report/cache outputs.
    paths, ignored = discover(source)
    if any(p.suffix.lower() in VIDEOS for p in paths):
        missing = [name for name in ("ffprobe", "ffmpeg") if not shutil.which(name)]
        if missing:
            raise ValueError("Video scanning requires " + ", ".join(missing) + ". Install FFmpeg and retry.")
    if any(p.suffix.lower() in {".heic", ".heif"} for p in paths):
        try:
            from pillow_heif import register_heif_opener

            register_heif_opener()
        except ImportError:
            pass
    initialize(workspace)
    cache = AnalysisCache(workspace, cache_config)
    previous = cache.previous_paths(source)
    output.mkdir(parents=True, exist_ok=False, mode=0o700)
    (output / ".gitignore").write_text("*\n", encoding="utf-8")
    (output / "assets").mkdir(mode=0o700)
    items, seen = [], {}
    counts = {
        "discovered": len(paths),
        "newly_analyzed": 0,
        "reused": 0,
        "changed": 0,
        "ignored": len(ignored),
    }
    for path in paths:
        relative = str(path.relative_to(source))
        before = path.stat()
        sha = digest(path)
        kind = "video" if path.suffix.lower() in VIDEOS else "image"
        counts["changed"] += int(relative in previous and previous[relative] != sha)
        cached = cache.get(sha, kind)
        if cached:
            payload, directory = cached
            item = filesystem_metadata(path) | payload
            counts["reused"] += 1
        else:
            directory = cache.begin(sha, kind)
            item = extract(path)
            # Asset filenames use content identity, not a prior path/occurrence identifier.
            item["id"] = sha
            try:
                item.update(review(item, path, directory / "assets"))
            except (OSError, ValueError, subprocess.TimeoutExpired):
                item["warnings"].append("Review assets unavailable or timed out; inspect original manually.")
            item.pop("id")
            counts["newly_analyzed"] += 1
        after = path.stat()
        if digest(path) != sha or (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise ValueError(
                "A source changed during the scan. No completed manifest was written; retry on a stable inbox."
            )
        if item.get("previews"):
            if not cached:
                cache.publish(sha, kind, item, directory)
            cache.materialize(item, directory, output)
        cache.checkpoint_path(source, relative, sha)
        item.update(
            id=hashlib.sha256((sha + ":" + relative).encode()).hexdigest()[:16],
            content_id=sha,
            relative_path=relative,
            sha256=sha,
            source_verified_unchanged=True,
            analysis_source="CACHE" if cached else "NEW",
        )
        item["match"] = match(item, events, window_hours)
        if sha in seen:
            item["exact_duplicate_of"] = seen[sha]
        else:
            seen[sha] = item["id"]
        items.append(item)
    recommend(items)
    for item in items:
        item["auto_match"] = copy.deepcopy(item["match"])
        item["auto_recommendation"] = item["status"]
    manifest = {
        "schema_version": 2,
        "source": str(source),
        "workspace": str(workspace),
        "assumed_window_hours": window_hours,
        "events": events,
        "files": items,
        "ignored": ignored,
        "counts": counts,
        "limitations": [
            "No vision, audio energy, or shake scoring.",
            "Sampled visual changes are not frame-accurate scene cuts.",
            "GPS matching requires optional coordinates in local event JSON.",
            "Identical content shares human review decisions across paths.",
            "Source access times may change on reads.",
        ],
    }
    # Reload at completion so human decisions saved while a long scan runs are not lost.
    manifest = apply_reviews(manifest, store.load())
    counts["needing_review"] = sum(
        item["effective_approved"] is None or bool(item["review_warnings"]) for item in manifest["files"]
    )
    manifest["counts"] = counts
    atomic_json(output / "manifest.json", manifest)
    with (output / "index.html").open("x", encoding="utf-8") as out:
        out.write(render(manifest))
    return manifest
