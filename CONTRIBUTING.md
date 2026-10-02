# Contributing content

Use Markdown for ordinary articles and full FAQ pages. Use MDX when you need screenshots, tabs, embedded mini-FAQs or interactive examples. You do not need to edit React components to contribute content.

## First-time setup

You need Git, Node.js 24 and a text editor. This setup works on macOS, Linux and Windows; run the commands in Terminal or PowerShell.

- Install [Git](https://git-scm.com/downloads) if it is not already available.
- Install **Node.js 24** from the [official Node.js download page](https://nodejs.org/en/download). Select version 24; npm is included. If you already use a Node version manager, select the version in `.node-version` with it.
- Reopen your terminal after installation and check:

```sh
git --version
node --version
npm --version
```

Node should print `v24.x.x`. You do not need to install Astro globally, set up a backend, or obtain deployment credentials to edit and preview content.

### Get the working branch

The new site currently lives on `codex/starlight-prototype`. The repository's default branch still contains the old site.

If you have write access to the main repository:

```sh
git clone --branch codex/starlight-prototype https://github.com/MeshCore-Finland/mc-fi-web.git
cd mc-fi-web
git switch -c docs/your-topic
```

Replace `docs/your-topic` with a name for your contribution, for example `docs/companion-channels`.

If you do not have write access, [fork the repository on GitHub](https://github.com/MeshCore-Finland/mc-fi-web/fork) first. Replace `YOUR_USERNAME` below with your GitHub username:

```sh
git clone https://github.com/YOUR_USERNAME/mc-fi-web.git
cd mc-fi-web
git remote add upstream https://github.com/MeshCore-Finland/mc-fi-web.git
git fetch upstream
git switch -c docs/your-topic upstream/codex/starlight-prototype
```

This fetches the new site even if your fork initially contains only the old default branch. In both cases, your contribution branch starts from the prototype; keep the old site out of your changes.

## Live preview while editing

Run these commands from the `mc-fi-web` directory, where `package.json` lives:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal, normally [http://localhost:4321/fi/](http://localhost:4321/fi/). Use `/en/` for English. Leave the command running while you edit: saving an article updates the browser automatically. Stop the server with **Ctrl+C**.

For a first edit, open `src/content/docs/fi/guides/getting-started.mdx`, change a sentence, and save. The article is at `/fi/guides/getting-started/`. The file path after `fi/`, without `.md` or `.mdx`, becomes its URL path. See the examples below when adding your own page.

The FAQ's local filter works during development. Site-wide search requires a built search index, so check it using the built preview.

## Check the finished site

Stop the development server, then run:

```sh
npm run build
npm run preview
```

Open the URL printed by `preview`. This serves the generated static site and includes site-wide search. **It does not update when you edit files**: stop it, rebuild and restart it to see later changes. Use `dev` for everyday editing.

The build checks types, runs tests, generates the search index and validates internal document links, section anchors and duplicate IDs. CI runs the same build on pushes and pull requests.

Optional formatting: `npm run format` formats the repository. Check `git diff` afterward and include only changes relevant to your contribution. If dependencies change after you pull updates, run `npm ci` again.

### Common setup problems

- **`node`, `npm` or `git` is not found:** finish installing that tool and reopen the terminal.
- **Node version errors:** check `node --version` in the same terminal you use to run the site; it must use Node 24.
- **`package.json` cannot be found:** change into the cloned `mc-fi-web` directory before running npm commands.
- **The port is already in use:** use the alternative URL printed by Astro, or run `npm run dev -- --port 4322`.
- **An MDX edit fails:** read the terminal error for its file and line. Check closing component tags and keep blank lines around Markdown inside components. Literal braces in prose may need escaping; put commands in fenced code blocks.
- **Site-wide search is unavailable:** use `npm run build` followed by `npm run preview`; the development server does not generate the index.

## Add an article or subsection

Start in `src/content/docs/fi/`. Choose a stable, language-independent path, for example `companions/channels.md`. Put its English equivalent at `src/content/docs/en/companions/channels.md`; translations use matching paths. Finnish is the default source for new content. If the English file is missing, Starlight serves the Finnish article under its `/en/` URL with English navigation and an untranslated-content notice. This fallback uses Finnish as the source; an English-only article does not automatically get a Finnish route.

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

Each category is a separate document: `faq/general.md`, `faq/companions.md`, `faq/repeaters.md`, etc. Use `.mdx` if answers need components. Add the page to the sidebar like an ordinary article.

Set `faq: true` in frontmatter. Each top-level `##` heading becomes a question, and everything up to the next `##` becomes its answer. Introductory text before the first question remains visible. Use `###` or deeper headings within answers; headings inside code blocks and blockquotes do not create questions.

```md
---
title: Companion-laitteiden kysymyksiä
description: Käytännön vastauksia companion-laitteista.
faq: true
tableOfContents: false
---

Lyhyt johdanto.

## Miten yhdistän puhelimen laitteeseen? [#bluetooth-connection]

Kirjoita vastaus tavallisena Markdownina.

## Mitä teen jos yhteys katkeaa?

Seuraava vastaus. Listat, linkit, taulukot ja koodilohkot toimivat normaalisti.
```

You do not need to import or wrap FAQ components for a full FAQ page. The generator adds the accordion and local text filter at build time. Site-wide search indexes all FAQ pages and their answers, and a question link opens the corresponding answer.

The optional `[#bluetooth-connection]` suffix sets a stable anchor and is removed from the displayed question. Use the same suffix in Finnish and English when sharing question links across translations. IDs must start with a lowercase letter and contain only lowercase letters, digits and hyphens; they must be unique on the page. Keep them when editing question text. Without a suffix, the heading gets the usual automatic anchor derived from its text.

In an MDX FAQ, import components as usual and place them inside answers. For example:

```mdx
import RadioSettings from '@components/RadioSettings.astro';

## Mitä radioasetuksia käytetään? [#settings]

<RadioSettings />
```

### Mini-FAQs inside other articles

Keep the article as an ordinary MDX page (omit `faq: true`). The explicit components remain available for a small FAQ alongside regular sections, or several independent FAQ blocks. Each block gets its own filter.

```mdx
import FAQ from '@components/FAQ.astro';
import Question from '@components/Question.astro';

## Vianetsintä

Tavallinen ohjeosio.

<FAQ>
  <Question id="bluetooth-connection" question="Miten yhdistän puhelimen laitteeseen?">

Kirjoita vastaus tavallisena Markdownina.

  </Question>
</FAQ>
```

Question IDs must be unique across the whole article, including its ordinary heading IDs and other mini-FAQ blocks. On generated FAQ pages, use question headings instead of mixing in manual FAQ blocks.

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

## Submit a pull request

Before submitting, run `npm run build` and check your changed pages in the browser: links, the corresponding language page, and any tabs or screenshots at a narrow viewport. Review your changes and commit them:

```sh
git status
git diff
```

Stage the files you intended to change with `git add <file-path>` (replace the placeholder with actual paths), then:

```sh
git commit -m "Document companion channels"
git push -u origin docs/your-topic
```

Use your own commit message and the branch name you chose during setup. The first push may ask you to authenticate with GitHub; use your usual GitHub authentication method.

Open a pull request on GitHub with **base repository `MeshCore-Finland/mc-fi-web` and base branch `codex/starlight-prototype`**, selecting your contribution branch as the head. Fork contributors select their fork as the head repository. Target this branch while it is the working base; its history is independent from the old site.

Describe what changed, how you checked it, and any English translation review still needed. Subsequent commits pushed to the same branch update the PR.

Cloudflare previews branches pushed to the main repository; Vercel remains configured for external PR previews. After deployment finishes, use the preview link in the PR's deployment check or bot comment. The shared [prototype preview](https://codex-starlight-prototype.mc-fi-web.pages.dev/fi/) shows the latest prototype branch, not your unmerged contribution. Check that CI passes before asking for review. Deployment configuration and the eventual production cutover are maintained separately.

## Shared components and UI labels

Site UI text lives in `src/content/i18n/fi.json` and `en.json`. Astro components use Starlight's `Astro.locals.t()`. The schema checks that both dictionaries contain the custom UI keys. Articles supply their own prose; they do not need a translation API.

`CommandBuilder.astro` owns the translation and hydration of the repeater-name example. `NetworkStats.astro` wraps an expendable widget in `src/components/temporary/`; its metrics and endpoints are not a framework API. The homepage map still contains prototype locations until a real feed replaces them.
