import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const reviewFields = new Set([
  'lastReviewed',
  'translationChecked',
  'translationSourceHash',
]);
const hashPattern = /^sha256:[a-f0-9]{64}$/;

export function isCalendarDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function readArticle(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) throw new Error('Expected YAML front matter');
  const document = parseDocument(match[1]);
  if (document.errors.length) throw new Error(document.errors[0].message);
  const data = document.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Front matter must be a mapping');
  for (const field of ['lastReviewed', 'translationChecked']) {
    if (data[field] !== undefined && !isCalendarDate(data[field]))
      throw new Error(`${field} must be a quoted YYYY-MM-DD calendar date`);
  }
  if (
    data.translationSourceHash !== undefined &&
    !hashPattern.test(data.translationSourceHash)
  )
    throw new Error(
      'translationSourceHash must be sha256: followed by 64 lowercase hex digits',
    );
  return { data, document, body: match[2] };
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted(value[key])]),
    );
  return value;
}

export function sourceHash(article) {
  const data = Object.fromEntries(
    Object.entries(article.data).filter(([key]) => !reviewFields.has(key)),
  );
  const content = JSON.stringify(sorted(data)) + '\n' + article.body.trimEnd();
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

async function articles(directory) {
  const result = new Map();
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (/\.mdx?$/.test(file)) {
        const slug = relative(directory, file)
          .split(sep)
          .join('/')
          .replace(/\.mdx?$/, '');
        if (result.has(slug))
          throw new Error(`Duplicate document path: ${slug}`);
        try {
          result.set(slug, {
            ...readArticle(await readFile(file, 'utf8')),
            file,
          });
        } catch (error) {
          throw new Error(`${file}: ${error.message}`);
        }
      }
    }
  }
  await visit(directory);
  return result;
}

export async function checkTranslations(root = resolve('src/content/docs')) {
  const [finnish, english] = await Promise.all([
    articles(resolve(root, 'fi')),
    articles(resolve(root, 'en')),
  ]);
  const report = [];
  for (const [slug, source] of finnish) {
    const translation = english.get(slug);
    let status;
    if (source.data.draft === true)
      status =
        translation && translation.data.draft !== true
          ? 'published-draft'
          : 'draft';
    else if (!translation || translation.data.draft === true)
      status = 'missing';
    else if (
      !translation.data.translationChecked ||
      !translation.data.translationSourceHash
    )
      status = 'unchecked';
    else if (translation.data.translationSourceHash !== sourceHash(source))
      status = 'source-changed';
    else status = 'source-unchanged';
    report.push({
      slug,
      status,
      checked: translation?.data.translationChecked,
    });
  }
  for (const slug of english.keys())
    if (!finnish.has(slug)) report.push({ slug, status: 'orphan' });
  return report.sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
}

export async function stampTranslation(root, slug, date) {
  if (!isCalendarDate(date))
    throw new Error('--date must be a YYYY-MM-DD calendar date');
  if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(slug))
    throw new Error('--stamp expects a document path such as users/start');
  const [finnish, english] = await Promise.all([
    articles(resolve(root, 'fi')),
    articles(resolve(root, 'en')),
  ]);
  const source = finnish.get(slug);
  const translation = english.get(slug);
  if (!source || !translation)
    throw new Error(`Both Finnish and English pages must exist: ${slug}`);
  if (source.data.draft === true || translation.data.draft === true)
    throw new Error(
      `Cannot record a published translation comparison for a draft: ${slug}`,
    );
  const dateNode =
    translation.document.get('translationChecked', true) ??
    translation.document.createNode(date);
  dateNode.value = date;
  dateNode.type = 'QUOTE_SINGLE';
  translation.document.set('translationChecked', dateNode);
  translation.document.set('translationSourceHash', sourceHash(source));
  await writeFile(
    translation.file,
    `---\n${translation.document.toString()}---\n${translation.body}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const root = resolve('src/content/docs');
  if (args.includes('--help')) {
    console.log(
      'Usage: npm run check:translations [-- --strict]\nAfter a full comparison: npm run check:translations -- --stamp users/start --date YYYY-MM-DD',
    );
    return;
  }
  if (args[0] === '--stamp' && args.length === 4 && args[2] === '--date') {
    await stampTranslation(root, args[1], args[3]);
    console.log(`Recorded translation comparison: ${args[1]} (${args[3]})`);
    return;
  }
  if (args.some((arg) => arg !== '--strict'))
    throw new Error('Unknown arguments; use --help');
  const report = await checkTranslations(root);
  const labels = {
    missing: 'Missing English page (or still a draft)',
    unchecked: 'Comparison not recorded',
    'source-changed': 'Finnish source changed',
    'source-unchanged': 'Source unchanged since comparison',
    orphan: 'English page has no Finnish source',
    draft: 'Finnish draft (excluded)',
    'published-draft': 'English published while Finnish is a draft',
  };
  for (const item of report)
    console.log(
      `${item.status.padEnd(16)} ${item.slug}: ${labels[item.status]}${item.checked ? ` (${item.checked})` : ''}`,
    );
  const issues = report.filter(
    (item) => !['source-unchanged', 'draft'].includes(item.status),
  );
  console.log(
    `\n${report.length} paths; ${issues.length} need attention. Shared UI and component text require a separate comparison.`,
  );
  if (args.includes('--strict') && issues.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
