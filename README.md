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

The build checks types, runs tests, builds Pagefind search and reports warnings for broken internal links, anchors and duplicate IDs. GitHub Actions, Cloudflare and Vercel use the same build command, so link warnings do not block PR previews. For PRs targeting `dev` or `main`, GitHub Actions runs a separate strict `links` check; requiring it in a branch ruleset blocks merging until issues are fixed. Pushes run the build without separate link jobs. Run `npm run check:links` after building to check strictly yourself. Search is available after a production build; use `preview` to evaluate it locally.

PRs targeting `dev` or `main` also run an advisory `external-links` check on the generated site. External HTTP failures appear in its job summary and downloadable `external-link-report` artifact, with the affected URLs and source pages. Keep this check optional in branch rulesets: the merge approver decides whether a failure needs fixing or is temporary. It runs separately from preview builds.

See [CI workflows and triggers](docs/ci.md) for the exact events, branch and file filters, job conditions, required checks, and explanations of duplicate or skipped checks.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for copyable article, subsection, FAQ, workflow-tab and screenshot examples, optional review dates, and PR instructions. Authors work in Markdown/MDX; React editing is not required.

Matching document paths associate translations. Starlight handles missing translations, UI dictionaries, language navigation and synchronized tabs. `DocLink` is a thin MDX convenience over Astro's native locale-aware URL helper. `Screenshot` uses Astro's image processing. Custom UI labels live in the Starlight i18n collection.

## Preview

[Finnish preview](https://dev.mc-fi-web.pages.dev/fi/) · [English preview](https://dev.mc-fi-web.pages.dev/en/)

Cloudflare builds `main` for production and previews pushes to `dev`. Vercel provides external pull-request previews.

## Node contact placeholder

Edit page prose in `src/pages/node-contact.mdx`. It embeds `NodeContactForm` with `client:load`; React handles the interactive ID and KV lookup. The greeting heading (with an `{id}` placeholder) and reply-details note are component props editable directly in MDX. The shared `StarlightMdxPage.astro` layout keeps the page in the site shell.

Sticker URLs such as `/n/0FF1C3` use the Cloudflare Pages internal rewrite in `public/_redirects` to serve `/node-contact/` while preserving the sticker URL. The form reads the ID from that path or from `/node-contact/?id=0FF1C3` and disables editing when a valid ID is supplied. Opening `/node-contact/` without a valid ID leaves the required field editable. IDs must contain exactly six hex characters (0–9, A–F); lowercase IDs are normalized to uppercase. Leave reply contact details in the message, such as a phone number or email address. Sending remains disabled.

Astro's local dev/preview servers and Vercel do not apply this Cloudflare-specific rewrite. Use `/node-contact/?id=0FF1C3` to preview the populated form locally; verify `/n/0FF1C3` on a Cloudflare deployment.

The form fetches the owner's public greeting from `/api/node-contact/:id`. This Pages Function runs on Workers and reads `sticker:<UPPERCASE_ID>` from the `NODE_CONTACTS` KV binding. It returns only the ID and description, never private destination fields. Missing or disabled entries return 404; unavailable lookup returns 503. `public/_routes.json` restricts Function invocation to the lookup API so sticker rewrites stay static.

The Cloudflare Pages **preview** environment uses namespace `mcfi-node-contacts-preview` (`dfb4f3a1190f494b996476b4825e0a71`). Production needs its own `NODE_CONTACTS` binding before this feature is released. Example data is in `fixtures/node-contacts.json`; seed the preview namespace with:

```sh
npx wrangler@4 kv bulk put fixtures/node-contacts.json --namespace-id dfb4f3a1190f494b996476b4825e0a71 --remote
```

To run the static site, rewrite, Function, and KV together locally:

```sh
npm run build
npx wrangler@4 kv bulk put fixtures/node-contacts.json --namespace-id NODE_CONTACTS --local
npx wrangler@4 pages dev dist --kv NODE_CONTACTS --compatibility-date 2026-10-07
```

Open `/n/0FF1C3` or enter `0FF1C3` at `/node-contact/` on the local URL printed by Wrangler. KV updates can take 60 seconds or more to become visible across Cloudflare locations. This prototype only looks up greetings; message delivery and owner editing are not implemented.

## Current content and temporary features

The general FAQ was carried over from old `dev` at `faedef5`; Finnish answers were translated and edited. Exact technical claims and app instructions still need editorial review. No review dates have been invented for this material.

The repeater-name guide demonstrates native synchronized Web / Mobile / CLI tabs and a command builder. Switching language may reset the tab selection. JavaScript is required for interactive features. Full FAQ pages use `faq: true` and ordinary `##` question headings, with optional stable anchors such as `[#contacts]`. They work in Markdown or MDX and each category gets its own local filter; Pagefind searches all categories. The explicit `FAQ` and `Question` components remain available for mini-FAQs embedded in ordinary MDX articles.

The Finland silhouette includes Åland and is hidden on mobile. Its repeater dots load in the browser from the daily mc-shark bundle hosted in R2, independently of site builds. See [the map data description](src/data/README.md).

`NetworkStats.astro` and `src/components/temporary/` contain the disposable stats widget, including its fetch logic and styles. It retains the previous API endpoints, geographical bounds and 1,000-node limit; its repeater metric is not a complete network total. Replace the wrapper and temporary directory during the planned overhaul.

## Production replacement

When the new site is ready, preserve the old `main` tip as `legacy_v1`, then replace `main` with the accepted `dev` history. Production remains configured to build from `main`. The histories are independent, so this is a deliberate branch replacement rather than a normal merge. Use a lease when replacing the remote branch so intervening updates cannot be overwritten accidentally. The site is replaced in one go; no legacy hash-route compatibility layer is included.
