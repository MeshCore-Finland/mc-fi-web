# Contributing content

Use Markdown for ordinary articles and MDX when you need screenshots, FAQ entries, tabs or interactive examples. You do not need to edit React components to contribute content.

## Run and check

Use Node 24 (see `.node-version`).

```sh
npm ci
npm run dev
```

Optional formatting: `npm run format`. Before submitting:

```sh
npm run build
npm run preview
```

The build checks types, runs tests, generates the search index and validates internal document links, section anchors and duplicate IDs. Global search is available in the built preview, not the development server. CI runs the same build on pushes and pull requests.

## Add an article or subsection

Start in `src/content/docs/fi/`. Choose a stable, language-independent path, for example `companions/channels.md`. Put its English equivalent at `src/content/docs/en/companions/channels.md`; translations use matching paths. Finnish is the default source for new content, and Starlight serves it with a notice where a translation is missing.

```md
---
title: Kanavat
description: Kanavien lisääminen companion-laitteeseen.
---

Lyhyt johdanto.

## Lisää kanava

Kirjoita ohje tähän.
```

The title is rendered automatically; start article headings at `##`. Add the document path to the shared sidebar once, without a language prefix. A new subsection can use this entry in `astro.config.mjs`:

```js
{
  label: 'Companion-laitteet',
  translations: { en: 'Companion devices' },
  items: ['companions/channels'],
},
```

Add paths after their Finnish documents exist. Titles and descriptions live in each translated article, not in the sidebar configuration.

## Internal links

Ordinary Markdown links work, including relative URLs. For an MDX reference that automatically follows the reader's selected language, use:

```mdx
import DocLink from '@components/DocLink.astro';

<DocLink page="faq/general" anchor="contacts">
  Lisätietoa kontakteista
</DocLink>
```

The destination is the document path, not a filename: no `/fi/`, leading slash or `.mdx`. Use the same stable FAQ anchors in every translation. Standard Markdown headings generate anchors from their text, so translated headings may have different anchors.

## FAQ pages

Each category is a separate document: `faq/general.mdx`, `faq/companions.mdx`, `faq/repeaters.mdx`, etc. Add it to the sidebar like an ordinary article. One FAQ wrapper per page provides a local filter; global search indexes all categories and their answers.

```mdx
---
title: Companion-laitteiden kysymyksiä
description: Käytännön vastauksia companion-laitteista.
tableOfContents: false
---

import FAQ from '@components/FAQ.astro';
import Question from '@components/Question.astro';

<FAQ>
  <Question id="bluetooth-connection" question="Miten yhdistän puhelimen laitteeseen?">

Kirjoita vastaus tavallisena Markdownina. Voit käyttää listoja, linkkejä ja komponentteja.

  </Question>
</FAQ>
```

Question IDs must be unique on the page, start with a lowercase letter and contain only lowercase letters, digits and hyphens. Keep an ID when editing its question text. English uses the same ID with translated question and answer text.

## Workflow tabs

Use Starlight's native tabs. All workflow tab groups use `syncKey="interface"` and consistent labels within each language. Selection carries through steps and page navigations; changing language may reset it. JavaScript is required for tab interaction.

````mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

## 1. Vaihda nimi

<Tabs syncKey="interface">
  <TabItem label="Verkkokäyttöliittymä">

Kirjoita verkkokäyttöliittymän ohje tähän.

  </TabItem>
  <TabItem label="Mobiilisovellus">

Kirjoita mobiilisovelluksen ohje tähän.

  </TabItem>
  <TabItem label="Komentorivi">

```text
get name
```

  </TabItem>
</Tabs>
````

English labels are `Web GUI`, `Mobile app` and `Command line`. Omit a method when the operation does not support it. Other kinds of tabs can use their own sync key or no synchronization. Name the actual app and firmware being described; preserve commands and configuration keys in their original language.

## Screenshots

Keep originals in `src/assets/screenshots/`, grouped by application and the UI language shown. Articles in different languages can reuse the same image. Use the `@screenshots` alias to avoid counting directory levels:

```mdx
import Screenshot from '@components/Screenshot.astro';
import settings from '@screenshots/mobile-app/en/repeater-settings.png';

<Screenshot
  src={settings}
  alt="Toistimen asetukset ja nimikenttä"
  caption="Muuta nimi laitteen asetuksissa."
/>
```

Add the referenced image first. The component generates responsive images and a link to the original. Default width is 360px; use `width={720}` for desktop screenshots. Localize alt text and captions. See `src/assets/screenshots/README.md` for file conventions.

## Review dates and translation freshness

These optional fields record actual human checks. Quote dates in `YYYY-MM-DD` format:

```yaml
lastReviewed: '2026-10-02'
translationChecked: '2026-10-02'
```

`lastReviewed` means the technical instructions were checked. `translationChecked` belongs on translated articles and means someone compared the translation with its Finnish source. Dates appear below the article when present. Omit them until a check has actually happened; saving a file is not a review.

When changing Finnish content, update the English equivalent or flag translation review in the PR description. A translation can remain unchanged after comparison; update its review date when appropriate. Dates are evidence of review, not an automatic claim that content is current. There is no age-based warning or publishing block.

## Pull requests

Branch or fork from `codex/starlight-prototype` while this is the working base, and target that branch with your PR. It has independent history from the old site. Describe the subsection changed and any translation review still needed. Cloudflare previews branches in the main repository; Vercel remains configured for external PR previews.

For review, check your links, the corresponding language page, and any tabs or screenshots at a narrow viewport. Deployment configuration and the eventual production cutover are maintained separately.

## Shared components and UI labels

Site UI text lives in `src/content/i18n/fi.json` and `en.json`. Astro components use Starlight's `Astro.locals.t()`. The schema checks that both dictionaries contain the custom UI keys. Articles supply their own prose; they do not need a translation API.

`CommandBuilder.astro` owns the translation and hydration of the repeater-name example. `NetworkStats.astro` wraps an expendable widget in `src/components/temporary/`; its metrics and endpoints are not a framework API. The homepage map still contains prototype locations until a real feed replaces them.
