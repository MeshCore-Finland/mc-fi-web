# CI workflows and triggers

This documents the workflows in `.github/workflows/`. Trigger and job conditions apply to the workflow version available to the run; changes on a contribution branch do not replace the workflows on other branches until merged.

The production website is [meshcore.fi](https://meshcore.fi/), built from `main`. Contributions target `dev`.

## Push builds

Source: [`.github/workflows/push-build.yml`](../.github/workflows/push-build.yml).

Only pushes to `dev` or `main` trigger this workflow, with no changed-file filter. Feature-branch and tag pushes do not trigger it. Its only job is `push-build`, which installs dependencies with `npm ci` and runs `npm run build`. There are no separate link jobs or generated-site uploads in a push run. Internal link warnings still appear as part of the build. Keep `push-build` optional; PR validation provides the required `build` check.

There are no PR, scheduled or manual triggers. Concurrency is grouped by Git ref; a newer push cancels an older push build for that same ref.

## Site checks (pull requests)

Source: [`.github/workflows/check.yml`](../.github/workflows/check.yml).

| Event        | Exact trigger                                                                                                              | `build` | `links` and `external-links` |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------- |
| Pull request | Opened, reopened, or updated with new head commits (`synchronize`), targeting `dev` or `main`, with no changed-file filter | Runs    | Run after a successful build |

Draft PRs have the same triggers. Switching a PR between draft and ready for review, editing its description, submitting a review, or closing it does not itself trigger this workflow. Merging a PR updates the target branch and can trigger the separate Push builds workflow there. There are no push, scheduled or **Run workflow** triggers for Site checks.

`build` installs dependencies with `npm ci` and runs `npm run build`: Astro diagnostics, Node tests, the static site and search index, then internal link validation in warning-only mode. It also runs the repeater exporter's unit tests with Python 3.13; these use mocked data and do not fetch or publish a bundle. Type errors, failed tests and rendering failures fail the build; broken internal links, anchors and duplicate IDs produce warnings. The generated `dist/` is saved as `generated-site` for one day.

Both link jobs need a successful `build` and reuse that artifact. They run independently of each other:

- **`links`** runs strict internal link, anchor and duplicate-ID validation. A failure is intended to block merging when this check is required in the branch ruleset.
- **`external-links`** checks external HTTP/HTTPS responses with Lychee. It follows redirects, permits up to two retries for retryable failures, uses a 20-second request timeout and checks at most four URLs concurrently. The job has a 10-minute limit. Internal URLs on `meshcore.fi`, private network addresses and external fragment validation are excluded. HTTP/network failures fail this advisory job, allowing the merge approver to judge temporary outages or blocked automated requests. An empty external-link set succeeds.

External results appear in the job summary and in the `external-link-report` artifact, retained for seven days. The report upload is attempted even after a scan failure, unless the run is cancelled. This workflow posts no PR comments.

Keep **`build` and `links` required**, and **`external-links` optional**, in the GitHub branch ruleset. Required checks are repository settings, not properties of the workflow YAML. A failing optional check stays visible but does not itself block merging or a preview deployment.

### Branch pushes and skipped checks

A push to a feature branch with an open PR into `dev` or `main` starts only Site checks. Its `build` job checks GitHub's temporary merge of that branch with its target. Branch previews are handled independently by the hosting integrations.

A push to `dev` with an open release PR into `main` starts both Push builds (the new `dev` commit) and Site checks (the proposed release merge). Distinct job names separate the optional `push-build` from the required PR `build`. PRs targeting other branches do not start Site checks. A failed or cancelled PR build prevents dependent link jobs from running.

Site checks concurrency is grouped by workflow and PR merge ref. A newer run cancels an older run for the same PR. Its concurrency group is separate from Push builds, so one does not cancel the other.

## Publish Finland repeater bundle

Source: [`.github/workflows/repeater-bundle.yml`](../.github/workflows/repeater-bundle.yml). Hosting, data selection and recovery are documented in [repeater-bundle.md](repeater-bundle.md).

| Event                        | Exact trigger                                                             | `test` | `publish`                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Schedule                     | Daily at 06:00 `Europe/Helsinki`, including summer time; cron `0 6 * * *` | Runs   | Runs in `MeshCore-Finland/mc-fi-web` on its default branch, after tests pass                 |
| Manual (`workflow_dispatch`) | **Run workflow** with a selected branch or tag; no inputs                 | Runs   | Runs only in `MeshCore-Finland/mc-fi-web` with its default branch selected, after tests pass |

Pushes and pull requests never trigger this publisher workflow. Exporter changes are tested by Site checks on PRs into `dev` or `main`.

`test` runs the exporter unit tests with Python 3.13. Publication requires all three conditions: repository `MeshCore-Finland/mc-fi-web`, a branch ref matching that repository's configured default branch, and a scheduled or manual event. GitHub's default-branch setting controls this workflow independently of the website's `main` production branch. Forks and manual runs on other refs cannot publish through this workflow.

`publish` exports a complete validated snapshot, then uses `WEBSITE_MAP_DATA_UPLOAD_TOKEN` to replace `mcfi-network-data/repeaters/v1.json` in R2. Its time limit is 15 minutes. Test or export failure prevents upload and leaves the existing public snapshot available. Scheduled execution is best-effort, so 06:00 is the requested time rather than a guaranteed completion time.

Runs are grouped by Git ref, with cancellation of an in-progress run disabled. A manual run on a non-default branch runs `test` and skips `publish`.

## Preview deployments and local commands

Cloudflare Pages builds `main` for [meshcore.fi](https://meshcore.fi/). It provides previews for branches in `MeshCore-Finland/mc-fi-web`, including the shared [dev preview](https://dev.mc-fi-web.pages.dev/fi/); Vercel provides fork previews. Their deployment checks come from Git integrations, outside these three Actions workflows. Provider settings determine deployment selection and PR notifications. Their site build command is `npm run build`, so broken internal links warn without blocking the preview; the separate Actions link jobs do not gate those builds.

Local commits, merges and rebases do not trigger Actions until pushed. There are no repository-managed local Git hooks. Run `npm run build` locally, then `npm run check:links` for strict internal validation. None of the workflows listens for `repository_dispatch`, `deployment_status` or `merge_group` events.

GitHub's [event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) and [workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) describe platform event defaults and changed-file filtering.
