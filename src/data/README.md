# Homepage map data

`finland-outline.json` contains the exterior polygon rings of mainland Finland, its islands, and Åland, from Natural Earth 1:50m Admin 0 Countries. The source lists Åland as a separate administrative feature; both features with `SOVEREIGNT=Finland` are included. Coordinates are rounded to four decimals; interior holes are omitted for this small silhouette. Natural Earth data is in the public domain.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
- Licence: https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-10-02

## Repeater bundle

The homepage and future maps share the versioned snapshot from `https://data.meshcore.fi/repeaters/v1.json`. It is generated daily at 06:00 Europe/Helsinki by `scripts/export_repeaters.py` in this repository and published to R2. See [the exporter and hosting guide](../../docs/repeater-bundle.md).

```json
{
  "version": 1,
  "generatedAt": "2026-10-02T03:00:00Z",
  "nodes": [
    {
      "id": "FULL_64_CHARACTER_PUBLIC_KEY",
      "name": "Example repeater",
      "lat": 60.17,
      "lon": 24.94
    }
  ]
}
```

The public endpoint uses gzip HTTP encoding; consumers use ordinary JSON fetching. The snapshot includes known repeaters in Finland and Åland with valid coordinates. Inclusion does not imply a repeater is online; dots do not infer radio coverage or connections.

`src/lib/repeater-bundle.ts` owns the wire types, validation and shared browser request. Future maps call `loadRepeaterBundle(url)` and use `generatedAt` when displaying snapshot age. `FinlandMap.astro` renders the outline statically, loads repeater dots in the browser and exposes the successful timestamp as `data-generated-at`. Repeater names appear in SVG titles. If fetching fails, the outline remains without fabricated points. The homepage map is hidden on mobile.

Set `PUBLIC_REPEATER_BUNDLE_URL` in `.env` to test against another JSON endpoint; restart the dev server when changing it. Alternatively, pass `bundleUrl` to `FinlandMap`. Neither content authors nor site builds need access to mc-shark or R2 credentials.
