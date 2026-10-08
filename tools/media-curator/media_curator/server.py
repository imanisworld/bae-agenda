"""Foreground loopback-only review. No network clients, database code, or source file endpoints."""

import copy
import hmac
import math
import re
import secrets
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlsplit

from .report import render
from .reviews import STATUSES, ReviewStore, adapt_manifest, apply_reviews
from .storage import checked_path, initialize, read_json, workspace_path

ASSET_PATH = re.compile(r"^assets/[a-fA-F0-9-]+(?:sheet)?\.jpg$")


def decision_from_form(item, form, event_ids):
    prior = item.get("human_review") or {}
    decision = copy.deepcopy(prior)
    decision["last_known_relative_path"] = item["relative_path"]
    decision.pop("revision", None)
    decision.pop("updated_at", None)
    action = form.get("action", "save")
    if action not in {
        "save",
        "confirm_event",
        "change_event",
        "unmatched",
        "reject_event",
        "auto_event",
        "approve",
        "reject",
    }:
        raise ValueError("Unknown review action.")
    automatic = item["auto_match"]["event_id"]
    if action == "confirm_event":
        if not automatic:
            raise ValueError("There is no suggested event to confirm.")
        decision["event_id"] = automatic
    elif action == "change_event":
        chosen = form.get("event_id")
        if chosen not in event_ids:
            raise ValueError("Choose an event from this report catalog.")
        decision["event_id"] = chosen
    elif action == "unmatched":
        decision["event_id"] = None
    elif action == "reject_event":
        if not automatic:
            raise ValueError("There is no suggested event to reject.")
        decision["rejected_event_ids"] = sorted(set(decision.get("rejected_event_ids", [])) | {automatic})
        if decision.get("event_id") == automatic:
            decision.pop("event_id")
    elif action == "auto_event":
        decision.pop("event_id", None)
        decision.pop("rejected_event_ids", None)
    if decision.get("event_id"):
        decision["rejected_event_ids"] = [
            eid for eid in decision.get("rejected_event_ids", []) if eid != decision["event_id"]
        ]
    status = form.get("status", "")
    if status and status not in STATUSES:
        raise ValueError("Unknown selection status.")
    decision["status"] = status or None
    approval = form.get("approved", "pending")
    if approval not in {"pending", "yes", "no"}:
        raise ValueError("Invalid approval.")
    decision["approved"] = {"pending": None, "yes": True, "no": False}[approval]
    if action in {"approve", "reject"}:
        decision["approved"] = action == "approve"
    decision["note"] = form.get("note", "")
    segments = {(s["start_seconds"], s["end_seconds"]): copy.deepcopy(s) for s in prior.get("highlights", [])}
    for index, segment in enumerate(item.get("effective_highlights", [])):
        approval = form.get(f"range_{index}", "pending")
        if approval not in {"pending", "yes", "no"}:
            raise ValueError("Invalid highlight approval.")
        start, end = segment["start_seconds"], segment["end_seconds"]
        segments[(start, end)] = {
            "start_seconds": start,
            "end_seconds": end,
            "approved": {"pending": None, "yes": True, "no": False}[approval],
        }
    start, end = form.get("range_start", ""), form.get("range_end", "")
    if start or end:
        if item["media_type"] != "video" or not item.get("duration"):
            raise ValueError("Manual highlights require a video with a known duration.")
        try:
            start, end = float(start), float(end)
        except ValueError:
            raise ValueError("Supply both manual range endpoints in seconds.") from None
        if not all(math.isfinite(v) for v in (start, end)) or not 0 <= start < end <= item["duration"]:
            raise ValueError("Manual range must satisfy 0 <= start < end <= video duration.")
        segments[(start, end)] = {"start_seconds": start, "end_seconds": end, "approved": True}
    decision["highlights"] = [segments[key] for key in sorted(segments)]
    return decision


