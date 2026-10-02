import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  loadRepeaterBundle,
  parseRepeaterBundle,
} from '../src/lib/repeater-bundle.ts';

const bundle = () => ({
  version: 1,
  generatedAt: '2026-10-02T03:00:00Z',
  nodes: [{ id: 'A'.repeat(64), name: 'Åland toistin', lat: 60.1, lon: 19.9 }],
});

test('preserves Unicode names and snapshot timestamp', () => {
  assert.deepEqual(parseRepeaterBundle(bundle()), bundle());
});

test('rejects unsupported, empty, malformed and duplicate data', () => {
  for (const value of [
    null,
    { ...bundle(), version: 2 },
    { ...bundle(), generatedAt: 'yesterday' },
    { ...bundle(), nodes: [] },
    { ...bundle(), nodes: [bundle().nodes[0], bundle().nodes[0]] },
  ]) {
    assert.throws(() => parseRepeaterBundle(value));
  }
  for (const change of [
    { id: 'short' },
    { lat: null },
    { lat: NaN },
    { lon: Infinity },
    { lon: 181 },
    { lat: 0, lon: 0 },
    { name: '' },
  ]) {
    assert.throws(() =>
      parseRepeaterBundle({
        ...bundle(),
        nodes: [{ ...bundle().nodes[0], ...change }],
      }),
    );
  }
});

test('concurrent maps share a request', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json(bundle());
  });
  const first = loadRepeaterBundle('https://example.test/shared.json');
  const second = loadRepeaterBundle('https://example.test/shared.json');
  assert.equal(first, second);
  assert.deepEqual(await first, bundle());
  assert.equal(calls, 1);
});

test('HTTP and invalid-payload failures can be retried', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (calls === 1) return new Response('', { status: 503 });
    if (calls === 2) return Response.json({ version: 1 });
    return Response.json(bundle());
  });
  const url = 'https://example.test/retry.json';
  await assert.rejects(loadRepeaterBundle(url), /HTTP 503/);
  await assert.rejects(loadRepeaterBundle(url), /Invalid repeater bundle/);
  assert.deepEqual(await loadRepeaterBundle(url), bundle());
  assert.equal(calls, 3);
});
