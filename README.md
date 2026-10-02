# MeshCore Finland — Starlight base

Astro + Starlight + MDX with a custom homepage, documentation sidebar and symmetric `/fi/` and `/en/` URLs. Finnish is the default content language; `/` redirects to `/fi/`.

Work is on the independent-history branch `dev`, published to `upstream`. Production builds from `main`, which contains the old live site until the one-time replacement. Content contributions target `dev`.

## Development

Use Node 24 (`.node-version`). For installation, cloning the correct branch and submitting your first change, start with [first-time setup in CONTRIBUTING.md](CONTRIBUTING.md#first-time-setup).

```sh
npm ci
npm run dev
```

This starts a live preview; use the local URL printed in the terminal. Stop it with Ctrl+C before checking the built site:

```sh
npm run build
npm run preview
```

The build checks types, runs tests, builds Pagefind search and validates generated internal links, anchors and duplicate IDs. GitHub Actions, Cloudflare and Vercel use the same build command. Search is available after a production build; use `preview` to evaluate it locally.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for copyable article, subsection, FAQ, workflow-tab and screenshot examples, optional review dates, and PR instructions. Authors work in Markdown/MDX; React editing is not required.

Matching document paths associate translations. Starlight handles missing translations, UI dictionaries, language navigation and synchronized tabs. `DocLink` is a thin MDX convenience over Astro's native locale-aware URL helper. `Screenshot` uses Astro's image processing. Custom UI labels live in the Starlight i18n collection.

## Preview

[Finnish preview](https://dev.mc-fi-web.pages.dev/fi/) · [English preview](https://dev.mc-fi-web.pages.dev/en/)

Cloudflare builds `main` for production and previews pushes to `dev`. Vercel provides external pull-request previews.

## Current content and temporary features

The general FAQ was carried over from old `dev` at `faedef5`; Finnish answers were translated and edited. Exact technical claims and app instructions still need editorial review. No review dates have been invented for this material.

The repeater-name guide demonstrates native synchronized Web / Mobile / CLI tabs and a command builder. Switching language may reset the tab selection. JavaScript is required for interactive features. Full FAQ pages use `faq: true` and ordinary `##` question headings, with optional stable anchors such as `[#contacts]`. They work in Markdown or MDX and each category gets its own local filter; Pagefind searches all categories. The explicit `FAQ` and `Question` components remain available for mini-FAQs embedded in ordinary MDX articles.

The Finland silhouette includes Åland and is hidden on mobile. Its dots are bundled example locations, identified as prototype data in the accessible label. See [the map data description](src/data/README.md).

`NetworkStats.astro` and `src/components/temporary/` contain the disposable stats widget, including its fetch logic and styles. It retains the previous API endpoints, geographical bounds and 1,000-node limit; its repeater metric is not a complete network total. Replace the wrapper and temporary directory during the planned overhaul.

## Production replacement

When the new site is ready, preserve the old `main` tip as `legacy_v1`, then replace `main` with the accepted `dev` history. Production remains configured to build from `main`. The histories are independent, so this is a deliberate branch replacement rather than a normal merge. Use a lease when replacing the remote branch so intervening updates cannot be overwritten accidentally. The site is replaced in one go; no legacy hash-route compatibility layer is included.
