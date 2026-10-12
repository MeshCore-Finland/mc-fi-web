# MeshCore Finland website

**Looking for MeshCore guides, FAQs or local communities? Visit [meshcore.fi](https://meshcore.fi/).**

This is the source repository for the MeshCore Finland website. It contains the site's Markdown/MDX content, components and build automation. The site uses Astro and Starlight, with Finnish and English URLs under `/fi/` and `/en/`. Finnish is the default content language; `/` redirects to `/fi/`.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for installation, local previews, article and FAQ conventions, workflow tabs, screenshots, translation review and pull requests. Content authors can work in Markdown/MDX without editing React components.

Start contributions from `dev` and submit pull requests to `dev`. Maintainers publish reviewed changes through `main`.

## License and authors

The project's code and content are licensed under the [MIT License](LICENSE). See [AUTHORS](AUTHORS) for contributors.

By submitting a contribution, you agree to license it under the same MIT License. Do not contribute if you do not agree to these terms. See [the contribution terms](CONTRIBUTING.md#license-and-contribution-terms).

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

## Branches and deployments

- **`main`** is the production branch. Cloudflare Pages builds it for [meshcore.fi](https://meshcore.fi/).
- **`dev`** is the integration branch for contributions. Its shared previews are [Finnish](https://dev.mc-fi-web.pages.dev/fi/) and [English](https://dev.mc-fi-web.pages.dev/en/).

Cloudflare provides previews for branches in this repository. Vercel provides fork pull-request previews. Use a contribution's deployment link to review its changes; the shared `dev` preview shows changes already integrated into `dev`.

## Repository layout

- `src/content/docs/fi/` and `src/content/docs/en/`: website articles and FAQs. Matching paths associate translations; missing English pages use Finnish fallback content.
- `src/content/i18n/`: translated interface labels.
- `sidebar.config.mjs`: shared navigation groups and page order, imported by `astro.config.mjs`.
- `src/components/`: homepage, article components and interactive features.
- `src/assets/screenshots/`: screenshots stored with the content; see the [image conventions](src/assets/screenshots/README.md).
- `src/data/` and `scripts/export_repeaters.py`: map geometry and the daily repeater snapshot; see the [map data guide](src/data/README.md) and [exporter and hosting guide](docs/repeater-bundle.md).

Full FAQ pages use `faq: true` and ordinary `##` question headings. Each page gets a local text filter, and site-wide search indexes its questions and answers. The `FAQ` and `Question` components support mini-FAQs inside other MDX pages. Screenshots, synchronized workflow tabs and interactive components can be embedded in MDX; examples are in [CONTRIBUTING.md](CONTRIBUTING.md).
