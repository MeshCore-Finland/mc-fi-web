/** Shared wire contract and loader for the homepage and future maps. */
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
}

const bundles = new Map<string, Promise<RepeaterBundle>>();
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  return { version: 1, generatedAt: value.generatedAt, nodes };
}

/** Concurrent maps share one request. A failed request may be retried later. */
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
