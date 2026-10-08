"""Minimal event catalog; the only remote operation is a paginated HTTP GET."""

import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

FIELDS = ("id", "title", "slug", "event_date", "event_timezone", "venue", "city")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Event catalog redirects are disabled to protect credentials.")


def validate(rows):
    if not isinstance(rows, list):
        raise ValueError("Event catalog must be a JSON array.")
    result, ids = [], set()
    for row in rows:
        if not isinstance(row, dict) or not all(
            isinstance(row.get(k), str) and row[k] for k in ("id", "title", "event_date")
        ):
            raise ValueError("Each event needs string id, title, and event_date fields.")
        if row["id"] in ids:
            raise ValueError("Duplicate event id in catalog.")
        ids.add(row["id"])
        event = {k: row.get(k) for k in FIELDS}
        if any(v is not None and not isinstance(v, str) for v in event.values()):
            raise ValueError("Event fields must be strings or null.")
        # Optional local enrichment only; these are not columns in the current events table.
        for key in ("latitude", "longitude", "duration_hours"):
            if key in row:
                value = row[key]
                bounds = {"latitude": (-90, 90), "longitude": (-180, 180), "duration_hours": (0.1, 48)}
                low, high = bounds[key]
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not low <= value <= high:
                    raise ValueError(f"Invalid local event enrichment: {key}")
                event[key] = value
        result.append(event)
    return sorted(result, key=lambda e: e["id"])


def load(path=None, remote=False):
    if path:
        return validate(json.loads(Path(path).read_text(encoding="utf-8")))
    if not remote:
        return []
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname or parts.username or parts.query or parts.fragment:
        raise ValueError("Set NEXT_PUBLIC_SUPABASE_URL to an HTTPS Supabase URL.")
    if not key:
        raise ValueError("Set NEXT_PUBLIC_SUPABASE_ANON_KEY for read-only public event lookup.")
    # No service-role key, no automatic .env loading, no booking/contact columns.
    opener, rows, offset = build_opener(NoRedirect), [], 0
    while True:
        query = urlencode(
            {
                "select": ",".join(FIELDS),
                "public": "eq.true",
                "order": "id.asc",
                "offset": offset,
                "limit": 500,
            }
        )
        req = Request(
            f"{url}/rest/v1/events?{query}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            method="GET",
        )
        try:
            with opener.open(req, timeout=30) as response:
                batch = json.load(response)
        except (HTTPError, URLError):
            raise ValueError(
                "Read-only event lookup failed; check URL, public key, and connectivity."
            ) from None
        batch = validate(batch)
        if not batch:
            break
        if {r["id"] for r in batch} & {r["id"] for r in rows}:
            raise ValueError("Event catalog changed during pagination; retry for a consistent catalog.")
        rows.extend(batch)
        offset += len(batch)  # Continue even when server caps a page below the requested limit.
    return validate(rows)
