// Opt-in transform for full FAQ documents. Embedded FAQ components are untouched.
const element = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

function questionHeading(node) {
  if (node.type !== 'element') return;
  if (node.tagName === 'h2') return node;
  // Starlight has already added heading IDs and anchor-link wrappers.
  if (
    node.tagName === 'div' &&
    String(node.properties?.class ?? '')
      .split(' ')
      .includes('sl-heading-wrapper')
  ) {
    return node.children.find(
      (child) => child.type === 'element' && child.tagName === 'h2',
    );
  }
}

function titleAndId(heading) {
  const children = [...heading.children];
  const last = children.at(-1);
  let id = heading.properties?.id;
  if (last?.type === 'text') {
    const match = last.value.match(/\s+\[#([^\]]+)\]\s*$/);
    if (match) {
      id = match[1];
      if (!/^[a-z][a-z0-9-]*$/.test(id))
        throw new Error(`Invalid FAQ anchor: ${id}`);
      children[children.length - 1] = {
        ...last,
        value: last.value.slice(0, match.index),
      };
    }
  }
  return { children, id };
}

export function faqPagesPlugin({ data }) {
  if (data.astro?.frontmatter.faq !== true) return;
  return {
    name: 'meshcore-faq-pages',
    before(root, ctx) {
      const output = [];
      const ids = new Set();
      let answer;
      for (const node of root.children) {
        const heading = questionHeading(node);
        if (!heading) {
          (answer ?? output).push(node);
          continue;
        }
        const { children, id } = titleAndId(heading);
        if (!id)
          throw new Error(
            'FAQ headings must have an ID before the FAQ transform runs.',
          );
        if (ids.has(id)) throw new Error(`Duplicate FAQ anchor: ${id}`);
        ids.add(id);
        answer = [];
        output.push(
          element('details', { class: 'faq-question', 'data-faq-item': true }, [
            element('summary', {}, [
              element('h2', { ...heading.properties, id }, [
                element('span', { 'data-faq-title': true }, children),
                element(
                  'span',
                  {
                    class: 'faq-plus',
                    'aria-hidden': 'true',
                    'data-pagefind-ignore': true,
                  },
                  [{ type: 'text', value: '+' }],
                ),
                element('span', {
                  class: 'faq-excerpt',
                  'data-faq-excerpt': true,
                  hidden: true,
                  'data-pagefind-ignore': true,
                }),
              ]),
            ]),
            element('div', { class: 'faq-answer' }, answer),
          ]),
        );
      }
      if (!ids.size)
        throw new Error(
          'A page with faq: true needs at least one ## question heading.',
        );
      ctx.replaceNode(root, { type: 'root', children: output });
    },
  };
}

// Register after Starlight so its heading IDs exist and its decorative heading
// links can be removed from question summaries. MDX inherits this processor.
export default function faqPages() {
  return {
    name: 'meshcore-faq-pages',
    hooks: {
      'astro:config:setup': ({ config }) => {
        config.markdown.processor.options.hastPlugins.push(faqPagesPlugin);
      },
    },
  };
}
