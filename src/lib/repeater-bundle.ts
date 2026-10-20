/** Shared wire contract and loader for repeater maps and statistics. */
export const DEFAULT_REPEATER_BUNDLE_URL =
  'https://data.meshcore.fi/repeaters/v1.json';

export interface RepeaterLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}
export interface RepeaterBundle {
  version: 1;
  generatedAt: string;
  nodes: RepeaterLocation[];
  packetActivity?: PacketActivity;
}
export interface PacketActivity {
  date: string;
  timeZone: 'Europe/Helsinki';
  from: string;
  to: string;
  hourly: { start: string; count: number }[];
}

const bundles = new Map<string, Promise<RepeaterBundle>>();
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePacketActivity(value: unknown): PacketActivity {
  if (
    !record(value) ||
    typeof value.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    !Number.isFinite(Date.parse(value.date)) ||
    new Date(value.date).toISOString().slice(0, 10) !== value.date ||
    value.timeZone !== 'Europe/Helsinki' ||
    typeof value.from !== 'string' ||
    typeof value.to !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/.test(value.from) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/.test(value.to) ||
    !Array.isArray(value.hourly)
  )
    throw new Error('Invalid packet activity');
  const start = Date.parse(value.from);
  const hours = (Date.parse(value.to) - start) / 3_600_000;
  if (![23, 24, 25].includes(hours) || value.hourly.length !== hours)
    throw new Error('Invalid packet activity period');
  const hourly = value.hourly.map((hour: unknown, index: number) => {
    const expected = new Date(start + index * 3_600_000)
      .toISOString()
      .replace('.000Z', 'Z');
    if (
      !record(hour) ||
      hour.start !== expected ||
      typeof hour.count !== 'number' ||
      !Number.isSafeInteger(hour.count) ||
      hour.count < 0
    )
      throw new Error('Invalid packet activity hour');
    return { start: expected, count: hour.count };
  });
  return {
    date: value.date,
    timeZone: value.timeZone,
    from: value.from,
    to: value.to,
    hourly,
  };
}

export function parseRepeaterBundle(value: unknown): RepeaterBundle {
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.generatedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value.generatedAt) ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !Array.isArray(value.nodes) ||
    !value.nodes.length
  ) {
    throw new Error('Invalid repeater bundle');
  }
  const ids = new Set<string>();
  const nodes = value.nodes.map((node: unknown): RepeaterLocation => {
    if (
      !record(node) ||
      typeof node.id !== 'string' ||
      !/^[0-9A-F]{64}$/.test(node.id) ||
      ids.has(node.id) ||
      typeof node.name !== 'string' ||
      !node.name.trim() ||
      typeof node.lat !== 'number' ||
      !Number.isFinite(node.lat) ||
      Math.abs(node.lat) > 90 ||
      typeof node.lon !== 'number' ||
      !Number.isFinite(node.lon) ||
      Math.abs(node.lon) > 180 ||
      (node.lat === 0 && node.lon === 0)
    ) {
      throw new Error('Invalid repeater in bundle');
    }
    ids.add(node.id);
    return { id: node.id, name: node.name, lat: node.lat, lon: node.lon };
  });
  const bundle: RepeaterBundle = {
    version: 1,
    generatedAt: value.generatedAt,
    nodes,
  };
  if (value.packetActivity !== undefined)
    bundle.packetActivity = parsePacketActivity(value.packetActivity);
  return bundle;
}

/** Consumers share one request. A failed request may be retried later. */
export function loadRepeaterBundle(url: string): Promise<RepeaterBundle> {
  const existing = bundles.get(url);
  if (existing) return existing;
  const request = fetch(url, { signal: AbortSignal.timeout(15_000) })
    .then(async (response) => {
      if (!response.ok)
        throw new Error(`Repeater bundle HTTP ${response.status}`);
      return parseRepeaterBundle(await response.json());
    })
    .catch((error: unknown) => {
      bundles.delete(url);
      throw error;
    });
  bundles.set(url, request);
  return request;
}
