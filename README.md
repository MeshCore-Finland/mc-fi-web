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

The build checks types, runs tests, builds Pagefind search and reports warnings for broken internal links, anchors and duplicate IDs. GitHub Actions, Cloudflare and Vercel use the same build command, so link warnings do not block PR previews. For PRs targeting `dev` or `main` and pushes to those branches, GitHub Actions runs a separate strict `links` check; requiring it in a branch ruleset blocks merging until issues are fixed. Run `npm run check:links` after building to check strictly yourself. Search is available after a production build; use `preview` to evaluate it locally.

CI also runs an advisory `external-links` check on the generated site. External HTTP failures appear in its job summary and downloadable `external-link-report` artifact, with the affected URLs and source pages. Keep this check optional in branch rulesets: the merge approver decides whether a failure needs fixing or is temporary. It runs separately from preview builds.

See [CI workflows and triggers](docs/ci.md) for the exact events, branch and file filters, job conditions, required checks, and explanations of duplicate or skipped checks.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for copyable article, subsection, FAQ, workflow-tab and screenshot examples, optional review dates, and PR instructions. Authors work in Markdown/MDX; React editing is not required.

Matching document paths associate translations. Starlight handles missing translations, UI dictionaries, language navigation and synchronized tabs. `DocLink` is a thin MDX convenience over Astro's native locale-aware URL helper. `Screenshot` uses Astro's image processing. Custom UI labels live in the Starlight i18n collection.

## Preview

[Finnish preview](https://dev.mc-fi-web.pages.dev/fi/) · [English preview](https://dev.mc-fi-web.pages.dev/en/)

Cloudflare builds `main` for production and previews pushes to `dev`. Vercel provides external pull-request previews.

## Current content and temporary features

The general FAQ was carried over from old `dev` at `faedef5`; Finnish answers were translated and edited. Exact technical claims and app instructions still need editorial review. No review dates have been invented for this material.

The repeater-name guide demonstrates native synchronized Web / Mobile / CLI tabs and a command builder. Switching language may reset the tab selection. JavaScript is required for interactive features. Full FAQ pages use `faq: true` and ordinary `##` question headings, with optional stable anchors such as `[#contacts]`. They work in Markdown or MDX and each category gets its own local filter; Pagefind searches all categories. The explicit `FAQ` and `Question` components remain available for mini-FAQs embedded in ordinary MDX articles.

The Finland silhouette includes Åland and is hidden on mobile. Its repeater dots load in the browser from the daily mc-shark bundle hosted in R2, independently of site builds. See [the map data description](src/data/README.md).

`NetworkStats.astro` and `src/components/temporary/` contain the disposable stats widget, including its fetch logic and styles. It retains the previous API endpoints, geographical bounds and 1,000-node limit; its repeater metric is not a complete network total. Replace the wrapper and temporary directory during the planned overhaul.

## Production replacement

When the new site is ready, preserve the old `main` tip as `legacy_v1`, then replace `main` with the accepted `dev` history. Production remains configured to build from `main`. The histories are independent, so this is a deliberate branch replacement rather than a normal merge. Use a lease when replacing the remote branch so intervening updates cannot be overwritten accidentally. The site is replaced in one go; no legacy hash-route compatibility layer is included.
