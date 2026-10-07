import { normalizeNodeId } from '../../../src/lib/node-contact.mjs';

const headers = { 'Cache-Control': 'no-store' };

export async function onRequestGet({ params, env }) {
  const id = normalizeNodeId(params.id);
  if (!id)
    return Response.json(
      { error: 'Invalid node ID' },
      { status: 400, headers },
    );
  try {
    const record = await env.NODE_CONTACTS.get(`sticker:${id}`, 'json');
    if (!record || record.enabled === false) {
      return Response.json(
        { error: 'Node not found' },
        { status: 404, headers },
      );
    }
    if (typeof record.description !== 'string' || !record.description.trim()) {
      return Response.json(
        { error: 'Node information unavailable' },
        { status: 503, headers },
      );
    }
    // Explicitly expose only the public greeting, never private delivery destinations.
    return Response.json({ id, description: record.description }, { headers });
  } catch {
    return Response.json(
      { error: 'Lookup unavailable' },
      { status: 503, headers },
    );
  }
}

export function onRequest() {
  return new Response(null, {
    status: 405,
    headers: { ...headers, Allow: 'GET' },
  });
}
