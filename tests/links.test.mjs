import test from 'node:test';
import assert from 'node:assert/strict';
import { readPage, checkPages } from '../scripts/check-links.mjs';

function check(source, target = '<h2 id="contacts">Contacts</h2>') {
  const pages = new Map([
    ['fi/guides/start/index.html', readPage(source)],
    ['fi/faq/general/index.html', readPage(target)],
  ]);
  return checkPages(pages, new Set([...pages.keys(), '_astro/screenshot.png']));
}

test('validates relative, locale-prefixed and absolute internal links', () => {
  assert.deepEqual(
    check(`<a href="../../faq/general/#contacts">FAQ</a>
    <a href="/fi/faq/general#contacts">FAQ</a>
    <a href="https://meshcore.fi/fi/faq/general/#contacts">FAQ</a>
    <a href="/_astro/screenshot.png">Original</a>`),
    [],
  );
});
test('rejects broken document destinations and section anchors', () => {
  assert.match(
    check('<a href="/fi/missing/">Missing</a>')[0],
    /missing destination/,
  );
  assert.match(
    check('<a href="/fi/faq/general/#gone">Missing</a>')[0],
    /missing anchor/,
  );
});
test('detects duplicate IDs, including FAQ question IDs', () => {
  assert.match(
    check('', '<h2 id="contacts"></h2><h2 id="contacts"></h2>')[0],
    /duplicate ID/,
  );
});
test('parses encoded anchors and HTML entities without crawling external sites', () => {
  assert.deepEqual(
    check(
      '<a href="/fi/faq/general/?a=1&amp;b=2#yhteys-%C3%A4">FAQ</a>',
      '<h2 id="yhteys-ä"></h2>',
    ),
    [],
  );
  assert.deepEqual(
    check(
      '<a href="https://corescope.meshcore.fi/#/map">Map</a><a href="mailto:test@example.com">Email</a>',
    ),
    [],
  );
  assert.match(
    check('<a href="/fi/faq/general/#%ZZ">Bad</a>')[0],
    /invalid URL encoding/,
  );
});
