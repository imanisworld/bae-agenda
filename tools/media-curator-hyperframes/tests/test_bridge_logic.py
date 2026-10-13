import unittest

from media_curator_hyperframes.bridge import approved_highlights, composition_html, pick_item


class ApprovedHighlightsTests(unittest.TestCase):
    def test_requires_explicit_range_approval(self):
        item = {
            "effective_approved": True,
            "highlights": [{"start_seconds": 0.0, "end_seconds": 5.0, "approved": False}],
        }
        self.assertEqual(approved_highlights(item), [])

    def test_returns_only_approved_ranges(self):
        item = {
            "highlights": [
                {"start_seconds": 0.0, "end_seconds": 5.0, "approved": False},
                {"start_seconds": 10.0, "end_seconds": 15.0, "approved": True},
            ]
        }
        approved = approved_highlights(item)
        self.assertEqual(len(approved), 1)
        self.assertEqual(approved[0]["start_seconds"], 10.0)


class PickItemTests(unittest.TestCase):
    def test_skipped_effective_status_not_preferred(self):
        manifest = {
            "files": [
                {
                    "media_type": "video",
                    "content_id": "a" * 64,
                    "effective_approved": True,
                    "effective_status": "SKIP",
                    "status": "SOCIAL_CANDIDATE",
                    "highlights": [{"start_seconds": 0.0, "end_seconds": 5.0, "approved": True}],
                },
                {
                    "media_type": "video",
                    "content_id": "b" * 64,
                    "effective_approved": True,
                    "effective_status": "SOCIAL_CANDIDATE",
                    "highlights": [{"start_seconds": 0.0, "end_seconds": 5.0, "approved": True}],
                },
            ]
        }
        picked = pick_item(manifest, None)
        self.assertEqual(picked["content_id"], "b" * 64)


class CompositionHtmlTests(unittest.TestCase):
    def test_escapes_event_text(self):
        html_doc = composition_html(
            width=1080,
            height=1920,
            duration=10.0,
            title='Evil</h1><script>alert(1)</script>',
            subtitle='Venue <b>bold</b>',
            project_id="test",
        )
        self.assertNotIn("<script>alert(1)</script>", html_doc)
        self.assertIn("&lt;/h1&gt;&lt;script&gt;alert(1)&lt;/script&gt;", html_doc)
        self.assertIn("Venue &lt;b&gt;bold&lt;/b&gt;", html_doc)


if __name__ == "__main__":
    unittest.main()
