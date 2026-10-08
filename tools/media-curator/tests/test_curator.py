import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from PIL import Image

from media_curator import catalog
from media_curator.analysis import recommend
from media_curator.cli import main
from media_curator.matching import match, wall_time
from media_curator.metadata import extract, parse_timestamp, timestamps
from media_curator.pipeline import digest, safe_paths, scan
from media_curator.report import render


def event(**changes):
    return {
        "id": "event-a",
        "title": "Chi Chi Night",
        "slug": "chi-chi-night",
        "event_date": "2025-05-09T02:00:00Z",
        "event_timezone": "America/Chicago",
        "venue": "Chi Chi",
        "city": "Chicago",
    } | changes


def media(**changes):
    return {
        "filename": "frame.jpg",
        "relative_path": "frame.jpg",
        "capture_time": "2025-05-08T22:31:00-05:00",
        "timestamp_confidence": "high",
        "timestamp_conflict": False,
        "gps": None,
    } | changes


class MatchingTests(unittest.TestCase):
    def test_timestamp_formats(self):
        self.assertEqual(parse_timestamp("2025:05:08 22:31:00-05:00").hour, 22)
        self.assertEqual(parse_timestamp("2025-05-09T03:31:00Z").utcoffset().total_seconds(), 0)
        self.assertIsNone(parse_timestamp("bad"))
        self.assertIsNone(parse_timestamp("2025:19:44 25:00:00"))

    def test_timezone_crosses_utc_day(self):
        result = match(media(), [event()])
        self.assertEqual(result["confidence"], "LIKELY")
        self.assertEqual(result["score"], 75)

    def test_threshold_high_requires_corroboration(self):
        result = match(media(relative_path="Chicago/Night/Chi/frame.jpg"), [event()])
        self.assertEqual(result["confidence"], "HIGH_CONFIDENCE")
        self.assertEqual(result["score"], 95)

    def test_container_creation_is_not_high_confidence(self):
        result = match(
            media(relative_path="Chicago/Night/Chi/frame.mov", timestamp_confidence="medium"), [event()]
        )
        self.assertEqual(result["confidence"], "LIKELY")

    def test_missing_capture_ignores_filesystem_time(self):
        result = match(media(capture_time=None, filesystem_mtime="2025-05-09T03:31:00Z"), [event()])
        self.assertEqual(result["confidence"], "UNMATCHED")
        self.assertIsNone(result["event_id"])

    def test_text_only_needs_review(self):
        self.assertEqual(
            match(media(capture_time=None, relative_path="Chicago/a.jpg"), [event()])["confidence"],
            "NEEDS_REVIEW",
        )

    def test_conflicts_force_review(self):
        values = timestamps(
            [("original", "2025-05-09T03:31:00Z", "high"), ("digitized", "2025-07-09T03:31:00Z", "high")]
        )
        self.assertTrue(values["timestamp_conflict"])
        self.assertEqual(match(media(**values), [event()])["confidence"], "NEEDS_REVIEW")

    def test_tied_events_need_review_and_stable_order(self):
        a, b = event(), event(id="event-b")
        self.assertEqual(match(media(), [b, a]), match(media(), [a, b]))
        self.assertEqual(match(media(), [a, b])["confidence"], "NEEDS_REVIEW")

    def test_legacy_timezone_never_high(self):
        result = match(media(), [event(event_timezone=None, event_date="2025-05-08T00:00:00Z")])
        self.assertEqual(result["confidence"], "NEEDS_REVIEW")

    def test_dst_missing_and_ambiguous(self):
        zone = ZoneInfo("America/New_York")
        self.assertIsNone(wall_time(parse_timestamp("2025-03-09T02:30:00"), zone))
        self.assertIsNone(wall_time(parse_timestamp("2025-11-02T01:30:00"), zone))
        self.assertIsNotNone(wall_time(parse_timestamp("2025-03-09T03:30:00"), zone))

    def test_naive_camera_caps_confidence(self):
        result = match(
            media(capture_time="2025-05-08T22:31:00", relative_path="Chicago/Night/Chi/a.jpg"), [event()]
        )
        self.assertEqual(result["confidence"], "LIKELY")
        self.assertTrue(any("assumed" in r for r in result["reasons"]))

    def test_gps_conflict(self):
        result = match(media(gps={"latitude": 0, "longitude": 0}), [event(latitude=41.88, longitude=-87.63)])
        self.assertEqual(result["confidence"], "NEEDS_REVIEW")

    def test_far_capture_not_auto_assigned_by_text(self):
        result = match(media(capture_time="2024-01-01T00:00:00Z", relative_path="Chicago/a.jpg"), [event()])
        self.assertEqual(result["confidence"], "NEEDS_REVIEW")


class ScanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / "inbox"
        self.source.mkdir()
        self.output = self.root / "review"

    def tearDown(self):
        self.temp.cleanup()

    def image(self, name="photo.jpg", exif=False):
        path = self.source / name
        im = Image.effect_noise((800, 600), 50).convert("RGB")
        tags = Image.Exif()
        if exif:
            tags[34665] = {36867: "2025:05:08 22:31:00", 36881: "-05:00"}
            tags[274] = 6
        im.save(path, exif=tags)
        return path

    def test_extract_exif_and_rotation(self):
        item = extract(self.image(exif=True))
        self.assertEqual(item["capture_time"], "2025-05-08T22:31:00-05:00")
        self.assertEqual(item["timestamp_source"], "EXIF DateTimeOriginal")
        self.assertEqual(item["orientation"], "portrait")
        self.assertEqual((item["width"], item["height"]), (600, 800))

    def test_scan_exact_duplicates_report_and_source_unchanged(self):
        original = self.image(exif=True)
        duplicate = self.source / "copy.jpg"
        shutil.copyfile(original, duplicate)
        before = {p.name: (digest(p), p.stat().st_mtime_ns, p.stat().st_size) for p in self.source.iterdir()}
        result = scan(self.source, self.output, [event()])
        after = {p.name: (digest(p), p.stat().st_mtime_ns, p.stat().st_size) for p in self.source.iterdir()}
        self.assertEqual(before, after)
        self.assertEqual(sum(i["status"] == "DUPLICATE" for i in result["files"]), 1)
        self.assertTrue(all(i["source_verified_unchanged"] for i in result["files"]))
        self.assertTrue((self.output / "index.html").exists())
        self.assertEqual(json.loads((self.output / "manifest.json").read_text())["schema_version"], 1)
        self.assertTrue(list((self.output / "assets").glob("*.jpg")))

    def test_missing_metadata_and_unsupported(self):
        self.image()
        (self.source / "notes.txt").write_text("ignore")
        result = scan(self.source, self.output, [event()])
        self.assertEqual(result["files"][0]["match"]["confidence"], "UNMATCHED")
        self.assertIsNone(result["files"][0]["capture_time"])
        self.assertEqual(result["ignored"][0]["reason"], "unsupported type")

    def test_corrupt_media_does_not_crash_scan(self):
        (self.source / "bad.heic").write_bytes(b"invalid")
        item = scan(self.source, self.output, [])["files"][0]
        self.assertTrue(item["warnings"])
        self.assertNotIn("technical", item)

    def test_path_overlap_both_directions(self):
        for target in (self.source, self.source / "output", self.root):
            with self.assertRaises(ValueError):
                safe_paths(self.source, target)

    def test_existing_output_never_overwritten(self):
        self.output.mkdir()
        marker = self.output / "manifest.json"
        marker.write_text("keep")
        with self.assertRaises(ValueError):
            scan(self.source, self.output, [])
        self.assertEqual(marker.read_text(), "keep")

    def test_output_symlink_and_source_symlink_rejected(self):
        alias = self.root / "alias"
        alias.symlink_to(self.source, target_is_directory=True)
        for source, out in ((alias, self.output), (self.source, alias / "nested")):
            with self.assertRaises(ValueError):
                safe_paths(source, out)

    def test_symlinks_inside_inbox_skipped(self):
        photo = self.image()
        (self.source / "link.jpg").symlink_to(photo)
        (self.source / "cycle").symlink_to(self.source, target_is_directory=True)
        result = scan(self.source, self.output, [])
        self.assertEqual(len(result["files"]), 1)
        self.assertEqual(len(result["ignored"]), 2)

    def test_static_public_output_rejected(self):
        with self.assertRaises(ValueError):
            safe_paths(self.source, self.root / "public" / "review")

    def test_no_vision_scores_invented(self):
        self.image()
        item = scan(self.source, self.output, [])["files"][0]
        self.assertTrue(all(v is None for v in item["vision"]["scores"].values()))

    def test_html_escaped(self):
        self.image("<script>alert(1)</script>.jpg".replace("/", "_"))
        result = scan(self.source, self.output, [])
        document = render(result)
        self.assertNotIn("<script>", document)
        self.assertIn("&lt;script&gt;", document)

    def test_near_duplicates_labeled_not_deleted(self):
        first = self.image(exif=True)
        with Image.open(first) as im:
            im.save(self.source / "similar.jpg", quality=85, exif=im.getexif())
        result = scan(self.source, self.output, [event()])
        self.assertTrue(any(i.get("near_duplicate_of") for i in result["files"]))
        self.assertEqual(len(list(self.source.iterdir())), 2)

    def test_prerequisite_failure_before_outputs(self):
        (self.source / "video.mp4").write_bytes(b"")
        with patch("media_curator.pipeline.shutil.which", return_value=None):
            with self.assertRaisesRegex(ValueError, "requires ffprobe, ffmpeg"):
                scan(self.source, self.output, [])
        self.assertFalse(self.output.exists())

    def test_source_change_detected(self):
        self.image()
        with patch("media_curator.pipeline.digest", side_effect=["before", "after"]):
            with self.assertRaisesRegex(ValueError, "source changed"):
                scan(self.source, self.output, [])
        self.assertFalse((self.output / "manifest.json").exists())

    def test_cli_offline(self):
        self.image()
        with patch("sys.stdout", new_callable=io.StringIO), patch("sys.stderr", new_callable=io.StringIO):
            self.assertEqual(main(["scan", str(self.source), "--output", str(self.output)]), 0)

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
    def test_synthetic_long_video_contact_sheet_and_highlights(self):
        path = self.source / "synthetic.mp4"
        subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=160x120:rate=2:duration=180",
                "-c:v",
                "mpeg4",
                "-metadata",
                "creation_time=2025-05-09T03:31:00Z",
                str(path),
            ],
            check=True,
        )
        before = digest(path)
        item = scan(self.source, self.output, [event()])["files"][0]
        self.assertEqual(digest(path), before)
        self.assertEqual(item["duration"], 180)
        self.assertEqual(item["match"]["confidence"], "LIKELY")
        self.assertTrue((self.output / item["contact_sheet"]).exists())
        self.assertEqual(len(item["samples"]), 6)
        self.assertGreater(len(item["highlights"]), 0)
        for candidate in item["highlights"]:
            self.assertTrue(0 <= candidate["start_seconds"] < candidate["end_seconds"] <= 180)


