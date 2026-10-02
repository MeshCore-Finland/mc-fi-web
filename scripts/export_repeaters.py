#!/usr/bin/env python3
"""Export a compact Finland repeater catalog using the Python standard library."""
import argparse
from datetime import datetime, timezone
import gzip
import json
import math
import os
from pathlib import Path
import re
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

DEFAULT_API = "https://shark-api.meshcore.fi"
PUBLIC_KEY = re.compile(r"[0-9A-Fa-f]{64}\Z")


def fetch_page(url, attempts=3):
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"Accept": "application/json", "User-Agent": "MeshCore-Finland-repeater-export/1"})
            with urlopen(request, timeout=60) as response:
                raw = response.read(32 * 1024 * 1024 + 1)
            if len(raw) > 32 * 1024 * 1024:
                raise ValueError("Node page exceeds 32 MiB")
            return json.loads(raw)
        except (HTTPError, URLError, TimeoutError) as exc:
            if isinstance(exc, HTTPError) and exc.code != 429 and exc.code < 500:
                raise
            if attempt == attempts - 1:
                raise
            time.sleep(2 ** attempt)


def catalog_nodes(api_base, fetch=fetch_page):
    parsed = urlsplit(api_base)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError("API base must be an HTTP(S) URL without a query or fragment")
    after = None
    seen_cursors = set()
    seen_keys = set()
    for _ in range(100):
        params = {"includeActivity": "false", "limit": 25000}
        if after:
            params["after"] = after
        # Omit scope: catalog scope excludes locally heard nodes.
        page = fetch(f"{api_base.rstrip('/')}/api/v1/nodes?{urlencode(params)}")
        if not isinstance(page, dict) or not isinstance(page.get("nodes"), list) or "next_cursor" not in page:
            raise ValueError("Invalid node page envelope")
        for node in page["nodes"]:
            if not isinstance(node, dict):
                raise ValueError("Invalid node record")
            key = node.get("public_key")
            if not isinstance(key, str) or not PUBLIC_KEY.fullmatch(key):
                raise ValueError("Invalid node public key")
            key = key.upper()
            if key in seen_keys:
                raise ValueError(f"Duplicate public key across node pages: {key}")
            seen_keys.add(key)
            yield {**node, "public_key": key}
        cursor = page["next_cursor"]
        if cursor is None:
            return
        if not isinstance(cursor, str) or not PUBLIC_KEY.fullmatch(cursor):
            raise ValueError("Invalid pagination cursor")
        cursor = cursor.upper()
        if not page["nodes"] or cursor in seen_cursors or (after and cursor <= after):
            raise ValueError("Pagination did not advance")
        seen_cursors.add(cursor)
        after = cursor
    raise ValueError("Node catalog exceeded 100 pages")


def valid_coordinate(value, low, high):
    return isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value) and low <= value <= high


def make_bundle(nodes, generated_at=None):
    repeaters = []
    for node in nodes:
        # AX is the backend's coordinate-derived country code for Åland.
        if node.get("role") != "repeater" or node.get("origin_country_code") not in ("FI", "AX"):
            continue
        lat, lon = node.get("lat"), node.get("lon")
        if not valid_coordinate(lat, -90, 90) or not valid_coordinate(lon, -180, 180) or (lat == 0 and lon == 0):
            continue
        key = node["public_key"]
        name = node.get("name")
        if name is not None and not isinstance(name, str):
            raise ValueError("Invalid repeater name")
        repeaters.append({"id": key, "name": (name or "").strip() or key[:12], "lat": lat, "lon": lon})
    if not repeaters:
        raise ValueError("Refusing to publish an empty repeater bundle")
    repeaters.sort(key=lambda node: node["id"])
    return {"version": 1, "generatedAt": generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"), "nodes": repeaters}


def write_bundle(bundle, output):
    data = json.dumps(bundle, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")
    compressed = gzip.compress(data, compresslevel=9, mtime=0)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(compressed)
        os.replace(temporary, output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return compressed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base", default=DEFAULT_API)
    parser.add_argument("--output", default="/tmp/repeaters-v1.json.gz")
    args = parser.parse_args()
    bundle = make_bundle(catalog_nodes(args.api_base))
    data = write_bundle(bundle, args.output)
    print(f"Exported {len(bundle['nodes'])} repeaters, {len(data)} gzip bytes, generated {bundle['generatedAt']}")


if __name__ == "__main__":
    main()
