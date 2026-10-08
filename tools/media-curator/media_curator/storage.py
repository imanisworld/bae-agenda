"""Private local JSON storage with atomic replacement and short process locks (macOS/Linux)."""

import fcntl
import json
import os
import tempfile
from contextlib import contextmanager
from pathlib import Path


def checked_path(path):
    path = Path(path).expanduser().absolute()
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise ValueError("Local state/cache/report paths must not contain symlinks.")
    return path.resolve()


def overlaps(a, b):
    return a == b or a in b.parents or b in a.parents


def workspace_path(path, source, output=None):
    path, source = checked_path(path), checked_path(source)
    if overlaps(path, source):
        raise ValueError("Workspace and source must be disjoint; never store state inside the inbox.")
    if any(part in {".git", "public"} for part in path.parts):
        raise ValueError("Local workspace cannot be inside public/ or .git/.")
    if output:
        output = checked_path(output)
        if (
            path == output
            or output in path.parents
            or any(overlaps(output, path / name) for name in ("state", "cache"))
        ):
            raise ValueError("Report output must not overlap durable state or cache.")
    return path


def private_dir(path):
    path = checked_path(path)
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    return path


def _pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key in local data.")
        result[key] = value
    return result


def read_json(path):
    path = checked_path(path)

    def invalid(_):
        raise ValueError("Non-finite JSON number in local data.")

    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_pairs, parse_constant=invalid)
    except (json.JSONDecodeError, UnicodeError):
        raise ValueError(f"Malformed local JSON: {path.name}. File was not changed.") from None


def atomic_json(path, data):
    path = checked_path(path)
    private_dir(path.parent)
    fd, temporary = tempfile.mkstemp(prefix=".pending-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as target:
            json.dump(data, target, ensure_ascii=False, indent=2, allow_nan=False)
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


@contextmanager
def locked(path):
    path = checked_path(path)
    private_dir(path.parent)
    fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "a") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def initialize(workspace):
    private_dir(workspace)
    ignore = checked_path(workspace / ".gitignore")
    if not ignore.exists():
        with ignore.open("x", encoding="utf-8") as out:
            out.write("*\n")
