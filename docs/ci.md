# CI workflows and triggers

This documents the workflows in `.github/workflows/`. Trigger and job conditions apply to the workflow version available to the run; changes on a contribution branch do not replace the workflows on other branches until merged.

`main` is the only permanent branch, the GitHub default and the production source for [meshcore.fi](https://meshcore.fi/). Contributions normally target `main`; larger coordinated updates can use temporary `integration/<topic>` branches.

## Push builds

Source: [`.github/workflows/push-build.yml`](../.github/workflows/push-build.yml).

Only pushes to `main` trigger this workflow, with no changed-file filter. Feature-branch and tag pushes do not trigger it. Its only job is `push-build`, which installs dependencies with `npm ci` and runs `npm run build`. There are no separate link jobs or generated-site uploads in a push run. Internal link warnings still appear as part of the build. Keep `push-build` optional; PR validation provides the required `build` check.

There are no PR, scheduled or manual triggers. Concurrency is grouped by Git ref; a newer push cancels an older push build for that same ref.

## Site checks (pull requests)

Source: [`.github/workflows/check.yml`](../.github/workflows/check.yml).

| Event               | Exact trigger                                                                                                             | `build`                         | `links` and `external-links` |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| Pull request        | Opened, reopened, or updated with new head commits (`synchronize`), targeting **any branch**, with no changed-file filter | Runs                            | Run after a successful build |
| Pull request edited | Base branch, title or description changed                                                                                 | Runs against the current target | Run after a successful build |

Draft PRs have the same triggers. Switching a PR between draft and ready for review, submitting a review, or closing it does not itself trigger this workflow. Merging a PR into `main` also triggers the separate Push builds workflow. There are no push, scheduled or **Run workflow** triggers for Site checks.

`build` installs dependencies with `npm ci` and runs `npm run build`: Astro diagnostics, Node tests, the static site and search index, then internal link validation in warning-only mode. It also runs the repeater exporter's unit tests with Python 3.13; these use mocked data and do not fetch or publish a bundle. Type errors, failed tests and rendering failures fail the build; broken internal links, anchors and duplicate IDs produce warnings. The generated `dist/` is saved as `generated-site` for one day.

Both link jobs need a successful `build` and reuse that artifact. They run independently of each other:

- **`links`** runs strict internal link, anchor and duplicate-ID validation. A failure is intended to block merging when this check is required in the branch ruleset.
- **`external-links`** checks external HTTP/HTTPS responses with Lychee. It follows redirects, permits up to two retries for retryable failures, uses a 20-second request timeout and checks at most four URLs concurrently. The job has a 10-minute limit. Internal URLs on `meshcore.fi`, private network addresses and external fragment validation are excluded. HTTP/network failures fail this advisory job, allowing the merge approver to judge temporary outages or blocked automated requests. An empty external-link set succeeds.

External results appear in the job summary and in the `external-link-report` artifact, retained for seven days. The report upload is attempted even after a scan failure, unless the run is cancelled. This workflow posts no PR comments.

The GitHub rulesets for `main` and `integration/*` require **`build` and `links`**, with the branch up to date before merging. **`external-links` stays optional**. Required checks are repository settings, not properties of the workflow YAML. A failing optional check stays visible but does not itself block merging or a preview deployment.

### Branch pushes and skipped checks

A push to a feature branch with an open PR starts Site checks, including when its target is a temporary integration branch. Its `build` job checks GitHub's temporary merge of that branch with its target. Branch previews are handled independently by the hosting integrations. There are no branch-name or changed-file filters on PR validation.

A merge into `main` starts Push builds and the production deployment. Pushes to feature or integration branches do not start Push builds; open PRs still receive Site checks. Distinct job names separate the optional `push-build` from the required PR `build`. A failed or cancelled PR build prevents dependent link jobs from running.

Site checks concurrency is grouped by workflow and PR merge ref. A newer run cancels an older run for the same PR. Its concurrency group is separate from Push builds, so one does not cancel the other.

## Branch rules and merging

`main` requires a pull request, squash merging, linear history and the required checks above; force pushes and deletion are blocked. There is no recurring release PR from another permanent branch. Existing history is preserved.

Temporary `integration/*` branches require pull requests and the same checks, and block force pushes. Initial branch creation is exempt from status checks so a maintainer can create one from `main`. Squash merges are the default for contribution PRs. Integration branches also allow merge commits so a PR from `main` can synchronize the shared branch without rewriting history. The final integration PR is squash merged into `main`, then the temporary branch is deleted. See [the contributor workflow](../CONTRIBUTING.md#larger-updates-with-a-temporary-integration-branch).

These rulesets are GitHub repository settings. Workflow YAML controls which checks run; it does not configure branch protections or the default branch. The repository enables automatic deletion of merged head branches; a temporary protected branch may still need manual deletion after its dependent PRs are closed or retargeted.

## Publish Finland repeater bundle

Source: [`.github/workflows/repeater-bundle.yml`](../.github/workflows/repeater-bundle.yml). Hosting, data selection and recovery are documented in [repeater-bundle.md](repeater-bundle.md).

| Event                        | Exact trigger                                                             | `test` | `publish`                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Schedule                     | Daily at 00:05 `Europe/Helsinki`, including summer time; cron `5 0 * * *` | Runs   | Runs in `MeshCore-Finland/mc-fi-web` on its default branch, after tests pass                 |
| Manual (`workflow_dispatch`) | **Run workflow** with a selected branch or tag; no inputs                 | Runs   | Runs only in `MeshCore-Finland/mc-fi-web` with its default branch selected, after tests pass |

Pushes and pull requests never trigger this publisher workflow. Exporter changes are tested by Site checks on PRs into any branch.

`test` runs the exporter unit tests with Python 3.13. Publication requires all three conditions: repository `MeshCore-Finland/mc-fi-web`, a branch ref matching that repository's configured default branch, and a scheduled or manual event. The default branch is `main`. GitHub's default-branch setting controls this workflow independently of Cloudflare's production-branch setting, also `main`. Forks and manual runs on other refs cannot publish through this workflow.

`publish` exports a complete validated snapshot of eligible repeaters and the previous Finnish calendar day's hourly packet activity, then uses `WEBSITE_MAP_DATA_UPLOAD_TOKEN` to replace `mcfi-network-data/repeaters/v1.json` in R2. Its time limit is 15 minutes. Test or export failure prevents upload and leaves the existing public snapshot available. Scheduled execution is best-effort, so 00:05 is the requested time rather than a guaranteed completion time.

Runs are grouped by Git ref, with cancellation of an in-progress run disabled. A manual run on a non-default branch runs `test` and skips `publish`.

## Preview deployments and local commands

Cloudflare Pages builds `main` for [meshcore.fi](https://meshcore.fi/). It provides previews for feature and integration branches in `MeshCore-Finland/mc-fi-web`; Vercel provides fork previews. Use the deployment link on each PR to review its proposed changes. Their deployment checks come from Git integrations, outside these three Actions workflows. Provider settings determine deployment selection and PR notifications. Their site build command is `npm run build`, so broken internal links warn without blocking the preview; the separate Actions link jobs do not gate those builds.

Local commits, merges and rebases do not trigger Actions until pushed. There are no repository-managed local Git hooks. Run `npm run build` locally, then `npm run check:links` for strict internal validation. None of the workflows listens for `repository_dispatch`, `deployment_status` or `merge_group` events.

GitHub's [event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) and [workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) describe platform event defaults and changed-file filtering.
