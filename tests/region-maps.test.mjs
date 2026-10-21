import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  meshmapperEmbedUrl,
  repeatersInBounds,
  regionMaps,
} from '../src/lib/region-maps.ts';

test('visible repeater lists include viewport boundary points', () => {
  const bounds = regionMaps.paakaupunkiseutu.bounds;
  const nodes = [
    { id: 'helsinki', lat: 60.17, lon: 24.94 },
    { id: 'edge', lat: bounds.north, lon: bounds.west },
    { id: 'turku', lat: 60.45, lon: 22.27 },
    { id: 'north', lat: bounds.north + 0.001, lon: 24.94 },
    { id: 'east', lat: 60.17, lon: bounds.east + 0.001 },
  ];
  assert.deepEqual(
    repeatersInBounds(nodes, bounds).map((node) => node.id),
    ['helsinki', 'edge'],
  );
});

test('coverage embeds preserve framing and disable the implicit 5 km geofence', () => {
  const url = new URL(
    meshmapperEmbedUrl(regionMaps.turku, {
      lat: 60.45,
      lon: 22.27,
      meters: 35000.4,
    }),
  );
  assert.equal(url.origin, 'https://tku.meshmapper.net');
  assert.equal(url.pathname, '/embed.php');
  assert.equal(url.searchParams.get('lat'), '60.45000');
  assert.equal(url.searchParams.get('lon'), '22.27000');
  assert.equal(url.searchParams.get('meters'), '35000');
  assert.equal(url.searchParams.get('geofence'), '0');
  assert.equal(url.searchParams.get('repeaters'), '0');
  assert.equal(url.searchParams.get('rep_coverage'), '0');
  assert.equal(
    meshmapperEmbedUrl(
      { name: 'Local only', bounds: regionMaps.turku.bounds },
      { lat: 60, lon: 22, meters: 1000 },
    ),
    undefined,
  );
});

test('border regions default to TMP and can use FINLAND at the same viewport', () => {
  const region = regionMaps['hyvinkaa-riihimaki-loppi'];
  const view = { lat: 60.72, lon: 24.65, meters: 96000 };
  const defaultSource = new URL(meshmapperEmbedUrl(region, view));
  const alternative = new URL(meshmapperEmbedUrl(region, view, 'finland'));
  assert.equal(defaultSource.origin, 'https://tmp.meshmapper.net');
  assert.equal(alternative.origin, 'https://finland.meshmapper.net');
  assert.equal(defaultSource.search, alternative.search);
});
