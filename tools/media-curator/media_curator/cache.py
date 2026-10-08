"""Disposable content-addressed analysis, with completed-file checkpoints and verified JPEG assets."""

import copy
import hashlib
import importlib.metadata
import json
import re
import shutil
import subprocess
import uuid
from pathlib import Path

from PIL import Image
from PIL import __version__ as pillow_version

from .storage import atomic_json, checked_path, locked, private_dir, read_json

ANALYSIS_SCHEMA = 1
ASSET = re.compile(r"^assets/[a-f0-9-]+(?:sheet)?\.jpg$")
PATH_FIELDS = {
    "source_path",
    "filename",
    "file_size",
    "file_type",
    "filesystem_mtime",
    "filesystem_birthtime",
}


def file_hash(path):
    with checked_path(path).open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def fingerprint(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True, allow_nan=False).encode()).hexdigest()


def profile():
    versions = {}
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            versions[tool] = None
            continue
        try:
            result = subprocess.run([tool, "-version"], capture_output=True, timeout=10, check=True)
            versions[tool] = result.stdout.decode(errors="replace").splitlines()[0]
        except (OSError, subprocess.SubprocessError, IndexError):
            versions[tool] = "unavailable"
    try:
        heif = importlib.metadata.version("pillow-heif")
    except importlib.metadata.PackageNotFoundError:
        heif = None
    return {
        "analysis_schema": ANALYSIS_SCHEMA,
        "pillow": pillow_version,
        "pillow_heif": heif,
        "tools": versions,
        # Includes sampling/quality settings even when they are implementation constants.
        "implementation": {
            name: file_hash(Path(__file__).with_name(name)) for name in ("metadata.py", "analysis.py")
        },
    }


def asset_names(payload):
    previews = payload.get("previews")
    if not isinstance(previews, list) or not previews:
        raise ValueError("Cache has no preview assets.")
    names = list(previews)
    if payload.get("contact_sheet"):
        names.append(payload["contact_sheet"])
    if any(not isinstance(name, str) or not ASSET.fullmatch(name) for name in names):
        raise ValueError("Invalid cached asset path.")
    return sorted(set(names))


class AnalysisCache:
    def __init__(self, workspace, config=None):
        self.root = checked_path(workspace / "cache")
        self.config = config if config is not None else profile()

    def key(self, sha, kind):
        return fingerprint({"sha256": sha, "kind": kind, "profile": self.config})

    def get(self, sha, kind):
        key = self.key(sha, kind)
        try:
            pointer = read_json(self.root / "entries" / key / "current.json")
            generation = pointer["generation"]
            if not isinstance(generation, str) or not re.fullmatch("[a-f0-9]{32}", generation):
                return None
            directory = checked_path(self.root / "entries" / key / generation)
            record = read_json(directory / "analysis.json")
            if record["key"] != key or record["payload_digest"] != fingerprint(record["payload"]):
                return None
            payload = record["payload"]
            if payload.get("media_type") != kind or not isinstance(payload.get("technical"), dict):
                return None
            names = asset_names(payload)
            if set(names) != set(record["assets"]):
                return None
            for name in names:
                path = checked_path(directory / name)
                if file_hash(path) != record["assets"][name]:
                    return None
                with Image.open(path) as image:
                    image.verify()
            return copy.deepcopy(payload), directory
        except (OSError, ValueError, KeyError, TypeError, AttributeError):
            return None  # Cache is disposable; malformed state is handled separately and fails closed.

    def begin(self, sha, kind):
        directory = private_dir(self.root / "entries" / self.key(sha, kind) / uuid.uuid4().hex)
        private_dir(directory / "assets")
        return directory

    def publish(self, sha, kind, payload, directory):
        payload = {k: v for k, v in payload.items() if k not in PATH_FIELDS}
        names = asset_names(payload)
        key = self.key(sha, kind)
        record = {
            "key": key,
            "profile": self.config,
            "payload": payload,
            "payload_digest": fingerprint(payload),
            "assets": {name: file_hash(directory / name) for name in names},
        }
        atomic_json(directory / "analysis.json", record)
        atomic_json(directory.parent / "current.json", {"generation": directory.name})

    def materialize(self, payload, directory, output):
        for name in asset_names(payload):
            destination = checked_path(output / name)
            if destination.exists():
                continue  # Identical-content occurrences share the same derived assets in this run.
            with checked_path(directory / name).open("rb") as source, destination.open("xb") as target:
                shutil.copyfileobj(source, target)

    def previous_paths(self, source):
        try:
            value = read_json(self.root / "paths.json")
            if not isinstance(value, dict):
                return {}
            paths = value.get(str(source), {})
            if not isinstance(paths, dict) or any(
                not isinstance(k, str) or not isinstance(v, str) for k, v in paths.items()
            ):
                return {}
            return paths
        except (OSError, ValueError):
            return {}

    def checkpoint_path(self, source, relative, sha):
        with locked(self.root / "paths.lock"):
            try:
                data = read_json(self.root / "paths.json")
                if not isinstance(data, dict) or not isinstance(data.get(str(source), {}), dict):
                    data = {}
            except (OSError, ValueError):
                data = {}
            data.setdefault(str(source), {})[relative] = sha
            atomic_json(self.root / "paths.json", data)
