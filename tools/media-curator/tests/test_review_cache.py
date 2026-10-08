import copy
import http.client
import json
import shutil
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlencode

from PIL import Image

from media_curator.cache import AnalysisCache
from media_curator.pipeline import digest, scan
from media_curator.report import render
from media_curator.reviews import ReviewStore, apply_reviews
from media_curator.server import decision_from_form, make_server
from media_curator.storage import read_json

EVENTS = [
    {
        "id": "a",
        "title": "Example Night",
        "slug": "example-night",
        "event_date": "2025-05-09T02:00:00Z",
        "event_timezone": "America/Chicago",
        "venue": "Example Venue",
        "city": "Chicago",
    },
    {
        "id": "b",
        "title": "Other Event",
        "slug": "other-event",
        "event_date": "2025-06-09T02:00:00Z",
        "event_timezone": "America/Chicago",
        "venue": "Other Venue",
        "city": "Chicago",
    },
]
CONFIG = {"analysis_schema": "test-1", "tools": "synthetic-config"}


class ReviewCacheTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / "inbox"
        self.source.mkdir()
        self.workspace = self.root / "workbench"
        self.counter = 0
        self.photo = self.source / "Example-Night-Chicago.jpg"
        self.write_photo(self.photo)

    def tearDown(self):
        self.temp.cleanup()

    def write_photo(self, path, color="#607f9a"):
        tags = Image.Exif()
        tags[34665] = {36867: "2025:05:08 22:31:00", 36881: "-05:00"}
        Image.new("RGB", (800, 600), color).save(path, exif=tags)

    def scan(self, config=None, events=None):
        self.counter += 1
        self.output = self.root / f"run-{self.counter}"
        return scan(
            self.source,
            self.output,
            EVENTS if events is None else events,
            workspace=self.workspace,
            cache_config=CONFIG if config is None else config,
        )

    def save(self, manifest, **fields):
        item = manifest["files"][0]
        decision = {"last_known_relative_path": item["relative_path"]} | fields
        return ReviewStore(self.workspace).save(item["sha256"], decision)

    def test_event_status_and_approval_override_persist_without_destroying_auto(self):
        first = self.scan()
        automatic = copy.deepcopy(first["files"][0]["auto_match"])
        self.save(first, event_id="b", status="HERO", approved=True, note="best shot")
        state = (self.workspace / "state/review.json").read_bytes()
        second = self.scan()
        item = second["files"][0]
        self.assertEqual(item["effective_event_id"], "b")
        self.assertEqual(item["effective_status"], "HERO")
        self.assertTrue(item["effective_approved"])
        self.assertEqual(item["auto_match"], automatic)
        self.assertEqual(item["decision_source"], "HUMAN_OVERRIDDEN")
        self.assertEqual((self.workspace / "state/review.json").read_bytes(), state)
        self.assertEqual(second["counts"]["needing_review"], 0)

    def test_confirmed_event_and_rejected_event(self):
        first = self.scan()
        item = first["files"][0]
        confirmed = self.save(first, event_id="a")
        self.assertEqual(self.scan()["files"][0]["decision_source"], "HUMAN_CONFIRMED")
        ReviewStore(self.workspace).save(item["sha256"], {"rejected_event_ids": ["a"]}, confirmed["revision"])
        next_item = self.scan()["files"][0]
        self.assertIsNone(next_item["effective_event_id"])
        self.assertEqual(next_item["auto_match"]["event_id"], "a")

    def test_explicit_unmatched_survives_new_catalog(self):
        first = self.scan()
        self.save(first, event_id=None, approved=False)
        item = self.scan()["files"][0]
        self.assertIsNone(item["effective_event_id"])
        self.assertFalse(item["effective_approved"])

    def test_moved_identical_file_retains_decision_and_cache(self):
        first = self.scan()
        self.save(first, event_id="b", note="follow this content")
        renamed = self.source / "renamed.jpg"
        self.photo.rename(renamed)
        second = self.scan()
        self.assertEqual(second["files"][0]["human_review"]["note"], "follow this content")
        self.assertEqual(second["files"][0]["relative_path"], "renamed.jpg")
        self.assertEqual(second["files"][0]["source_path"], str(renamed))
        self.assertEqual(second["counts"]["reused"], 1)
        self.assertEqual(second["files"][0]["content_id"], first["files"][0]["content_id"])

    def test_changed_content_is_new_identity(self):
        first = self.scan()
        self.save(first, status="SKIP")
        self.write_photo(self.photo, "#ffeedd")
        second = self.scan()
        self.assertIsNone(second["files"][0]["human_review"])
        self.assertNotEqual(first["files"][0]["content_id"], second["files"][0]["content_id"])
        self.assertEqual(second["counts"]["newly_analyzed"], 1)
        self.assertEqual(second["counts"]["changed"], 1)

    def test_cache_reuse_skips_expensive_extraction_and_review(self):
        self.scan()
        with (
            patch("media_curator.pipeline.extract", side_effect=AssertionError("must reuse")),
            patch("media_curator.pipeline.review", side_effect=AssertionError("must reuse")),
        ):
            second = self.scan()
        self.assertEqual(second["counts"]["reused"], 1)
        self.assertEqual(second["counts"]["newly_analyzed"], 0)
        self.assertTrue((self.output / second["files"][0]["previews"][0]).exists())

    def test_schema_and_tool_config_changes_invalidate(self):
        self.scan()
        for config in (
            {"analysis_schema": "test-2", "tools": "synthetic-config"},
            {"analysis_schema": "test-2", "tools": "changed-ffmpeg"},
        ):
            self.assertEqual(self.scan(config=config)["counts"]["newly_analyzed"], 1)

    def test_catalog_and_window_not_cached_with_analysis(self):
        self.scan()
        changed_events = copy.deepcopy(EVENTS)
        changed_events[0]["event_date"] = "2020-01-01T00:00:00Z"
        second = self.scan(events=changed_events)
        self.assertEqual(second["counts"]["reused"], 1)
        self.assertEqual(second["files"][0]["auto_match"]["confidence"], "NEEDS_REVIEW")

    def test_missing_asset_regenerates(self):
        first = self.scan()
        payload, directory = AnalysisCache(self.workspace, CONFIG).get(first["files"][0]["sha256"], "image")
        (directory / payload["previews"][0]).unlink()
        self.assertEqual(self.scan()["counts"]["newly_analyzed"], 1)

    def test_corrupt_asset_and_cache_record_regenerate(self):
        first = self.scan()
        cache = AnalysisCache(self.workspace, CONFIG)
        payload, directory = cache.get(first["files"][0]["sha256"], "image")
        (directory / payload["previews"][0]).write_bytes(b"bad JPEG")
        second = self.scan()
        self.assertEqual(second["counts"]["newly_analyzed"], 1)
        _, directory = cache.get(second["files"][0]["sha256"], "image")
        (directory / "analysis.json").write_text("{bad json")
        self.assertEqual(self.scan()["counts"]["newly_analyzed"], 1)

    def test_interrupted_scan_resumes_completed_files(self):
        self.write_photo(self.source / "z-second.jpg", "#dddd44")
        from media_curator.analysis import review

        calls = 0

        def interrupted(*args):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError("synthetic interruption")
            return review(*args)

        with patch("media_curator.pipeline.review", side_effect=interrupted):
            with self.assertRaises(RuntimeError):
                self.scan()
        self.assertFalse((self.output / "manifest.json").exists())
        resumed = self.scan()
        self.assertEqual(resumed["counts"]["reused"], 1)
        self.assertEqual(resumed["counts"]["newly_analyzed"], 1)

    def test_original_bytes_and_mtime_unchanged_on_miss_and_hit(self):
        before = (digest(self.photo), self.photo.stat().st_mtime_ns)
        self.scan()
        self.scan()
        self.assertEqual((digest(self.photo), self.photo.stat().st_mtime_ns), before)

    def test_malformed_review_state_fails_closed_without_overwrite(self):
        first = self.scan()
        self.save(first, note="important")
        path = self.workspace / "state/review.json"
        for data in (
            "not json",
            '{"schema_version":99,"reviews":{}}',
            '{"schema_version":1,"reviews":{"bad":{}}}',
        ):
            path.write_text(data)
            with self.assertRaises(ValueError):
                self.scan()
            self.assertEqual(path.read_text(), data)
            self.assertFalse(self.output.exists())

    def test_duplicate_keys_and_bad_review_types_fail_closed(self):
        self.workspace.mkdir()
        state = self.workspace / "state"
        state.mkdir()
        path = state / "review.json"
        path.write_text('{"schema_version":1,"schema_version":1,"reviews":{}}')
        with self.assertRaises(ValueError):
            self.scan()

    def test_identical_copies_share_review_but_remain_labeled(self):
        first = self.scan()
        self.save(first, status="HERO")
        shutil.copyfile(self.photo, self.source / "copy.jpg")
        second = self.scan()
        self.assertTrue(all(i["effective_status"] == "HERO" for i in second["files"]))
        self.assertEqual(sum(bool(i.get("exact_duplicate_of")) for i in second["files"]), 1)
        self.assertEqual(len({i["id"] for i in second["files"]}), 2)

    def test_cache_reset_preserves_review(self):
        first = self.scan()
        self.save(first, status="SOCIAL_CANDIDATE")
        shutil.rmtree(self.workspace / "cache")  # Test-only disposable cache, never product cleanup.
        second = self.scan()
        self.assertEqual(second["counts"]["newly_analyzed"], 1)
        self.assertEqual(second["files"][0]["effective_status"], "SOCIAL_CANDIDATE")

    def test_stale_save_rejected_without_lost_update(self):
        first = self.scan()
        self.save(first, note="first tab")
        with self.assertRaisesRegex(ValueError, "another tab"):
            self.save(first, note="stale tab")
        state = ReviewStore(self.workspace).load()
        self.assertEqual(state["reviews"][first["files"][0]["sha256"]]["note"], "first tab")

    def test_offline_scan_does_not_connect_to_network(self):
        with (
            patch("socket.create_connection", side_effect=AssertionError("no network")),
            patch("urllib.request.OpenerDirector.open", side_effect=AssertionError("no remote request")),
        ):
            self.scan()

    def test_notes_and_names_are_escaped(self):
        self.photo.rename(self.source / "<script>name.jpg")
        first = self.scan()
        self.save(first, note='</textarea><script>alert("x")</script>')
        item = self.scan()
        for token in (None, "synthetic-token"):
            html = render(item, token=token)
            self.assertNotIn("<script>", html)
            self.assertIn("&lt;script&gt;", html)

    def test_workspace_must_be_disjoint_from_source_and_outputs(self):
        for workspace in (self.source / "state", self.root):
            with self.assertRaises(ValueError):
                scan(self.source, self.root / "out", EVENTS, workspace=workspace, cache_config=CONFIG)
        with self.assertRaises(ValueError):
            scan(
                self.source,
                self.workspace / "state" / "run",
                EVENTS,
                workspace=self.workspace,
                cache_config=CONFIG,
            )

    def test_symlinked_state_does_not_write_to_source(self):
        self.workspace.mkdir()
        (self.workspace / "state").symlink_to(self.source, target_is_directory=True)
        before = set(self.source.iterdir())
        with self.assertRaises(ValueError):
            self.scan()
        self.assertEqual(set(self.source.iterdir()), before)

    def test_schema1_adapts_without_rewriting_original(self):
        first = self.scan()
        first["schema_version"] = 1
        for item in first["files"]:
            for key in ("auto_match", "auto_recommendation", "content_id", "human_review"):
                item.pop(key, None)
        path = self.root / "v1.json"
        path.write_text(json.dumps(first))
        before = path.read_bytes()
        adapted = apply_reviews(read_json(path), ReviewStore(self.workspace).load())
        self.assertEqual(adapted["schema_version"], 2)
        self.assertEqual(adapted["files"][0]["auto_match"], first["files"][0]["match"])
        self.assertEqual(path.read_bytes(), before)

    def test_highlight_decisions_and_manual_range(self):
        item = self.scan()["files"][0]
        item.update(
            media_type="video",
            duration=180,
            effective_highlights=[
                {"start_seconds": 10, "end_seconds": 24},
                {"start_seconds": 40, "end_seconds": 54},
            ],
        )
        form = {"action": "save", "range_0": "yes", "range_1": "no", "range_start": "80", "range_end": "95"}
        decision = decision_from_form(item, form, {"a", "b"})
        self.assertEqual([s["approved"] for s in decision["highlights"]], [True, False, True])
        ReviewStore(self.workspace).save(item["sha256"], decision)
        manifest = {"schema_version": 2, "files": [item], "events": EVENTS}
        result = apply_reviews(manifest, ReviewStore(self.workspace).load())
        self.assertEqual(len(result["files"][0]["effective_highlights"]), 3)
        for start, end in [("nan", "20"), ("10", "9"), ("10", "181"), ("10", "")]:
            with self.assertRaises(ValueError):
                decision_from_form(item, form | {"range_start": start, "range_end": end}, {"a", "b"})

    def test_loopback_server_forms_save_and_security_boundaries(self):
        first = self.scan()
        manifest = self.output / "manifest.json"
        before = manifest.read_bytes()
        server = make_server(manifest, self.workspace)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
            connection.request("GET", "/")
            response = connection.getresponse()
            document = response.read().decode()
            self.assertEqual(response.status, 200)
            self.assertEqual(response.getheader("Referrer-Policy"), "same-origin")
            self.assertIn("Confirm suggested event", document)
            import re

            token = re.search(r'name="token" value="([^"]+)"', document).group(1)
            form = {
                "token": token,
                "item_id": first["files"][0]["id"],
                "revision": "0",
                "action": "change_event",
                "event_id": "b",
                "status": "HERO",
                "approved": "yes",
                "note": "local save",
            }
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            with patch("urllib.request.OpenerDirector.open", side_effect=AssertionError("no remote calls")):
                connection.request("POST", "/decision", urlencode(form), headers)
                response = connection.getresponse()
                response.read()
            self.assertEqual(response.status, 303)
            connection.request("GET", "/")
            response = connection.getresponse()
            self.assertIn("HUMAN_OVERRIDDEN", response.read().decode())
            # An old tab must not overwrite the first decision.
            connection.request("POST", "/decision", urlencode(form), headers)
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 409)
            # Cross-origin submission and requests for non-allowlisted files are blocked.
            connection.request(
                "POST", "/decision", urlencode(form), headers | {"Origin": "https://evil.example"}
            )
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 403)
            connection.request("POST", "/decision", urlencode(form | {"token": "wrong"}), headers)
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 403)
            for url in ("/manifest.json", "/../../state/review.json", "/source/" + self.photo.name):
                connection.request("GET", url)
                response = connection.getresponse()
                response.read()
                self.assertEqual(response.status, 404)
            connection.request("GET", "/", headers={"Host": "evil.example"})
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 403)
            connection.close()
            self.assertEqual(manifest.read_bytes(), before)
            state = ReviewStore(self.workspace).load()["reviews"][first["files"][0]["sha256"]]
            self.assertEqual(state["event_id"], "b")
            self.assertEqual(state["status"], "HERO")
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
