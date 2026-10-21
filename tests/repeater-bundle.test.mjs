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

const activity = (
  from = '2026-10-18T21:00:00Z',
  hours = 24,
  date = '2026-10-19',
) => ({
  date,
  timeZone: 'Europe/Helsinki',
  from,
  to: new Date(Date.parse(from) + hours * 3_600_000)
    .toISOString()
    .replace('.000Z', 'Z'),
  hourly: Array.from({ length: hours }, (_, index) => ({
    start: new Date(Date.parse(from) + index * 3_600_000)
      .toISOString()
      .replace('.000Z', 'Z'),
    count: index,
  })),
});

test('preserves complete daily packet series including short and long DST days', () => {
  for (const value of [
    activity(),
    activity('2026-03-28T22:00:00Z', 23, '2026-03-29'),
    activity('2026-10-24T21:00:00Z', 25, '2026-10-25'),
  ]) {
    assert.deepEqual(
      parseRepeaterBundle({ ...bundle(), packetActivity: value })
        .packetActivity,
      value,
    );
  }
  const empty = activity();
  empty.hourly.forEach((hour) => {
    hour.count = 0;
  });
  assert.equal(
    parseRepeaterBundle({
      ...bundle(),
      packetActivity: empty,
    }).packetActivity.hourly.reduce((sum, hour) => sum + hour.count, 0),
    0,
  );
});

test('rejects incomplete, unordered or malformed packet activity', () => {
  const value = activity();
  const changes = [
    null,
    { ...value, date: '2026-02-30' },
    { ...value, timeZone: 'UTC' },
    { ...value, to: value.from },
    { ...value, hourly: value.hourly.slice(1) },
    { ...value, hourly: [...value.hourly].reverse() },
  ];
  for (const count of [
    -1,
    NaN,
    Infinity,
    1.5,
    '1',
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    changes.push({
      ...value,
      hourly: [{ ...value.hourly[0], count }, ...value.hourly.slice(1)],
    });
  }
  for (const packetActivity of changes)
    assert.throws(
      () => parseRepeaterBundle({ ...bundle(), packetActivity }),
      /Invalid packet activity/,
    );
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
