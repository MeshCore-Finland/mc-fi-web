# MeshCore Finland — Starlight base

Astro + Starlight + MDX with a custom homepage, documentation sidebar and symmetric `/fi/` and `/en/` URLs. Finnish is the default content language; `/` redirects to `/fi/`.

Work is on the independent-history branch `codex/starlight-prototype`, published to `upstream`. Production remains on the old `dev` branch until the one-time replacement.

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

[Finnish preview](https://codex-starlight-prototype.mc-fi-web.pages.dev/fi/) · [English preview](https://codex-starlight-prototype.mc-fi-web.pages.dev/en/)

Cloudflare previews pushes to this branch. Vercel remains configured for external pull-request previews. Production branch settings have not been changed.

## Current content and temporary features

The general FAQ was carried over from old `dev` at `faedef5`; Finnish answers were translated and edited. Exact technical claims and app instructions still need editorial review. No review dates have been invented for this material.

The repeater-name guide demonstrates native synchronized Web / Mobile / CLI tabs and a command builder. Switching language may reset the tab selection. JavaScript is required for interactive features. FAQ categories can be split into separate pages with their own local filters; Pagefind searches all categories.

The Finland silhouette includes Åland and is hidden on mobile. Its dots are bundled example locations, identified as prototype data in the accessible label. See [the map data description](src/data/README.md).

`NetworkStats.astro` and `src/components/temporary/` contain the disposable stats widget, including its fetch logic and styles. It retains the previous API endpoints, geographical bounds and 1,000-node limit; its repeater metric is not a complete network total. Replace the wrapper and temporary directory during the planned overhaul.

## Production replacement

Preserve the old branch tips, promote the accepted new base and change Cloudflare's production branch deliberately. The site is replaced in one go; no legacy hash-route compatibility layer is included. This branch is not intended to merge into the unrelated old history.
