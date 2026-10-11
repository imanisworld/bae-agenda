import shutil
import subprocess
import unittest
import uuid
from pathlib import Path

from media_curator.pipeline import scan
from media_curator.reviews import ReviewStore

from media_curator_hyperframes.bridge import list_candidates, scaffold


def event():
    return {
        "id": "event-a",
        "title": "Example Night",
        "slug": "example-night",
        "event_date": "2025-05-09T02:00:00Z",
        "event_timezone": "America/Chicago",
        "venue": "Example Venue",
        "city": "Chicago",
    }


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
class BridgeIntegrationTests(unittest.TestCase):
    def setUp(self):
        root = Path(__file__).resolve().parents[1] / ".scratch" / f"test-{uuid.uuid4().hex}"
        root.mkdir(parents=True, exist_ok=True)
        self.root = root
        self.source = root / "inbox"
        self.workspace = root / "workspace"
        self.output = root / "report"
        self.promo = root / "promo"
        self.source.mkdir()

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def test_scaffold_from_approved_highlight(self):
        path = self.source / "set.mp4"
        subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=320x240:rate=2:duration=30",
                "-c:v",
                "mpeg4",
                str(path),
            ],
            check=True,
        )
        manifest = scan(self.source, self.output, [event()], workspace=self.workspace)
        item = manifest["files"][0]
        segment = item["highlights"][0]
        store = ReviewStore(self.workspace)
        store.save(
            item["content_id"],
            {
                "approved": True,
                "status": "SOCIAL_CANDIDATE",
                "highlights": [
                    {
                        "start_seconds": segment["start_seconds"],
                        "end_seconds": segment["end_seconds"],
                        "approved": True,
                    }
                ],
            },
        )
        provenance = scaffold(
            manifest_path=self.output / "manifest.json",
            output=self.promo,
            workspace=self.workspace,
            content_id=None,
            highlight_index=0,
            aspect="9:16",
        )
        self.assertTrue((self.promo / "index.html").exists())
        self.assertTrue((self.promo / "assets" / "highlight.mp4").exists())
        self.assertEqual(provenance["content_id"], item["content_id"])
        candidates = list_candidates(self.output / "manifest.json", self.workspace)
        self.assertEqual(len(candidates), 1)
        self.assertTrue(candidates[0]["highlights"][0]["approved"])


if __name__ == "__main__":
    unittest.main()
