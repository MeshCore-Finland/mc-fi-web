# Daily Finland repeater bundle

A standalone exporter reads mc-shark's public native node catalog and publishes a compact snapshot for the MeshCore Finland homepage and future maps. It runs independently of website builds. No changes to the backend API or ClickHouse schema are required.

## Export locally

Python 3.10+ is sufficient. The exporter and tests have no third-party dependencies.

```sh
python3 -m unittest discover -s scripts -p 'test_export_repeaters.py' -v
python3 scripts/export_repeaters.py --output /tmp/repeaters-v1.json.gz
gzip -dc /tmp/repeaters-v1.json.gz
```

Default source: `https://shark-api.meshcore.fi/api/v1/nodes?includeActivity=false&limit=25000`. Override with `--api-base`. Follow all `next_cursor` pages. Omit `scope`: the combined catalog includes locally heard nodes and imports; `scope=catalog` excludes locally heard identities. Include `role=repeater` with `origin_country_code` FI or AX (Åland), finite valid coordinates, and a full public key. Other roles, unknown countries and missing/invalid coordinates are excluded. The backend owns coordinate-country classification and identity precedence. Names fall back to the first 12 public-key characters if absent. No observation-age cutoff is applied, and inclusion does not imply a node is online.

The contract is version 1 with UTC `generatedAt` and `nodes: [{id, name, lat, lon}]`. `id` is the normalized full public key. Nodes are sorted by ID. The browser contract and loader live in `src/lib/repeater-bundle.ts` on `dev`.

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

The **Publish Finland repeater bundle** workflow runs daily at 06:00 **Europe/Helsinki**, including summer time. Use its **Run workflow** button on `main` for an immediate refresh. Pushes/PRs run exporter tests only; they never publish. Forks cannot publish through this workflow. Scheduled workflows must be present on the default branch: `main` currently includes the exporter infrastructure while `dev` also includes the new map consumer. Keep the infrastructure identical when replacing the old live site.

GitHub schedules are best-effort and public repositories disable them after 60 days without repository activity. A quiet repository needs its scheduled workflow re-enabled; do not generate artificial commits to bypass that behavior.

Transient HTTP failures retry three times. Malformed pages, duplicate keys, non-advancing pagination and empty exports fail before publication. Local output is replaced atomically; R2 is updated with one whole-object upload only after a complete successful export. On failure, yesterday's public snapshot stays available. The failed Actions run is the operator signal; `generatedAt` lets consumers show snapshot age. This is a known-node catalog, not a live status or coverage feed.
