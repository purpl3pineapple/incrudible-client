# Repository settings

Repository rules are configured on GitHub rather than committed as code. Apply
these settings after the release-pipeline pull request is merged.

## Main branch ruleset

Create a branch ruleset targeting the default branch, `main`, with these rules:

- Require a pull request before merging.
- Require the `test` status check to pass.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Block force pushes.
- Block branch deletion.

For a solo-maintained repository, requiring zero approving reviews preserves the
pull-request and CI gate without making every merge impossible. Increase the
required approvals to one when another maintainer is available. Do not allow
routine bypasses; use repository-admin bypass only for recovery.

## Pull request settings

In **Settings > General > Pull Requests**:

- Enable squash merging.
- Disable merge commits and rebase merging.
- Set the default squash commit message to the pull request title and body.
- Enable automatic deletion of head branches.
- Enable auto-merge if desired.

The pull request title must follow Conventional Commits because its squash
commit is what Release Please reads from `main`.

## Actions settings

In **Settings > Actions > General > Workflow permissions**, allow GitHub Actions
to create and approve pull requests. The release workflow needs this permission
to maintain the Release Please pull request.

The release workflow explicitly dispatches the test workflow for generated
release pull requests. Events created with the repository `GITHUB_TOKEN` do not
otherwise trigger another workflow, and the protected branch would never receive
its required status check.