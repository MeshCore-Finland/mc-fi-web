# CI workflows and triggers

This documents the workflows in `.github/workflows/`. Trigger and job conditions apply to the workflow version available to the run; changes on a contribution branch do not replace the workflows on other branches until merged.

## Site checks

Source: [`.github/workflows/check.yml`](../.github/workflows/check.yml).

| Event        | Exact trigger                                                                                                         | `build` | `links` and `external-links`                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------- |
| Branch push  | Any branch, with no changed-file filter                                                                               | Runs    | Run only when the pushed branch is exactly `dev` or `main`      |
| Tag push     | Any tag, with no changed-file filter                                                                                  | Runs    | Skipped                                                         |
| Pull request | Opened, reopened, or updated with new head commits (`synchronize`), targeting any branch, with no changed-file filter | Runs    | Run only when the target/base branch is exactly `dev` or `main` |

Draft PRs have the same triggers. Switching a PR between draft and ready for review, editing its description, submitting a review, or closing it does not itself trigger this workflow. Merging a PR updates the target branch and can trigger a push run there. There is no schedule or **Run workflow** trigger for Site checks.

`build` installs dependencies with `npm ci` and runs `npm run build`: Astro diagnostics, tests, the static site and search index, then internal link validation in warning-only mode. Type errors, failed tests and rendering failures fail the build; broken internal links, anchors and duplicate IDs produce warnings. For runs eligible for the two link jobs, the generated `dist/` is saved as `generated-site` for one day.

Both link jobs need a successful `build` and reuse that artifact. They run independently of each other:

- **`links`** runs strict internal link, anchor and duplicate-ID validation. A failure is intended to block merging when this check is required in the branch ruleset.
- **`external-links`** checks external HTTP/HTTPS responses with Lychee. It follows redirects, permits up to two retries for retryable failures, uses a 20-second request timeout and checks at most four URLs concurrently. The job has a 10-minute limit. Internal URLs on `meshcore.fi`, private network addresses and external fragment validation are excluded. HTTP/network failures fail this advisory job, allowing the merge approver to judge temporary outages or blocked automated requests. An empty external-link set succeeds.

External results appear in the job summary and in the `external-link-report` artifact, retained for seven days. The report upload is attempted even after a scan failure, unless the run is cancelled. This workflow posts no PR comments.

Keep **`build` and `links` required**, and **`external-links` optional**, in the GitHub branch ruleset. Required checks are repository settings, not properties of the workflow YAML. A failing optional check stays visible but does not itself block merging or a preview deployment.

### Duplicate and skipped checks

A push to a same-repository branch with an open PR can start two runs. The **push** run checks the branch commit; the **pull_request** run checks GitHub's temporary merge of that branch with its target. GitHub may display both sets of results on the PR.

For a contribution branch targeting `dev`, the push run builds but skips its link jobs; the PR run builds and runs both link jobs. A PR targeting another branch skips both link jobs. A failed or cancelled build also prevents dependent link jobs from running.

Concurrency is grouped by workflow and Git ref. A newer run cancels an older run for the same ref. Branch refs and PR merge refs differ, so this does not combine their runs.

## Publish Finland repeater bundle

Source: [`.github/workflows/repeater-bundle.yml`](../.github/workflows/repeater-bundle.yml). Hosting, data selection and recovery are documented in [repeater-bundle.md](repeater-bundle.md).

| Event                        | Exact trigger                                                                                       | `test` | `publish`                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Schedule                     | Daily at 06:00 `Europe/Helsinki`, including summer time; cron `0 6 * * *`                           | Runs   | Runs in the upstream repository on its default branch, after tests pass                 |
| Manual (`workflow_dispatch`) | **Run workflow** with a selected branch or tag; no inputs                                           | Runs   | Runs only in the upstream repository with its default branch selected, after tests pass |
| Branch push                  | Any branch, when the changed-file filter below matches                                              | Runs   | Skipped                                                                                 |
| Tag push                     | Any tag; GitHub does not apply changed-file filters to tag pushes                                   | Runs   | Skipped                                                                                 |
| Pull request                 | Opened, reopened, or synchronized, targeting any branch, when the changed-file filter below matches | Runs   | Skipped                                                                                 |

The branch-push and PR filters match changes to any of these exact paths:

- `scripts/export_repeaters.py`
- `scripts/test_export_repeaters.py`
- `.github/workflows/repeater-bundle.yml`

Ordinary article edits do not trigger this workflow. PR filtering uses the PR's changed-file list, so exporter or workflow changes already present in a PR can keep it eligible on later pushes.

`test` runs the exporter unit tests with Python 3.13. Publication requires all three conditions: repository `MeshCore-Finland/mc-fi-web`, a branch ref matching that repository's current default branch, and a scheduled or manual event. The default branch is currently `dev`; the guard follows a future default-branch change automatically. Forks and manual runs on other refs cannot publish through this workflow.

`publish` exports a complete validated snapshot, then uses `WEBSITE_MAP_DATA_UPLOAD_TOKEN` to replace `mcfi-network-data/repeaters/v1.json` in R2. Its time limit is 15 minutes. Test or export failure prevents upload and leaves the existing public snapshot available. Scheduled execution is best-effort, so 06:00 is the requested time rather than a guaranteed completion time.

Runs are grouped by Git ref, with cancellation of an in-progress run disabled. A push or PR run can therefore appear with `test` successful and `publish` skipped: it validated the exporter without uploading anything.

## Preview deployments and local commands

Cloudflare Pages and Vercel deployment checks come from their Git integrations, outside these two Actions workflows. Production is configured to use `main`; Cloudflare provides previews for branches in the upstream repository, and Vercel provides fork previews. Provider settings determine deployment selection and PR notifications. Their site build command is `npm run build`, so broken internal links warn without blocking the preview; the separate Actions link jobs do not gate those builds.

Local commits, merges and rebases do not trigger Actions until pushed. There are no repository-managed local Git hooks. Run `npm run build` locally, then `npm run check:links` for strict internal validation. Neither workflow listens for `repository_dispatch`, `deployment_status` or `merge_group` events.

GitHub's [event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) and [workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) describe platform event defaults and changed-file filtering.