def make_server(manifest_path, workspace=None, port=0):
    manifest_path = checked_path(manifest_path)
    base = adapt_manifest(read_json(manifest_path))
    source = checked_path(base["source"])
    workspace = workspace_path(
        workspace or base.get("workspace") or ".media-curator", source, manifest_path.parent
    )
    store = ReviewStore(workspace)
    store.load()  # Fail closed before binding the port if human state is malformed.
    initialize(workspace)
    assets = {}
    for item in base["files"]:
        names = item.get("previews", []) + ([item["contact_sheet"]] if item.get("contact_sheet") else [])
        for name in names:
            if not isinstance(name, str) or not ASSET_PATH.fullmatch(name):
                raise ValueError("Manifest contains an unsafe derived-asset path.")
            path = checked_path(manifest_path.parent / name)
            if source == path or source in path.parents:
                raise ValueError("The review server cannot serve source files.")
            assets["/" + name] = path
    token = secrets.token_urlsafe(32)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Avoid logging filenames, notes, or session tokens.

        def headers_ok(self):
            host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host") != host:
                self.send_error(403, "Invalid local Host header")
                return False
            origin = self.headers.get("Origin")
            if origin and origin != f"http://{host}":
                self.send_error(403, "Cross-origin access denied")
                return False
            return True

        def respond(self, status, data, content_type="text/html; charset=utf-8"):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "same-origin")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; "
                "form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
            )
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if not self.headers_ok():
                return
            path = urlsplit(self.path).path
            try:
                if path == "/":
                    current = apply_reviews(base, store.load())
                    message = "Saved locally." if self.path == "/?saved=1" else ""
                    self.respond(200, render(current, token=token, message=message).encode())
                elif path in assets:
                    self.respond(200, checked_path(assets[path]).read_bytes(), "image/jpeg")
                else:
                    self.send_error(404)
            except (OSError, ValueError):
                self.respond(
                    409, b"Local review data is unavailable or malformed. No state was changed.", "text/plain"
                )

        def do_POST(self):
            if not self.headers_ok():
                return
            if self.path != "/decision":
                self.send_error(404)
                return
            if self.headers.get("Content-Type", "").split(";")[0] != "application/x-www-form-urlencoded":
                self.send_error(415)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 65536:
                    raise ValueError("Review form is too large or empty.")
                values = parse_qs(
                    self.rfile.read(length).decode("utf-8"),
                    keep_blank_values=True,
                    strict_parsing=True,
                    max_num_fields=250,
                )
                if any(len(v) != 1 for v in values.values()):
                    raise ValueError("Duplicate form fields.")
                form = {k: v[0] for k, v in values.items()}
                if not hmac.compare_digest(form.get("token", ""), token):
                    self.send_error(403, "Invalid review session token")
                    return
                current = apply_reviews(base, store.load())
                item = next((i for i in current["files"] if i["id"] == form.get("item_id")), None)
                if item is None:
                    raise ValueError("Unknown media item.")
                revision = int(form.get("revision", "-1"))
                # Check before mapping ranges, whose indices depend on the displayed revision.
                if revision != (item.get("human_review") or {}).get("revision", 0):
                    raise ValueError("Review changed in another tab. Reload before saving.")
                decision = decision_from_form(item, form, {e["id"] for e in base["events"]})
                store.save(item["sha256"], decision, expected_revision=revision)
                self.send_response(303)
                self.send_header("Location", "/?saved=1#item-" + item["id"])
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", "0")
                self.end_headers()
            except (OSError, ValueError, UnicodeError) as error:
                # Text-only response: user filenames/notes cannot become markup in validation errors.
                self.respond(
                    409,
                    (str(error) + "\nReturn to the report and reload.").encode(),
                    "text/plain; charset=utf-8",
                )

    server = HTTPServer(("127.0.0.1", port), Handler)
    server.timeout = 1
    return server


def serve(manifest_path, workspace=None, port=0):
    with make_server(manifest_path, workspace, port) as server:
        print(f"Local review: http://127.0.0.1:{server.server_port}/ — Ctrl-C to stop.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
