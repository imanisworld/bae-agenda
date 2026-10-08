"""Extract provenance without confusing filesystem time with capture time."""

import json
import re
import subprocess
from datetime import datetime, timezone

from PIL import Image

IMAGES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
VIDEOS = {".mp4", ".mov", ".webm"}


def parse_timestamp(value):
    if not value or not isinstance(value, str):
        return None
    value = re.sub(r"^(\d{4}):(\d{2}):(\d{2})", r"\1-\2-\3", value.strip()).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def run(args, timeout=60):
    completed = subprocess.run(args, capture_output=True, timeout=timeout, check=False)
    if completed.returncode:
        # ffmpeg diagnostics may include private metadata; never persist arbitrary tool output.
        raise ValueError(f"{args[0]} could not read this media file.")
    return completed.stdout


def timestamps(candidates):
    parsed = [(source, parse_timestamp(value), reliability) for source, value, reliability in candidates]
    parsed = [(s, d, r) for s, d, r in parsed if d]
    if not parsed:
        return {
            "capture_time": None,
            "timestamp_source": None,
            "timestamp_confidence": "missing",
            "timestamp_candidates": [],
            "timestamp_conflict": False,
        }
    source, chosen, reliability = parsed[0]
    conflict = False
    for _, date, _ in parsed[1:]:
        # Do not compare zoned and unzoned wall clocks as though they were UTC.
        if bool(date.tzinfo) == bool(chosen.tzinfo) and abs((date - chosen).total_seconds()) > 300:
            conflict = True
    return {
        "capture_time": chosen.isoformat(),
        "timestamp_source": source,
        "timestamp_confidence": "conflicting" if conflict else reliability,
        "timestamp_candidates": [
            {"source": s, "value": d.isoformat(), "confidence": r} for s, d, r in parsed
        ],
        "timestamp_conflict": conflict,
    }


def gps_exif(exif):
    try:
        gps = exif.get_ifd(34853)

        def degrees(values):
            return float(values[0]) + float(values[1]) / 60 + float(values[2]) / 3600

        lat, lon = degrees(gps[2]), degrees(gps[4])
        return {
            "latitude": -lat if gps[1] in ("S", b"S") else lat,
            "longitude": -lon if gps[3] in ("W", b"W") else lon,
        }
    except (KeyError, TypeError, ValueError, ZeroDivisionError):
        return None


def filesystem_metadata(path):
    stat = path.stat()
    item = {
        "source_path": str(path),
        "filename": path.name,
        "file_size": stat.st_size,
        "media_type": "video" if path.suffix.lower() in VIDEOS else "image",
        "file_type": path.suffix.lower()[1:],
        "filesystem_mtime": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
        "filesystem_birthtime": datetime.fromtimestamp(stat.st_birthtime, timezone.utc).isoformat()
        if hasattr(stat, "st_birthtime")
        else None,
        "width": None,
        "height": None,
        "orientation": None,
        "rotation": None,
        "codec": None,
        "container": None,
        "duration": None,
        "gps": None,
        "warnings": [],
    }
    return item


def extract(path):
    item = filesystem_metadata(path)
    candidates = []
    try:
        if item["media_type"] == "image":
            with Image.open(path) as im:
                exif = im.getexif()
                tags = dict(exif)
                tags.update(exif.get_ifd(34665))
                for tag, offset, name in (
                    (36867, 36881, "EXIF DateTimeOriginal"),
                    (36868, 36882, "EXIF DateTimeDigitized"),
                ):
                    value = tags.get(tag)
                    if value:
                        candidates.append((name, str(value) + str(tags.get(offset, "")), "high"))
                # EXIF DateTime is modification time, not capture evidence.
                item.update(
                    width=im.width,
                    height=im.height,
                    codec=im.format,
                    container=im.format,
                    exif_orientation=exif.get(274),
                    gps=gps_exif(exif),
                )
                if exif.get(274) in (5, 6, 7, 8):
                    item["width"], item["height"] = im.height, im.width
        else:
            probe = json.loads(
                run(
                    [
                        "ffprobe",
                        "-v",
                        "error",
                        "-protocol_whitelist",
                        "file,pipe",
                        "-show_format",
                        "-show_streams",
                        "-of",
                        "json",
                        str(path),
                    ]
                )
            )
            stream = next(
                (
                    s
                    for s in probe.get("streams", [])
                    if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")
                ),
                None,
            )
            if stream is None:
                raise ValueError("No video stream found.")
            fmt = probe.get("format", {})
            item.update(
                width=stream.get("width"),
                height=stream.get("height"),
                codec=stream.get("codec_name"),
                container=fmt.get("format_name"),
            )
            duration = float(fmt.get("duration") or stream.get("duration") or 0)
            item["duration"] = duration if 0 < duration < 604800 else None
            rotation = next(
                (s.get("rotation") for s in stream.get("side_data_list", []) if "rotation" in s),
                stream.get("tags", {}).get("rotate", 0),
            )
            item["rotation"] = float(rotation)
            if abs(float(rotation)) % 180 == 90:
                item["width"], item["height"] = item["height"], item["width"]
            for scope, tags in [("container", fmt.get("tags", {})), ("stream", stream.get("tags", {}))]:
                for key in ("com.apple.quicktime.creationdate", "creation_time", "date"):
                    if tags.get(key):
                        candidates.append((f"{scope} {key}", tags[key], "medium"))
                loc = tags.get("com.apple.quicktime.location.ISO6709") or tags.get("location")
                match = re.match(r"^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)", loc or "")
                if match:
                    lat, lon = map(float, match.groups())
                    if -90 <= lat <= 90 and -180 <= lon <= 180:
                        item["gps"] = {"latitude": lat, "longitude": lon}
    except (OSError, ValueError, TypeError, subprocess.TimeoutExpired, StopIteration) as exc:
        item["warnings"].append(f"Metadata unavailable ({type(exc).__name__}); review manually.")
    item.update(timestamps(candidates))
    if item["width"] and item["height"]:
        item["orientation"] = (
            "portrait"
            if item["height"] > item["width"]
            else "landscape"
            if item["width"] > item["height"]
            else "square"
        )
    return item
