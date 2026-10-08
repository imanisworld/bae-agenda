"""Human decisions are content-addressed and never written by automatic analysis."""

import copy
import math
import re
from datetime import datetime, timezone

from .metadata import parse_timestamp
from .storage import atomic_json, checked_path, locked, read_json

STATUSES = ("HERO", "GALLERY", "SOCIAL_CANDIDATE", "MAYBE", "SKIP", "DUPLICATE")
HASH = re.compile(r"^[a-f0-9]{64}$")
FIELDS = {
    "event_id",
    "rejected_event_ids",
    "status",
    "approved",
    "note",
    "highlights",
    "updated_at",
    "last_known_relative_path",
    "revision",
}


def validate_review(review):
    if not isinstance(review, dict) or set(review) - FIELDS:
        raise ValueError("Malformed review decision or unknown fields; state was not changed.")
    for field in ("event_id", "status"):
        if field in review and review[field] is not None and not isinstance(review[field], str):
            raise ValueError(f"Invalid review {field}.")
    if "event_id" in review and review["event_id"] == "":
        raise ValueError("Use null for an explicitly unmatched decision.")
    if review.get("status") is not None and review["status"] not in STATUSES:
        raise ValueError("Invalid review status.")
    if review.get("approved") is not None and type(review["approved"]) is not bool:
        raise ValueError("Review approval must be true, false, or null.")
    rejected = review.get("rejected_event_ids", [])
    if not isinstance(rejected, list) or any(not isinstance(v, str) or not v for v in rejected):
        raise ValueError("Rejected event IDs must be nonempty strings.")
    for field in ("note", "last_known_relative_path"):
        if field in review and not isinstance(review[field], str):
            raise ValueError(f"Invalid review {field}.")
    if len(review.get("note", "")) > 10000:
        raise ValueError("Notes may contain at most 10000 characters.")
    stamp = parse_timestamp(review.get("updated_at"))
    if not stamp or not stamp.tzinfo:
        raise ValueError("Review timestamp must include an offset.")
    if type(review.get("revision")) is not int or review["revision"] < 1:
        raise ValueError("Invalid review revision.")
    highlights = review.get("highlights", [])
    if not isinstance(highlights, list) or len(highlights) > 200:
        raise ValueError("Invalid review highlight list.")
    for segment in highlights:
        if not isinstance(segment, dict) or set(segment) != {"start_seconds", "end_seconds", "approved"}:
            raise ValueError("Invalid reviewed highlight.")
        start, end = segment["start_seconds"], segment["end_seconds"]
        if (
            any(type(v) not in (int, float) or not math.isfinite(v) for v in (start, end))
            or not 0 <= start < end
        ):
            raise ValueError("Highlight ranges require finite 0 <= start < end.")
        if segment["approved"] is not None and type(segment["approved"]) is not bool:
            raise ValueError("Highlight approval must be true, false, or null.")
    return review


class ReviewStore:
    def __init__(self, workspace):
        self.path = checked_path(workspace / "state" / "review.json")
        self.lock = workspace / "state" / "review.lock"

    def load(self):
        if not self.path.exists():
            return {"schema_version": 1, "reviews": {}}
        data = read_json(self.path)
        if (
            not isinstance(data, dict)
            or set(data) != {"schema_version", "reviews"}
            or data["schema_version"] != 1
        ):
            raise ValueError(
                "Unsupported or malformed review state; preserve it and repair/restore manually."
            )
        if not isinstance(data["reviews"], dict):
            raise ValueError("Malformed reviews map; state was not changed.")
        for sha, review in data["reviews"].items():
            if not HASH.fullmatch(sha):
                raise ValueError("Review identity must be a complete SHA-256.")
            validate_review(review)
        return data

    def save(self, sha, decision, expected_revision=0):
        if not HASH.fullmatch(sha):
            raise ValueError("Review identity must be a complete SHA-256.")
        with locked(self.lock):
            data = self.load()
            current = data["reviews"].get(sha, {})
            if current.get("revision", 0) != expected_revision:
                raise ValueError("This item was reviewed in another tab. Reload before saving.")
            decision = copy.deepcopy(decision)
            decision["revision"] = expected_revision + 1
            decision["updated_at"] = datetime.now(timezone.utc).isoformat()
            validate_review(decision)
            data["reviews"][sha] = decision
            atomic_json(self.path, data)
        return decision


def adapt_manifest(manifest):
    """Version 1 stays on disk unchanged. Only trusted local scan manifests are supported."""
    if not isinstance(manifest, dict) or manifest.get("schema_version") not in (1, 2):
        raise ValueError("Review supports manifest schema_version 1 or 2.")
    result = copy.deepcopy(manifest)
    if not isinstance(result.get("files"), list) or not isinstance(result.get("events"), list):
        raise ValueError("Invalid manifest files/events.")
    for item in result["files"]:
        if not isinstance(item, dict) or not HASH.fullmatch(item.get("sha256", "")):
            raise ValueError("Manifest item is missing its content SHA-256.")
        item["content_id"] = item["sha256"]
        item.setdefault("auto_match", copy.deepcopy(item["match"]))
        item.setdefault("auto_recommendation", item["status"])
    result["schema_version"] = 2
    return result


def apply_reviews(manifest, state):
    result = adapt_manifest(manifest)
    known = {event["id"] for event in result["events"]}
    for item in result["files"]:
        review = copy.deepcopy(state["reviews"].get(item["sha256"]))
        auto = item["auto_match"]
        effective = auto["event_id"]
        if review:
            if "event_id" in review:
                effective = review["event_id"]
            elif effective in review.get("rejected_event_ids", []):
                effective = None
        status = (review or {}).get("status") or item["auto_recommendation"]
        item.update(
            human_review=review,
            effective_event_id=effective,
            effective_status=status,
            effective_approved=(review or {}).get("approved"),
        )
        changed = effective != auto["event_id"] or status != item["auto_recommendation"]
        item["decision_source"] = ("HUMAN_OVERRIDDEN" if changed else "HUMAN_CONFIRMED") if review else "AUTO"
        item["review_warnings"] = []
        if effective and effective not in known:
            item["review_warnings"].append(
                "Human event assignment is absent from this catalog; retained, not replaced."
            )
        item["effective_highlights"] = copy.deepcopy(item.get("highlights", []))
        for segment in item["effective_highlights"]:
            segment["approved"] = None
        for manual in (review or {}).get("highlights", []):
            if item.get("duration") is None or manual["end_seconds"] > item["duration"]:
                item["review_warnings"].append(
                    "Saved highlight is outside the current duration; review state retained."
                )
                continue
            existing = next(
                (
                    s
                    for s in item["effective_highlights"]
                    if (s["start_seconds"], s["end_seconds"])
                    == (manual["start_seconds"], manual["end_seconds"])
                ),
                None,
            )
            if existing:
                existing["approved"] = manual["approved"]
            else:
                item["effective_highlights"].append(copy.deepcopy(manual) | {"reason": "Human-added range."})
    return result
