import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeNodeId } from '../src/lib/node-contact.mjs';
import { onRequestGet, onRequest } from '../functions/api/node-contact/[id].js';

test('IDs contain exactly six hex characters and are normalized to uppercase', () => {
  assert.equal(normalizeNodeId('0ff1c3'), '0FF1C3');
  for (const id of [
    '',
    '0FF1C',
    '0FF1C33',
    'ZZZZZZ',
    ' 0FF1C3',
    null,
    ['0FF1C3'],
  ]) {
    assert.equal(normalizeNodeId(id), null);
  }
});

test('lookup normalizes IDs and exposes only the public description', async () => {
  const response = await onRequestGet({
    params: { id: '0ff1c3' },
    env: {
      NODE_CONTACTS: {
        async get(key, type) {
          assert.equal(key, 'sticker:0FF1C3');
          assert.equal(type, 'json');
          return {
            description: 'Terveiset omistajalta',
            email: 'private@example.com',
            destination: 'private',
            enabled: true,
          };
        },
      },
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: '0FF1C3',
    description: 'Terveiset omistajalta',
  });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('invalid IDs never read KV', async () => {
  const response = await onRequestGet({ params: { id: 'INVALID' }, env: {} });
  assert.equal(response.status, 400);
});

test('missing and disabled nodes return 404', async () => {
  for (const record of [null, { description: 'Hidden', enabled: false }]) {
    const response = await onRequestGet({
      params: { id: '0FF1C3' },
      env: { NODE_CONTACTS: { get: async () => record } },
    });
    assert.equal(response.status, 404);
  }
});

test('bad records and unavailable KV return a generic 503', async () => {
  for (const env of [
    {},
    { NODE_CONTACTS: { get: async () => ({ email: 'private@example.com' }) } },
    {
      NODE_CONTACTS: {
        get: async () => {
          throw new Error('private failure');
        },
      },
    },
  ]) {
    const response = await onRequestGet({ params: { id: '0FF1C3' }, env });
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes('private'));
  }
});

test('other request methods are not accepted', () => {
  const response = onRequest();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
});
