import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readPage, checkPages } from '../scripts/check-links.mjs';

function check(source, target = '<h2 id="contacts">Contacts</h2>') {
  const pages = new Map([
    ['fi/guides/start/index.html', readPage(source)],
    ['fi/faq/general/index.html', readPage(target)],
  ]);
  return checkPages(pages, new Set([...pages.keys(), '_astro/screenshot.png']));
}

test('CLI warns without failing previews but fails strict validation', async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), 'mcfi-links-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(join(cwd, 'dist'));
  const html = join(cwd, 'dist', 'index.html');
  await writeFile(
    html,
    '<a href="/missing/">Missing page</a><a href="#gone">Missing anchor</a>',
  );
  const script = fileURLToPath(
    new URL('../scripts/check-links.mjs', import.meta.url),
  );
  const run = (args = [], githubActions = 'false') =>
    spawnSync(process.execPath, [script, ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_ACTIONS: githubActions },
    });

  const strict = run();
  assert.equal(strict.status, 1);
  assert.match(strict.stderr, /missing destination/);
  assert.match(strict.stderr, /missing anchor/);

  const preview = run(['--warn-only']);
  assert.equal(preview.status, 0);
  assert.match(preview.stderr, /Warning: .*missing destination/);
  assert.match(preview.stderr, /Warning: .*missing anchor/);

  const github = run(['--warn-only'], 'true');
  assert.equal(github.status, 0);
  assert.match(github.stderr, /::warning title=Internal link validation::/);

  await writeFile(
    html,
    '<h2 id="present">Present</h2><a href="#present">Valid</a>',
  );
  assert.equal(run().status, 0);
  assert.equal(run(['--warn-only']).status, 0);
});

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
