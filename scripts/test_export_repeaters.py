import gzip
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit

from export_repeaters import catalog_nodes, fetch_page, make_bundle, write_bundle


def node(key="A" * 64, **changes):
    return {"public_key": key, "name": "Toistin Åland", "role": "repeater", "origin_country_code": "FI", "lat": 60.1, "lon": 19.9, **changes}


class RepeaterExportTests(unittest.TestCase):
    def test_catalog_includes_local_and_imported_finland_and_aland(self):
        source = [node(), node("B" * 64, origin_country_code="AX", catalog_only=True), node("C" * 64, origin_country_code="SE"), node("D" * 64, role="companion"), node("E" * 64, role="room_server"), node("F" * 64, lat=None), node("1" * 64, lat=0, lon=0), node("2" * 64, lat=True), node("3" * 64, lon=float("nan"))]
        bundle = make_bundle(source, "2026-10-02T03:00:00Z")
        self.assertEqual([n["id"] for n in bundle["nodes"]], ["A" * 64, "B" * 64])
        self.assertEqual(set(bundle["nodes"][0]), {"id", "name", "lat", "lon"})
        self.assertEqual(bundle["generatedAt"], "2026-10-02T03:00:00Z")

    def test_follows_cursor_without_excluding_local_nodes(self):
        calls = []
        def fetch(url):
            params = parse_qs(urlsplit(url).query)
            calls.append(params)
            if "after" not in params:
                return {"nodes": [node("a" * 64)], "next_cursor": "a" * 64}
            return {"nodes": [node("b" * 64)], "next_cursor": None}
        self.assertEqual([n["public_key"] for n in catalog_nodes("https://example.test", fetch)], ["A" * 64, "B" * 64])
        self.assertNotIn("scope", calls[0])
        self.assertEqual(calls[1]["after"], ["A" * 64])
        self.assertEqual(calls[0]["includeActivity"], ["false"])

    def test_rejects_incomplete_pages_duplicates_and_stuck_pagination(self):
        for page in [{"nodes": []}, {"nodes": [node(), node()], "next_cursor": None}, {"nodes": [], "next_cursor": "A" * 64}, {"nodes": [node()], "next_cursor": "invalid"}, {"nodes": [node(key="bad")], "next_cursor": None}]:
            with self.subTest(page=page), self.assertRaises(ValueError):
                list(catalog_nodes("https://example.test", lambda _: page))
        with self.assertRaises(ValueError):
            list(catalog_nodes("https://example.test", lambda _: {"nodes": [node()], "next_cursor": "A" * 64}))

    def test_empty_export_does_not_replace_existing_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "bundle.gz"
            output.write_bytes(b"previous snapshot")
            with self.assertRaises(ValueError):
                write_bundle(make_bundle([]), output)
            self.assertEqual(output.read_bytes(), b"previous snapshot")

    def test_gzip_preserves_unicode(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = make_bundle([node()])
            data = write_bundle(bundle, Path(directory) / "bundle.gz")
            self.assertEqual(json.loads(gzip.decompress(data)), bundle)

    def test_transient_errors_retry_but_permanent_errors_fail(self):
        temporary = HTTPError("https://example.test", 503, "Unavailable", {}, None)
        permanent = HTTPError("https://example.test", 403, "Forbidden", {}, None)
        with patch("export_repeaters.urlopen", side_effect=temporary) as fetch, patch("export_repeaters.time.sleep"):
            with self.assertRaises(HTTPError):
                fetch_page("https://example.test")
            self.assertEqual(fetch.call_count, 3)
        with patch("export_repeaters.urlopen", side_effect=permanent) as fetch:
            with self.assertRaises(HTTPError):
                fetch_page("https://example.test")
            self.assertEqual(fetch.call_count, 1)


if __name__ == "__main__":
    unittest.main()
