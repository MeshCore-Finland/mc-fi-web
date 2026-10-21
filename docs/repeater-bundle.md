# Daily Finland network snapshot

A standalone exporter reads mc-shark's public native node catalog and CoreScope's hourly packet analytics, publishing a compact snapshot for maps and homepage statistics on [meshcore.fi](https://meshcore.fi/). It runs independently of website builds.

## Export locally

Python 3.10+ is sufficient. The exporter and tests have no third-party dependencies.

```sh
python3 -m unittest discover -s scripts -p 'test_export_repeaters.py' -v
python3 scripts/export_repeaters.py --output /tmp/repeaters-v1.json.gz
gzip -dc /tmp/repeaters-v1.json.gz
```

Repeater source: `https://shark-api.meshcore.fi/api/v1/nodes?includeActivity=false&limit=25000`. Override with `--api-base`. Follow all `next_cursor` pages. Include `role=repeater` with `origin_country_code` FI or AX (Åland), finite valid coordinates, and a full public key. Exclude entries whose `freshness` is `offline` or `catalog_only`, or whose `catalog_only` flag is true. This excludes imported-only entries until the backend can age them reliably. Fresh and stale observed repeaters remain eligible; inclusion does not imply a device is online. Other roles, unknown countries and missing/invalid coordinates are excluded. The backend owns coordinate-country classification and freshness policy. Names fall back to the first 12 public-key characters if absent.

The contract is version 1 with UTC `generatedAt` and `nodes: [{id, name, lat, lon}]`. `id` is the normalized full public key. Nodes are sorted by ID. The browser contract and loader live in `src/lib/repeater-bundle.ts`.

## Previous-day packet activity

The exporter also requests `https://corescope.meshcore.fi/api/analytics/rf` with explicit `from` and `to` timestamps. Override the host with `--packet-api-base`. It captures the previous **Europe/Helsinki calendar day**, rather than a rolling 24-hour window. UTC hourly buckets are selected from local midnight inclusive to the next midnight exclusive; missing hours are filled with zero. Daylight-saving transitions produce 23 or 25 buckets instead of 24.

The additive `packetActivity` field contains the local `date`, `timeZone`, UTC `from`/`to`, and `hourly: [{start, count}]`. Counts come from CoreScope's `packetsPerHour` aggregate, which counts a packet hash at most once per hour. Summing the hourly buckets gives the displayed daily total; this is not an RF observation count or a count deduplicated across the entire day. The series is available for a future graph.

Both homepage counters read this snapshot without live API polling. The packet label shows the covered date and the update label shows the snapshot's generation timestamp. Older version-1 bundles without `packetActivity` remain readable; their packet counter shows unavailable. A malformed activity response fails the export before publication, preserving the existing snapshot.

## Hosting and publication

- Account: `d7954cd51b00c2b8e5e836d3708f4e21`
- Dedicated R2 bucket: `mcfi-network-data`
- Public endpoint: `https://data.meshcore.fi/repeaters/v1.json`
- Object key: `repeaters/v1.json`
- GitHub repository secret: `WEBSITE_MAP_DATA_UPLOAD_TOKEN` (Cloudflare API token with Workers R2 Storage Write)

The publisher uses Wrangler with the existing Cloudflare API token; separate S3 keys are not required. Gzip bytes are stored with `Content-Type: application/json`, `Content-Encoding: gzip`, and `Cache-Control: public, max-age=900`. Browsers decompress the HTTP response automatically and use ordinary JSON fetching. Keep `r2.dev` disabled and put only intentionally public files in this bucket.

R2 CORS policy allows unauthenticated reads, including branch previews and localhost:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 86400
  }
]
```

Create a Cloudflare Cache Rule matching the hostname and `/repeaters/` path: make responses eligible for caching and respect the object's 900-second cache lifetime. JSON is not cached by default. Updated bundles may take up to 15 minutes to reach cached clients.

## Schedule and recovery

See [CI workflows and triggers](ci.md#publish-finland-repeater-bundle) for the exact events and publication conditions.

The **Publish Finland repeater bundle** workflow runs daily at 00:05 **Europe/Helsinki**, including summer time, from `main`, the repository's configured default branch. Use its **Run workflow** button with `main` selected for an immediate refresh. Manual runs also capture the previous calendar day. The publication guard follows GitHub's default-branch setting; Cloudflare's production branch is configured separately, also as `main`. Pushes and PRs do not trigger this workflow; exporter unit tests run in Site checks on PRs targeting any branch. Forks and manual runs on other branches cannot publish through this workflow. The workflow must be present on the default branch for scheduled execution.

GitHub schedules are best-effort and public repositories disable them after 60 days without repository activity. A quiet repository needs its scheduled workflow re-enabled; do not generate artificial commits to bypass that behavior.

Transient HTTP failures retry three times. Malformed pages, duplicate keys, non-advancing pagination and empty exports fail before publication. Local output is replaced atomically; R2 is updated with one whole-object upload only after a complete successful export. On failure, yesterday's public snapshot stays available. The failed Actions run is the operator signal; `generatedAt` lets consumers show snapshot age. This is a known-node catalog, not a live status or coverage feed.
