import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSatteriMarkdownProcessor,
  satteriHeadingIdsPlugin,
} from '@astrojs/markdown-satteri';
import { mdxToJs } from 'satteri';
import { parse } from 'parse5';
import { faqPagesPlugin } from '../src/lib/faq-pages.mjs';

const plugins = [satteriHeadingIdsPlugin(), faqPagesPlugin];
const renderer = await createSatteriMarkdownProcessor({
  syntaxHighlight: false,
  hastPlugins: plugins,
});
const render = (source, faq = true) =>
  renderer.render(source, { frontmatter: { faq } });
function elements(html, tag) {
  const found = [];
  function visit(node) {
    if (node.tagName === tag) found.push(node);
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(html));
  return found;
}
const attrs = (node) =>
  Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');

test('Markdown questions generate accordions with rich answers and stable anchors', async () => {
  const { code } = await render(`Intro before questions.

## What is **MeshCore**? [#about]

Answer with [a link](https://meshcore.io).

### More detail

- First item
- Second item

\`\`\`text
## This is a command comment, not a question
\`\`\`

## Can it work offline? [#offline]

| Setting | Value |
| --- | --- |
| Radio | LoRa |
`);
  assert.equal(elements(code, 'details').length, 2);
  assert.deepEqual(
    elements(code, 'h2').map((node) => attrs(node).id),
    ['about', 'offline'],
  );
  assert.equal(text(elements(code, 'strong')[0]), 'MeshCore');
  assert.equal(elements(code, 'h3').length, 1);
  assert.equal(elements(code, 'li').length, 2);
  assert.equal(elements(code, 'table').length, 1);
  assert.equal(
    elements(code, 'a')[0].attrs.find((attr) => attr.name === 'href').value,
    'https://meshcore.io',
  );
  assert.doesNotMatch(code, /\[#about\]/);
  assert.match(code, /Intro before questions/);
});

test('ordinary headings get automatic IDs and each FAQ page is independent', async () => {
  for (let i = 0; i < 2; i++) {
    const { code } = await render(
      '## How does it work?\n\nOne answer.\n\n## How does it work?\n\nAnother answer.',
    );
    assert.deepEqual(
      elements(code, 'h2').map((node) => attrs(node).id),
      ['how-does-it-work', 'how-does-it-work-1'],
    );
  }
});

test('normal articles remain normal articles', async () => {
  const { code } = await render('## A normal heading\n\nArticle text.', false);
  assert.equal(elements(code, 'details').length, 0);
  assert.equal(elements(code, 'h2').length, 1);
});

test('MDX components and imports remain inside generated answers', async () => {
  const { code } = await mdxToJs(
    `import Widget from './Widget.astro';

## Live data? [#live]

<Widget count={3} />

## Another question?

Another answer.
`,
    { hastPlugins: plugins, data: { astro: { frontmatter: { faq: true } } } },
  );
  assert.match(code, /import Widget/);
  assert.match(code, /Widget/);
  assert.match(code, /faq-answer/);
  assert.match(code, /data-faq-item/);
  assert.doesNotMatch(code, /\[#live\]/);
});

test('embedded FAQ components in normal MDX articles are left alone', async () => {
  const { code } = await mdxToJs(
    `import FAQ from './FAQ.astro';
import Question from './Question.astro';

## Normal section

<FAQ>
<Question id="mini" question="Mini FAQ?">

Answer.

</Question>
</FAQ>
`,
    { hastPlugins: plugins, data: { astro: { frontmatter: { faq: false } } } },
  );
  assert.match(code, /Question/);
  assert.match(code, /Mini FAQ/);
  assert.doesNotMatch(code, /data-faq-item/);
});

test('invalid FAQ declarations fail with useful errors', async () => {
  await assert.rejects(render('Just prose.'), /needs at least one ## question/);
  await assert.rejects(
    render('## Question? [#Bad ID]\n\nAnswer.'),
    /Invalid FAQ anchor/,
  );
  await assert.rejects(
    render('## First? [#same]\n\nAnswer.\n\n## Second? [#same]\n\nAnswer.'),
    /Duplicate FAQ anchor/,
  );
});
