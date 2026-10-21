import type { RepeaterLocation } from './repeater-bundle';

export interface RegionBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RegionMapConfig {
  name: string;
  bounds: RegionBounds;
  /** First source is the default; an array enables the coverage selector. */
  meshmapper?: string | string[];
}

// These are editorial map extents, not administrative or radio coverage borders.
export const regionMaps = {
  paakaupunkiseutu: {
    name: 'Pääkaupunkiseutu',
    bounds: { south: 60.08, west: 24.45, north: 60.4, east: 25.25 },
    meshmapper: 'hel',
  },
  'vihti-lohja': {
    name: 'Vihti ja Lohja',
    bounds: { south: 60.14, west: 23.7, north: 60.52, east: 24.55 },
    meshmapper: 'hel',
  },
  'hyvinkaa-riihimaki-loppi': {
    name: 'Hyvinkää, Riihimäki ja Loppi',
    bounds: { south: 60.54, west: 24.18, north: 60.9, east: 25.12 },
    // TMP is outside FINLAND; border areas need both separate coverage views.
    meshmapper: ['tmp', 'finland'],
  },
  kotka: {
    name: 'Kotka',
    bounds: { south: 60.37, west: 26.7, north: 60.65, east: 27.16 },
    meshmapper: 'finland',
  },
  turku: {
    name: 'Turku',
    bounds: { south: 60.34, west: 22.02, north: 60.56, east: 22.52 },
    meshmapper: 'tku',
  },
  pirkanmaa: {
    name: 'Pirkanmaa',
    bounds: { south: 61.15, west: 22.7, north: 62.15, east: 24.8 },
    meshmapper: 'tmp',
  },
  pohjanmaat: {
    name: 'Pohjanmaan maakunnat',
    bounds: { south: 62.05, west: 20.9, north: 64.2, east: 24.8 },
    meshmapper: 'finland',
  },
} satisfies Record<string, RegionMapConfig>;

export type RegionMapId = keyof typeof regionMaps;

export function repeatersInBounds(
  nodes: RepeaterLocation[],
  bounds: RegionBounds,
): RepeaterLocation[] {
  return nodes.filter(
    ({ lat, lon }) =>
      lat >= bounds.south &&
      lat <= bounds.north &&
      lon >= bounds.west &&
      lon <= bounds.east,
  );
}

export function meshmapperSources(region: RegionMapConfig): string[] {
  return typeof region.meshmapper === 'string'
    ? [region.meshmapper]
    : (region.meshmapper ?? []);
}

export function meshmapperMapUrl(
  region: RegionMapConfig,
  source = meshmapperSources(region)[0],
): string | undefined {
  return source ? `https://${source}.meshmapper.net/` : undefined;
}

export function meshmapperEmbedUrl(
  region: RegionMapConfig,
  view: { lat: number; lon: number; meters: number },
  source?: string,
): string | undefined {
  const base = meshmapperMapUrl(region, source);
  if (!base) return undefined;
  const url = new URL('embed.php', base);
  url.search = new URLSearchParams({
    lat: view.lat.toFixed(5),
    lon: view.lon.toFixed(5),
    meters: String(Math.round(view.meters)),
    // A supplied centre otherwise silently limits the data to a 5 km radius.
    geofence: '0',
    repeaters: '0',
    rep_coverage: '0',
  }).toString();
  return url.href;
}
