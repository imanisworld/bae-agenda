"""Source reads only. Fresh, disjoint output directory for every run."""

import hashlib
import json
import os
import shutil
import stat
import subprocess
from pathlib import Path

from .analysis import recommend, review
from .matching import match
from .metadata import IMAGES, VIDEOS, extract
from .report import render


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def safe_paths(source, output):
    source, output = Path(source).expanduser().absolute(), Path(output).expanduser().absolute()
    for path in (source, output):
        if any(p.is_symlink() for p in (path, *path.parents)):
            raise ValueError("Source/output paths must not contain symlinks; use their real paths.")
    source, output = source.resolve(), output.resolve()
    if not source.is_dir():
        raise ValueError("Source must be an existing directory.")
    if source == output or source in output.parents or output in source.parents:
        raise ValueError("Source and output directories must be disjoint (neither may contain the other).")
    if output.exists():
        raise ValueError(
            "Output already exists. Choose a new directory; existing files are never overwritten."
        )
    # Prevent accidental publishing through the site's static tree or polluting Git internals.
    if any(part in {".git", "public"} for part in output.parts):
        raise ValueError("Output cannot be inside public/ or .git/.")
    return source, output


def discover(source):
    paths, ignored = [], []
    for root, dirs, files in os.walk(source, followlinks=False):
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


def scan(source, output, events, window_hours=6):
    source, output = safe_paths(source, output)
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
            pass  # Per-file unreadable warning; hash and source inventory still work.
    output.mkdir(parents=True, exist_ok=False, mode=0o700)
    # All artifacts are private/local and ignored even for custom workdirs in a checkout.
    (output / ".gitignore").write_text("*\n", encoding="utf-8")
    assets = output / "assets"
    assets.mkdir(mode=0o700)
    items, seen = [], {}
    for path in paths:
        relative = str(path.relative_to(source))
        before = path.stat()
        sha = digest(path)
        item = extract(path)
        item.update(id=hashlib.sha256(relative.encode()).hexdigest()[:16], relative_path=relative, sha256=sha)
        item["match"] = match(item, events, window_hours)
        if sha in seen:
            item["exact_duplicate_of"] = seen[sha]["id"]
            for key in (
                "previews",
                "contact_sheet",
                "samples",
                "sampled_scene_changes",
                "highlights",
                "technical",
                "perceptual_hash",
                "vision",
            ):
                if key in seen[sha]:
                    item[key] = seen[sha][key]
        else:
            try:
                item.update(review(item, path, assets))
            except (OSError, ValueError, subprocess.TimeoutExpired):
                item["warnings"].append("Review assets unavailable or timed out; inspect original manually.")
            seen[sha] = item
        after = path.stat()
        if digest(path) != sha or (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise ValueError(
                "A source changed during the scan. No completed manifest was written; retry on a stable inbox."
            )
        item["source_verified_unchanged"] = True
        items.append(item)
    recommend(items)
    manifest = {
        "schema_version": 1,
        "source": str(source),
        "assumed_window_hours": window_hours,
        "events": events,
        "files": items,
        "ignored": ignored,
        "limitations": [
            "No vision, audio energy, or shake scoring.",
            "Sampled visual changes are not frame-accurate scene cuts.",
            "GPS matching requires optional coordinates in local event JSON.",
            "No neighbor propagation: uncertain files remain review items.",
            "Sources must remain stable during scanning; access times may change on reads.",
        ],
    }
    with (output / "manifest.json").open("x", encoding="utf-8") as out:
        json.dump(manifest, out, indent=2, ensure_ascii=False, allow_nan=False)
    with (output / "index.html").open("x", encoding="utf-8") as out:
        out.write(render(manifest))
    return manifest
