import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  readArticle,
  sourceHash,
  checkTranslations,
  stampTranslation,
} from '../scripts/check-translations.mjs';

const article = (extra = '', body = '\nSource text.\n') =>
  `---\ntitle: Example\ndescription: A page.\n${extra}---\n${body}`;

async function fixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), 'mcfi-translations-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const root = join(cwd, 'src/content/docs');
  await mkdir(join(root, 'fi'), { recursive: true });
  await mkdir(join(root, 'en'), { recursive: true });
  const put = async (locale, path, text) => {
    const file = join(root, locale, path);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, text);
    return file;
  };
  return { cwd, root, put };
}

test('fingerprints include source content and meaningful metadata, excluding review bookkeeping', () => {
  const hash = (text) => sourceHash(readArticle(text));
  const original = article();
  assert.equal(hash(original), hash(article("lastReviewed: '2026-10-21'\n")));
  assert.equal(
    hash(original),
    hash(
      article(
        "translationChecked: '2026-10-21'\ntranslationSourceHash: 'sha256:" +
          'a'.repeat(64) +
          "'\n",
      ),
    ),
  );
  assert.equal(
    hash(original),
    hash(original.replaceAll('\n', '\r\n') + '\r\n'),
  );
  assert.equal(
    hash(original),
    hash(
      "---\ndescription: 'A page.'\n# YAML comment\ntitle: Example\n---\n\nSource text.\n",
    ),
  );
  assert.notEqual(hash(original), hash(article('', '\nChanged text.\n')));
  assert.notEqual(
    hash(original),
    hash(original.replace('title: Example', 'title: Changed')),
  );
  assert.notEqual(hash(original), hash(article('faq: true\n')));
});

test('report distinguishes drafts, missing translations, incomplete metadata, changes and orphans', async (t) => {
  const { root, put } = await fixture(t);
  const source = article();
  const recorded = article(
    `translationChecked: '2026-10-21'\ntranslationSourceHash: '${sourceHash(readArticle(source))}'\n`,
  );
  for (const name of [
    'missing',
    'draft-en',
    'unchecked',
    'date-only',
    'changed',
    'current',
    'source-draft',
    'published-draft',
  ])
    await put(
      'fi',
      `${name}.mdx`,
      name.endsWith('draft') ? article('draft: true\n') : source,
    );
  await put('en', 'draft-en.mdx', article('draft: true\n'));
  await put('en', 'unchecked.mdx', source);
  await put(
    'en',
    'date-only.mdx',
    article("translationChecked: '2026-10-21'\n"),
  );
  await put('en', 'current.md', recorded);
  await put('en', 'changed.mdx', recorded);
  await put('fi', 'changed.mdx', article('', '\nNew information.\n'));
  await put('en', 'published-draft.mdx', source);
  await put('en', 'orphan.mdx', source);
  assert.deepEqual(
    Object.fromEntries(
      (await checkTranslations(root)).map(({ slug, status }) => [slug, status]),
    ),
    {
      changed: 'source-changed',
      current: 'source-unchanged',
      'date-only': 'unchecked',
      'draft-en': 'missing',
      missing: 'missing',
      orphan: 'orphan',
      'published-draft': 'published-draft',
      'source-draft': 'draft',
      unchecked: 'unchecked',
    },
  );
});

test('recording updates only English comparison metadata and preserves contributor text and comments', async (t) => {
  const { root, put } = await fixture(t);
  const source = article("lastReviewed: '2026-09-01'\n");
  const file = await put('fi', 'users/start.md', source);
  const translation = article(
    '# Keep this comment\n',
    '\nContributor wording.\n',
  );
  const english = await put('en', 'users/start.mdx', translation);
  await stampTranslation(root, 'users/start', '2026-10-21');
  assert.equal(await readFile(file, 'utf8'), source);
  const stamped = await readFile(english, 'utf8');
  assert.match(stamped, /# Keep this comment/);
  assert.match(stamped, /translationChecked: '2026-10-21'/);
  assert.equal(readArticle(stamped).body, readArticle(translation).body);
  assert.equal(readArticle(stamped).data.lastReviewed, undefined);
  assert.equal((await checkTranslations(root))[0].status, 'source-unchanged');
  await writeFile(
    english,
    stamped.replace("'2026-10-21'", "'2026-10-21' # Existing comparison note"),
  );
  await stampTranslation(root, 'users/start', '2026-10-22');
  assert.match(
    await readFile(english, 'utf8'),
    /translationChecked: '2026-10-22' # Existing comparison note/,
  );
  // An English-only quality improvement retains the previous full comparison.
  await writeFile(
    english,
    stamped.replace('Contributor wording.', 'Better contributor wording.'),
  );
  assert.equal((await checkTranslations(root))[0].status, 'source-unchanged');
  await assert.rejects(
    stampTranslation(root, '../start', '2026-10-21'),
    /document path/,
  );
  await assert.rejects(
    stampTranslation(root, 'users/start', '2026-02-30'),
    /calendar date/,
  );
  await assert.rejects(
    stampTranslation(root, 'missing', '2026-10-21'),
    /must exist/,
  );
  await put('fi', 'users/start.md', article('draft: true\n'));
  await assert.rejects(
    stampTranslation(root, 'users/start', '2026-10-21'),
    /draft/,
  );
});

test('CLI is read-only and advisory by default, with explicit strict and record modes', async (t) => {
  const { cwd, root, put } = await fixture(t);
  const source = await put('fi', 'example.md', article());
  await put('en', 'example.md', article());
  const script = fileURLToPath(
    new URL('../scripts/check-translations.mjs', import.meta.url),
  );
  const run = (...args) =>
    spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  assert.equal(run().status, 0);
  assert.match(run().stdout, /unchecked/);
  assert.equal(run('--strict').status, 1);
  assert.equal(await readFile(source, 'utf8'), article());
  assert.equal(run('--stamp', 'example').status, 1);
  assert.equal(run('--stamp', 'example', '--date', '2026-10-21').status, 0);
  assert.equal(run('--strict').status, 0);
  await put('fi', 'example.mdx', article());
  await assert.rejects(checkTranslations(root), /Duplicate document path/);
});

test('invalid YAML, dates and fingerprints fail instead of reporting a false match', () => {
  assert.throws(() => readArticle('No front matter'), /front matter/);
  assert.throws(() => readArticle('---\n- not a mapping\n---\n'), /mapping/);
  assert.throws(() => readArticle(article('title: Duplicate\n')), /unique/);
  assert.throws(
    () => readArticle(article("lastReviewed: '2026-02-30'\n")),
    /calendar date/,
  );
  assert.throws(
    () => readArticle(article('translationSourceHash: bad\n')),
    /64 lowercase/,
  );
});
