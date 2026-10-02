# Homepage map data

`finland-outline.json` contains the exterior polygon rings of mainland Finland, its islands, and Åland, from Natural Earth 1:50m Admin 0 Countries. The source lists Åland as a separate administrative feature; both features with `SOVEREIGNT=Finland` are included. Coordinates are rounded to four decimals; interior holes are omitted for this small silhouette. Natural Earth data is in the public domain.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
- Licence: https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-10-02

`repeaters.prototype.json` contains deterministic random example locations inside the outline. These are **not actual repeaters**. The SVG accessible label identifies them as prototype data; the homepage has no visible map caption. No connections or coverage circles are inferred.

The intended location payload is:

```json
{
  "version": 1,
  "source": "network",
  "nodes": [{ "id": "stable-node-id", "lat": 60.17, "lon": 24.94 }]
}
```

`FinlandMap.astro` accepts the `nodes` array. A later JSON or MessagePack loader can supply the same coordinates; the projection and presentation do not depend on the wire format. The current prototype renders the bundled example data at build time, with no live location feed. Once real data is connected, update the accessible label and supply an observation timestamp.
