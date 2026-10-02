import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';

export function readPage(html) {
  const ids = new Set();
  const duplicates = [];
  const links = [];
  function visit(node) {
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map(({ name, value }) => [name, value]),
    );
    if (attrs.id) {
      if (ids.has(attrs.id)) duplicates.push(attrs.id);
      ids.add(attrs.id);
    }
    if (node.tagName === 'a' && attrs.href !== undefined)
      links.push(attrs.href);
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(html));
  return { ids, duplicates, links };
}

export function checkPages(pages, files, site = 'https://meshcore.fi') {
  const issues = [];
  for (const [file, page] of pages) {
    const route = '/' + file.replace(/index\.html$/, '');
    for (const id of page.duplicates)
      issues.push(`${route}: duplicate ID "${id}"`);
    for (const href of page.links) {
      let url;
      try {
        url = new URL(href, new URL(route, site));
      } catch {
        issues.push(`${route}: invalid URL "${href}"`);
        continue;
      }
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.origin !== new URL(site).origin
      )
        continue;
      let path, anchor;
      try {
        path = decodeURIComponent(url.pathname).slice(1);
        anchor = decodeURIComponent(url.hash.slice(1));
      } catch {
        issues.push(`${route}: invalid URL encoding "${href}"`);
        continue;
      }
      const target = files.has(path)
        ? path
        : path.replace(/\/$/, '') + (path ? '/' : '') + 'index.html';
      if (!files.has(target))
        issues.push(`${route}: missing destination "${href}"`);
      else if (
        anchor &&
        pages.has(target) &&
        !pages.get(target).ids.has(anchor)
      ) {
        issues.push(`${route}: missing anchor "${href}"`);
      }
    }
  }
  return issues;
}

async function collect(directory) {
  const paths = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) paths.push(...(await collect(path)));
    else paths.push(path);
  }
  return paths;
}

async function main() {
  const root = resolve('dist');
  const files = await collect(root);
  const names = new Set(
    files.map((file) => relative(root, file).split(sep).join('/')),
  );
  const pages = new Map();
  for (const file of files.filter((file) => file.endsWith('.html'))) {
    pages.set(
      relative(root, file).split(sep).join('/'),
      readPage(await readFile(file, 'utf8')),
    );
  }
  const issues = checkPages(pages, names);
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `Checked internal links, anchors and IDs in ${pages.size} HTML pages.`,
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
