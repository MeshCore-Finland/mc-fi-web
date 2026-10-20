# Contributing content

This guide is for editing the source of [meshcore.fi](https://meshcore.fi/). The public website contains the MeshCore guides, FAQs and community pages; this repository contains the files used to build them.

Use Markdown for ordinary articles and full FAQ pages. Use MDX when you need screenshots, tabs, embedded mini-FAQs or interactive examples. You do not need to edit React components to contribute content.

## License and contribution terms

This project's code and content are licensed under the [MIT License](LICENSE). By submitting a contribution, you agree that it is provided under that same license. This applies to code, documentation, translations, images and other contributed material.

Only submit material that you have the right to license under the MIT License. **Do not contribute if you do not agree to these terms.** Contributors are listed in [AUTHORS](AUTHORS), alphabetically by GitHub username.

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

Start contributions from `dev` and open pull requests against `dev`. The production branch is `main`, which Cloudflare Pages builds for [meshcore.fi](https://meshcore.fi/).

If you do not have write access, [fork the repository on GitHub](https://github.com/MeshCore-Finland/mc-fi-web/fork) first. With or without a fork, clone the source and create your contribution branch from `dev`:

```sh
git clone --branch dev https://github.com/MeshCore-Finland/mc-fi-web.git
cd mc-fi-web
git switch -c docs/your-topic
```

Replace `docs/your-topic` with a name for your contribution, for example `docs/companion-channels`.

When submitting, push your branch to this repository if you have write access, or to your fork. The [pull-request instructions](#submit-a-pull-request) include both commands.

## Live preview while editing

Run these commands from the `mc-fi-web` directory, where `package.json` lives:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal, normally [http://localhost:4321/fi/](http://localhost:4321/fi/). Use `/en/` for English. Leave the command running while you edit: saving an article updates the browser automatically. Stop the server with **Ctrl+C**.

For a first edit, open `src/content/docs/fi/users/start.mdx`, change a sentence, and save. The article is at `/fi/users/start/`. The file path after `fi/`, without `.md` or `.mdx`, becomes its URL path. See the examples below when adding your own page.

The FAQ's local filter works during development. Site-wide search requires a built search index, so check it using the built preview.

## Check the finished site

Stop the development server, then run:

```sh
npm run build
npm run preview
```

Open the URL printed by `preview`. This serves the generated static site and includes site-wide search. **It does not update when you edit files**: stop it, rebuild and restart it to see later changes. Use `dev` for everyday editing.

The build checks types, runs tests, generates the search index and reports warnings for broken internal document links, section anchors and duplicate IDs. These warnings do not fail local builds or PR previews. GitHub Actions displays them as warning annotations on pushes and pull requests.

For pull requests targeting `dev` or `main`, CI also runs the Python exporter unit tests as part of `build`, plus a separate strict `links` check against the generated site. The link check fails if any issues remain, while the preview build can still succeed with warnings. Making `build` and `links` required in the target branch's ruleset blocks merging until those issues are fixed. Only pushes to `dev` or `main` run a separate push build; the separate link jobs run on PRs. Before merging, run `npm run check:links` after building to check strictly yourself. Rebasing locally does not trigger CI; pushing updates to an open PR triggers its checks. Python is needed locally only when working on the exporter; see [its guide](docs/repeater-bundle.md).

On PRs targeting `dev` or `main`, the separate `external-links` check visits external HTTP/HTTPS URLs from the built pages, follows redirects and retries transient failures. It checks responses, not anchors on external sites, and skips private network addresses. Open the check's job summary or download its `external-link-report` artifact for failed URLs, source pages and HTTP/network errors. This check is **not required for merging** and does not affect preview builds; the merge approver should review failures for broken destinations, temporary outages or sites that block automated requests. Only `build` and `links` belong in the required checks.

The [CI workflow reference](docs/ci.md) lists exact triggers and conditions for every workflow, including release PR checks and the separate scheduled bundle publisher.

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

The title is rendered automatically; start article headings at `##`. Add the document path to the shared sidebar once, without a language prefix. A new subsection can use this entry in `sidebar.config.mjs`, which is imported by `astro.config.mjs`:

```js
{
  label: 'Companion-laitteet',
  translations: { en: 'Companion devices' },
  // prettier-ignore
  items: [
    'companions/channels',
  ],
},
```

Add paths after their Finnish documents exist. Keep each page on its own line; comment out an entry to hide it from the sidebar without removing the page. The `prettier-ignore` comment preserves this layout when formatting. Titles and descriptions live in each translated article, not in the sidebar configuration.

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

## Regional maps

Use `RegionMap` inside any MDX article or section:

```mdx
import RegionMap from '@components/RegionMap.astro';

<RegionMap region="paakaupunkiseutu" />
```

Available presets are `paakaupunkiseutu`, `vihti-lohja`,
`hyvinkaa-riihimaki-loppi`, `kotka`, `turku` and `pirkanmaa`. Add new presets
in `src/lib/region-maps.ts`, with a name and geographic bounds. Bounds only set
the initial viewport and reset position. Every map includes all repeaters from
the shared snapshot, so neighbouring repeaters stay available when panning.
The repeater count and name list follow the visible viewport.
Optionally set `meshmapper` to the region's MeshMapper subdomain to enable the
coverage tab. For border areas, use an array such as `['tmp', 'finland']` to
offer a source selector; the first entry is the default. All sources start at
the same viewport, and each iframe loads only when first selected. Single-source
maps have no selector. No API key is needed.

Pass an optional `coverageNote` in MDX to explain local coverage limitations:

```mdx
<RegionMap
  region="hyvinkaa-riihimaki-loppi"
  coverageNote="Alueen mittaukset jakautuvat kahteen karttalähteeseen. Tarkista sekä TMP että FINLAND saadaksesi kattavamman kuvan."
/>
```

The note appears only in the coverage view. Keep it in the article's language.
Both views and each coverage source keep their state when switching.
The reset button restores only the active view or selected source to the
region's initial position; MeshMapper embeds reload with repeater markers hidden.
The full-map link follows the selected source.

Repeater locations reuse the homepage's daily snapshot and shared request.
Set `PUBLIC_REPEATER_BUNDLE_URL`, or pass `bundleUrl` to the component, to test
another endpoint. Multiple components can appear independently on one page.
The OpenStreetMap basemap loads only when the component becomes visible.
Keep its attribution visible and respect the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Review dates and translation freshness

Finnish is the source of truth. These fields record completed checks, not file edits. Quote dates in `YYYY-MM-DD` format. On Finnish articles, the optional validity date is:

```yaml
lastReviewed: '2026-10-02'
```

On English articles, record a full comparison with Finnish using:

```sh
npm run check:translations -- --stamp users/start --date 2026-10-21
```

Use the actual page path and comparison date. The command writes `translationChecked` and a generated `translationSourceHash` fingerprint.

`lastReviewed` means a reviewer checked that the technical instructions remain valid. `translationChecked` records the last full comparison with Finnish; assisted checks count, and it does not imply human approval or technical validity. Dates appear below the article when present. Do not copy or advance the Finnish validity date during translation.

Run `npm run check:translations` to find missing, unchecked, changed-source or orphaned English pages. The report is advisory; add `-- --strict` for a failing exit status when work remains. The fingerprint detects Finnish changes without being affected by review-date changes. It does not certify translation quality or track shared UI text.

When changing Finnish, update English or flag remaining translation work in the PR description. Preserve contributors' improvements when updating English. Wording-only PRs keep the comparison date and fingerprint; advance both only after a full comparison, even if no edits were needed. Factual corrections should update Finnish too. There is no age-based warning or publishing block. See [the translation workflow and glossary](docs/translations.md) for complete rules, report states and shared UI checks.

## Submit a pull request

Before submitting, run `npm run build` and check your changed pages in the browser: links, the corresponding language page, and any tabs or screenshots at a narrow viewport. Review your changes and commit them:

```sh
git status
git diff
```

Stage the files you intended to change with `git add <file-path>` (replace the placeholder with actual paths), then:

```sh
git commit -m "Document companion channels"
```

Push to the repository you have write access to. For contributors with access to this repository:

```sh
git push https://github.com/MeshCore-Finland/mc-fi-web.git docs/your-topic
```

For fork contributors, replace `YOUR_USERNAME` with your GitHub username:

```sh
git push https://github.com/YOUR_USERNAME/mc-fi-web.git docs/your-topic
```

Use your own commit message and the branch name you chose during setup. The first push may ask you to authenticate with GitHub; use your usual GitHub authentication method.

Open a pull request on GitHub with **base repository `MeshCore-Finland/mc-fi-web` and base branch `dev`**, selecting your contribution branch as the head. Fork contributors select their fork as the head repository.

Describe what changed, how you checked it, and any English translation review still needed. Subsequent commits pushed to the same branch update the PR.

Cloudflare previews branches pushed to this repository; Vercel provides fork PR previews. After deployment finishes, use the preview link in the PR's deployment check. The shared [dev preview](https://dev.mc-fi-web.pages.dev/fi/) shows the latest dev branch, not your unmerged contribution. Check that CI passes before asking for review. Maintainers publish reviewed changes through `main` to [meshcore.fi](https://meshcore.fi/). See [the CI guide](docs/ci.md) for deployment and validation details.

## Shared components and UI labels

Site UI text lives in `src/content/i18n/fi.json` and `en.json`. Astro components use Starlight's `Astro.locals.t()`. The schema checks that both dictionaries contain the custom UI keys. Articles supply their own prose; they do not need a translation API.

`CommandBuilder.astro` and `CommandBuilder.tsx` render interactive command examples. `FinlandMap.astro` loads the daily snapshot through `src/lib/repeater-bundle.ts`; see [the map data guide](src/data/README.md). `NetworkStats.astro` renders homepage statistics, with its fetch logic and styles in `src/components/temporary/`. Both counters read that same snapshot without live API polling. It excludes offline and imported-only repeaters; packet activity is collected from CoreScope for the previous Finnish calendar day and displayed with its date. The repeater count represents observed locations in the snapshot, not how many devices are currently online.
