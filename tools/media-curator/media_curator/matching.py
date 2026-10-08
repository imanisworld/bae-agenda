"""Deterministic evidence scores; scores are not calibrated probabilities."""

import math
import re
from datetime import timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .metadata import parse_timestamp


def tokens(text):
    return {s for s in re.findall(r"[\w]+", text.casefold()) if len(s) > 2 and not s.isdigit()}


def distance(a, b):
    lat1, lat2 = map(math.radians, (a["latitude"], b["latitude"]))
    dlat = lat2 - lat1
    dlon = math.radians(b["longitude"] - a["longitude"])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def wall_time(value, zone):
    """Reject nonexistent or ambiguous local timestamps at daylight-saving transitions."""
    candidates = [value.replace(tzinfo=zone, fold=fold) for fold in (0, 1)]
    valid = [
        d for d in candidates if d.astimezone(timezone.utc).astimezone(zone).replace(tzinfo=None) == value
    ]
    if not valid or len({d.utcoffset() for d in valid}) != 1:
        return None
    return valid[0]


def match(item, events, window_hours=6):
    capture = parse_timestamp(item.get("capture_time"))
    hints = tokens(item.get("relative_path", item["filename"]))
    ranked = []
    for event in events:
        reasons, score, strong, uncertain = [], 0, False, bool(item.get("timestamp_conflict"))
        start = parse_timestamp(event["event_date"])
        zone = None
        try:
            zone = ZoneInfo(event.get("event_timezone") or "")
        except (ZoneInfoNotFoundError, ValueError):
            pass
        if capture and start and zone and start.tzinfo:
            localized = capture if capture.tzinfo else wall_time(capture, zone)
            if localized is None:
                uncertain = True
                reasons.append("Capture wall clock is ambiguous/nonexistent at a daylight-saving transition.")
            else:
                delta = (
                    localized.astimezone(timezone.utc) - start.astimezone(timezone.utc)
                ).total_seconds() / 3600
                duration = event.get("duration_hours", window_hours)
                if -1 <= delta <= duration:
                    score += 75
                    strong = True
                    reasons.append(
                        f"Captured {localized.isoformat()}; within event window (-1h / +{duration:g}h)."
                    )
                    if "duration_hours" not in event:
                        reasons.append("Event end is absent in current schema; window is assumed.")
                    if not capture.tzinfo:
                        uncertain = True
                        reasons.append("Camera has no UTC offset; event timezone assumed.")
                elif abs(delta) <= 24:
                    score += 25
                    reasons.append("Capture is within 24 hours, outside the assumed event window.")
        elif capture and start and capture.date() == start.date():
            score += 35
            uncertain = True
            reasons.append(
                "Calendar date agrees, but event timezone/start is unreviewed; date-only evidence."
            )
        clue = hints & tokens(" ".join(event.get(k) or "" for k in ("title", "slug", "venue", "city")))
        if clue:
            score += min(20, len(clue) * 7)
            reasons.append("Filename/folder clues: " + ", ".join(sorted(clue)))
        if item.get("gps") and "latitude" in event and "longitude" in event:
            km = distance(item["gps"], event)
            if km <= 3:
                score += 15
                reasons.append(f"GPS is {km:.1f} km from locally supplied event coordinates.")
            elif km > 50:
                score -= 40
                uncertain = True
                reasons.append(f"GPS conflicts: {km:.0f} km from locally supplied event coordinates.")
        if item.get("timestamp_conflict"):
            reasons.append("Embedded timestamps conflict; manual review required.")
        if not capture:
            reasons.append("No original capture timestamp; filesystem time is not used for matching.")
        if score > 0:
            ranked.append(
                {
                    "event_id": event["id"],
                    "score": min(100, score),
                    "reasons": reasons,
                    "strong": strong,
                    "uncertain": uncertain,
                }
            )
    ranked.sort(key=lambda r: (-r["score"], r["event_id"]))
    if not ranked:
        return {
            "event_id": None,
            "confidence": "UNMATCHED",
            "score": 0,
            "reasons": ["No supported event evidence; filesystem timestamps are not capture dates."],
            "alternatives": [],
        }
    best = ranked[0]
    ambiguous = len(ranked) > 1 and best["score"] - ranked[1]["score"] < 15
    confidence = "NEEDS_REVIEW"
    if best["strong"] and not ambiguous and not item.get("timestamp_conflict"):
        if best["score"] >= 90 and not best["uncertain"] and item["timestamp_confidence"] == "high":
            confidence = "HIGH_CONFIDENCE"
        elif best["score"] >= 70 and not any("GPS conflicts" in r for r in best["reasons"]):
            confidence = "LIKELY"
    if ambiguous:
        best["reasons"].append("Another event scores within 15 points; assignment is only a suggestion.")
    return {k: best[k] for k in ("event_id", "score", "reasons")} | {
        "confidence": confidence,
        "alternatives": [{k: row[k] for k in ("event_id", "score", "reasons")} for row in ranked[1:4]],
    }
