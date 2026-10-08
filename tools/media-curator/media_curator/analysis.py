"""Bounded local previews and technical signals, separate from future vision judgments."""

import io
import math
from typing import Protocol

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps, ImageStat

from .metadata import run

CATEGORIES = (
    "dj_visible",
    "active_crowd",
    "dancing",
    "crowd_reaction",
    "venue_establishing",
    "close_up_detail",
    "performance_mixing",
    "social_format",
)


class VisionAdapter(Protocol):
    def analyze(self, preview_paths: list[str]) -> dict[str, float | None]:
        """Return independently judged categories in [0, 1]; no default network provider."""
        ...


def clock(seconds):
    seconds = max(0, int(seconds))
    return f"{seconds // 3600:02d}:{seconds // 60 % 60:02d}:{seconds % 60:02d}"


def signature(im):
    gray = im.convert("L").resize((9, 8))
    pixels = list(gray.tobytes())
    return sum((pixels[y * 9 + x] > pixels[y * 9 + x + 1]) << (y * 8 + x) for y in range(8) for x in range(8))


def metrics(im):
    gray = im.convert("L").resize((160, 160))
    histogram = gray.histogram()
    clipped = (sum(histogram[:12]) + sum(histogram[244:])) / (160 * 160)
    # Edge strength is only a heuristic; intentional bokeh/night lighting may score poorly.
    edge = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES).crop((2, 2, 158, 158))).mean[0]
    return {"exposure": round(100 * (1 - clipped), 1), "sharpness": round(min(100, edge * 5), 1)}


def review(item, path, assets):
    frames, samples = [], []
    if item["media_type"] == "image":
        with Image.open(path) as original:
            im = ImageOps.exif_transpose(original).convert("RGB")
            im.thumbnail((960, 960))
            frames.append(im.copy())
    else:
        duration = item.get("duration")
        if not duration or not math.isfinite(duration):
            raise ValueError("A usable duration is required for video previews.")
        count = min(24, max(3, math.ceil(duration / 30)))
        for index in range(count):
            second = duration * (index + 0.5) / count
            data = run(
                [
                    "ffmpeg",
                    "-nostdin",
                    "-v",
                    "error",
                    "-protocol_whitelist",
                    "file,pipe",
                    "-ss",
                    f"{second:.3f}",
                    "-i",
                    str(path),
                    "-map",
                    "0:v:0",
                    "-frames:v",
                    "1",
                    "-vf",
                    "scale=480:480:force_original_aspect_ratio=decrease",
                    "-f",
                    "image2pipe",
                    "-vcodec",
                    "mjpeg",
                    "pipe:1",
                ],
                timeout=45,
            )
            with Image.open(io.BytesIO(data)) as frame:
                frames.append(frame.convert("RGB").copy())
            samples.append({"seconds": round(second, 3), "timestamp": clock(second)})
    scores = [metrics(frame) for frame in frames]
    width, height = item.get("width") or 0, item.get("height") or 0
    resolution = min(100, width * height / (1920 * 1080) * 100)
    technical = {
        "resolution": round(resolution, 1),
        "exposure": round(sum(s["exposure"] for s in scores) / len(scores), 1),
        "sharpness": round(sum(s["sharpness"] for s in scores) / len(scores), 1),
        "shake": None,
        "audio_energy": None,
    }
    technical["overall"] = round(
        0.4 * resolution + 0.3 * technical["exposure"] + 0.3 * technical["sharpness"], 1
    )
    previews = []
    for index, frame in enumerate(frames):
        name = f"{item['id']}-{index:02d}.jpg"
        with (assets / name).open("xb") as out:
            frame.save(out, "JPEG", quality=75)
        previews.append(f"assets/{name}")
    sheet = None
    changes, highlights = [], []
    if samples:
        sheet_name = f"{item['id']}-sheet.jpg"
        sheet = Image.new("RGB", (960, math.ceil(len(frames) / 3) * 204), "#171923")
        draw = ImageDraw.Draw(sheet)
        for index, frame in enumerate(frames):
            tile = ImageOps.contain(frame, (312, 176))
            x, y = index % 3 * 320, index // 3 * 204
            sheet.paste(tile, (x, y))
            draw.text((x + 4, y + 180), samples[index]["timestamp"], fill="white")
            if index:
                before = frames[index - 1].convert("L").resize((32, 32))
                after = frame.convert("L").resize((32, 32))
                change = ImageStat.Stat(ImageChops.difference(before, after)).mean[0] / 255
                if change >= 0.12:
                    changes.append(
                        {
                            "from_seconds": samples[index - 1]["seconds"],
                            "to_seconds": samples[index]["seconds"],
                            "signal": round(change, 3),
                            "reason": "Sampled visual change; may be a scene transition or camera motion.",
                        }
                    )
        with (assets / sheet_name).open("xb") as out:
            sheet.save(out, "JPEG", quality=75)
        sheet = f"assets/{sheet_name}"
        # Rank candidates by sampled change + frame quality; sparse samples cannot locate exact cuts.
        candidates = []
        for index, sample in enumerate(samples):
            change = next((c["signal"] for c in changes if c["to_seconds"] == sample["seconds"]), 0)
            rank = scores[index]["sharpness"] * 0.4 + scores[index]["exposure"] * 0.3 + change * 30
            candidates.append((rank, sample["seconds"]))
        for rank, second in sorted(candidates, key=lambda c: (-c[0], c[1])):
            start = max(0, min(second - 7, item["duration"] - 14))
            end = min(item["duration"], start + 14)
            if any(start < h["end_seconds"] and end > h["start_seconds"] for h in highlights):
                continue
            highlights.append(
                {
                    "start_seconds": round(start, 3),
                    "end_seconds": round(end, 3),
                    "range": f"{clock(start)}–{clock(end)}",
                    "score": round(rank, 1),
                    "reason": "Technical candidate from sampled exposure, edges, and visual change; "
                    "watch before approving. No audio or content judgment.",
                }
            )
            if len(highlights) == 3:
                break
        highlights.sort(key=lambda h: h["start_seconds"])
    return {
        "previews": previews,
        "contact_sheet": sheet,
        "samples": samples,
        "sampled_scene_changes": changes,
        "highlights": highlights,
        "technical": technical,
        "perceptual_hash": f"{signature(frames[0]):016x}" if item["media_type"] == "image" else None,
        "vision": {"provider": None, "scores": dict.fromkeys(CATEGORIES)},
    }