class CatalogTests(unittest.TestCase):
    def test_validation(self):
        for bad in ({}, [{}], [event(), event()], [event(latitude=float("nan"))]):
            with self.assertRaises(ValueError):
                catalog.validate(bad)

    def test_get_only_pagination_with_server_page_cap(self):
        requests = []

        class Opener:
            def open(self, request, timeout):
                requests.append(request)
                batches = [[event()], [event(id="event-b")], []]
                return io.BytesIO(json.dumps(batches[len(requests) - 1]).encode())

        env = {
            "NEXT_PUBLIC_SUPABASE_URL": "https://example.supabase.co",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY": "synthetic-public-key",
        }
        with patch.dict(os.environ, env), patch("media_curator.catalog.build_opener", return_value=Opener()):
            self.assertEqual(len(catalog.load(remote=True)), 2)
        self.assertTrue(all(req.get_method() == "GET" for req in requests))
        self.assertIn("offset=1", requests[1].full_url)
        self.assertNotIn("booking_id", requests[0].full_url)

    def test_redirect_disallowed(self):
        with self.assertRaises(ValueError):
            catalog.NoRedirect().redirect_request(None, None, 302, "", {}, "https://elsewhere.test")

    def test_recommendations_deterministic(self):
        items = [
            media(
                id="a",
                media_type="image",
                orientation="landscape",
                technical={"overall": 90},
                match={"event_id": "a", "confidence": "LIKELY"},
            )
        ]
        recommend(items)
        expected = json.dumps(items, sort_keys=True)
        recommend(items)
        self.assertEqual(json.dumps(items, sort_keys=True), expected)


if __name__ == "__main__":
    unittest.main()
