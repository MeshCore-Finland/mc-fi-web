# MeshCore Finland — Starlight prototype

A fresh Astro + Starlight + MDX site on the orphan branch `codex/starlight-prototype`. Development is isolated from the original `dev` checkout. No branches have been renamed or pushed.

## Run

Requires Node.js 22.12+ (or a compatible newer version; this prototype was built with Node 24).

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Search is generated during a production build. Use `npm run build` and `npm run preview` when evaluating site-wide search.

## What to evaluate

- `/fi/` and `/en/`: custom community homepage, shared design, Finnish flag blue in light mode, ice blue in dark mode, and live API statistics.
- `/fi/faq/general/` and `/en/faq/general/`: migrated Q&A, local filtering of questions and answers, excerpts and stable deep links.
- `/fi/repeaters/name/` and its English counterpart: synchronized Web / Mobile / CLI tabs and an interactive command builder.
- `/en/repeaters/placement/`: intentionally untranslated. Starlight provides the Finnish content with a fallback notice.
- `/` redirects to `/fi/`. Both languages always have URL prefixes.

The homepage shows a Natural Earth outline of Finland with deterministic example repeater dots, clearly labelled as prototype data. It is hidden on mobile. The [map data contract](src/data/README.md) prepares for a later backend JSON or MessagePack location feed; no live location feed is connected yet. Statistics use the existing CoreScope and MeshShark APIs. The observed-repeater metric retains the old site's coordinate bounds and 1,000-node API limit; it is not a complete count of all Finnish repeaters.

## Authoring and languages

Put Finnish content in `src/content/docs/fi/` and English translations in `src/content/docs/en/`. Matching relative filenames identify translations. Define the sidebar once in `astro.config.mjs`; page titles come from translated frontmatter.

Use `DocLink` for internal references so an author only maintains the destination page ID:

```mdx
import DocLink from '@components/DocLink.astro';

<DocLink page="faq/general" anchor="contacts">Read about contacts</DocLink>
```

Use one `FAQ` wrapper per FAQ page and put Markdown answers inside `Question` entries. IDs must be stable across languages:

```mdx
import FAQ from '@components/FAQ.astro';
import Question from '@components/Question.astro';

<FAQ>
  <Question id="contacts" question="Why are there no contacts?">

The answer is ordinary Markdown, with **formatting**, lists and links.

  </Question>
</FAQ>
```

Q&A is rendered into static HTML, including collapsed answers. Pagefind indexes question headings with their IDs; search hits can link directly to an answer. The local filter is progressive enhancement: all questions remain available without JavaScript.

Use `InterfaceTabs` with a unique ID for each step. The named slots are `web`, `mobile` and `cli`. Selection is stored by stable method ID, so translated labels do not break synchronization. Add `?interface=cli` to preselect an interface when sharing a link. Optional `methods` lists support steps with fewer interfaces.

Shared resources and radio values live in `src/lib/site.ts`. Interactive React components use `client:visible` so their HTML renders statically and browser code starts when needed.

## Screenshots

Keep source screenshots in `src/assets/screenshots/`, with stable filenames grouped by app and the **UI language shown**. Finnish and English articles can import the same file. The [screenshot conventions](src/assets/screenshots/README.md) explain sizing and replacement.

```mdx
import Screenshot from '@components/Screenshot.astro';
import settings from '../../../assets/screenshots/mobile-app/en/repeater-settings.png';

<Screenshot
  src={settings}
  alt="Repeater settings with the name field selected"
  caption="Change the name in the repeater settings."
/>
```

This example assumes an article in `src/content/docs/en/` and an image you have added. From a nested guide directory, add another `../` to the import path. The component generates responsive WebP images, reserves their layout space, loads them lazily and links to the original PNG. Localize the alt text and caption; the image itself need not be duplicated. The full-size link label follows the content language. For desktop screenshots, use `width={720}`.

## Content provenance and limits

English FAQ answers were carried over from `dev` at `faedef5`; Finnish answers were translated and lightly edited. An overly broad installation-permission statement was narrowed to network admission. Content and exact mobile/web UI instructions need editorial review before launch. CLI name commands are linked to the upstream MeshCore command reference.

The prototype intentionally contains a small guide collection and one untranslated page. Live map location data, translation freshness tracking, legacy hash-link handling and publishing CI remain later work.

## If we adopt it

1. Review the content, design, accessibility and publishing target.
2. Preserve the existing remote branch tips under agreed `v1/*` names.
3. Choose the new mainline branch names and switch the remote default branch deliberately.
4. Publish the fresh history, update deployment settings and preserve old-link compatibility.

Because this branch has unrelated history, it is not intended to be merged normally into the old site. The cutover should happen only after the prototype is accepted.

## Verification

The production build and four FAQ filter tests pass. Browser checks confirmed answer-text filtering, question-level global search links, automatic answer opening, synchronized interface tabs, keyboard selection, command generation, language switching, and both colour themes. At a 390px viewport the homepage map is hidden and the page has no horizontal overflow. Astro currently emits upstream bundler warnings about the MDX head-injection directive; the imported components and their browser scripts were verified in the production preview.