def recommend(items):
    """Select technically usable representatives per suggested event; never infer content."""
    selected, hashes, kinds = {}, {}, {}
    ordered = sorted(items, key=lambda i: (-i.get("technical", {}).get("overall", 0), i["relative_path"]))
    for item in ordered:
        event = item["match"]["event_id"]
        item["status"], item["selection_reasons"] = "MAYBE", []
        if item.get("exact_duplicate_of"):
            item["status"] = "DUPLICATE"
            item["selection_reasons"] = ["Exact SHA-256 duplicate; original retained."]
            continue
        fingerprint = item.get("perceptual_hash")
        near = (
            next(
                (
                    prior
                    for prior in hashes.get(event, [])
                    if (int(fingerprint, 16) ^ int(prior["perceptual_hash"], 16)).bit_count() <= 5
                ),
                None,
            )
            if fingerprint
            else None
        )
        if fingerprint:
            hashes.setdefault(event, []).append(item)
        if near:
            item["near_duplicate_of"] = near["id"]
            item["selection_reasons"] = ["Possible visual duplicate (dHash ≤5 bits); manually compare."]
            continue
        quality = item.get("technical", {}).get("overall")
        if quality is None or quality < 25:
            item["status"] = "SKIP" if quality is not None else "MAYBE"
            item["selection_reasons"] = ["Low technical score or unreadable media; original retained."]
            continue
        if item["match"]["confidence"] in ("UNMATCHED", "NEEDS_REVIEW"):
            item["selection_reasons"] = ["Resolve event assignment before selecting."]
            continue
        count = selected.get(event, 0)
        kind = (item["media_type"], item["orientation"])
        repeats = kinds.get((event, kind), 0)
        if count < 6 and repeats < 3:
            item["status"] = (
                "HERO"
                if count == 0
                else (
                    "SOCIAL_CANDIDATE"
                    if item["orientation"] == "portrait" and item["media_type"] == "video"
                    else "GALLERY"
                )
            )
            selected[event] = count + 1
            kinds[(event, kind)] = repeats + 1
            item["selection_reasons"] = [
                f"Technical score {quality}/100; distinct visual representative.",
                "Balances media type/orientation; content categories are unscored.",
                "Provisional recommendation only; no publishing approval implied.",
            ]
        else:
            item["selection_reasons"] = ["Gallery/type quota reached; available as an alternate."]
