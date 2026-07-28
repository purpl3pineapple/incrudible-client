# Repository settings

Repository rules are configured on GitHub rather than committed as code. Apply
these settings after the release-pipeline pull request is merged.

## Main branch ruleset

Create a branch ruleset targeting the default branch, `main`, with these rules:

- Require a pull request before merging.
- Require the `test` status check to pass.
- Require conversation resolution before merging.
- Block force pushes.
- Block branch deletion.

Use these solo-maintainer settings:

- Require zero approving reviews.
- Do not require CODEOWNERS review.
- Do not require branches to be up to date before merging.
- Do not use a merge queue.
- Allow repository-admin bypass for recovery, not routine changes.

The pull request is a change record and CI gate, not simulated peer review. When
another maintainer becomes active, increase required approvals to one and add
CODEOWNERS only if ownership boundaries become useful.

## Pull request settings

In **Settings > General > Pull Requests**:

- Enable squash merging.
- Disable merge commits and rebase merging.
- Set the default squash commit message to the pull request title and body.
- Enable automatic deletion of head branches.
- Enable auto-merge if desired.

The pull request title must follow Conventional Commits because its squash
commit is what Release Please reads from `main`. The author may self-merge after
CI passes; no approval ceremony is required for a solo repository.

## Actions settings

In **Settings > Actions > General > Workflow permissions**, allow GitHub Actions
to create and approve pull requests. The release workflow needs this permission
to maintain the Release Please pull request.

The release workflow explicitly dispatches the test workflow for generated
release pull requests. Events created with the repository `GITHUB_TOKEN` do not
otherwise trigger another workflow, and the protected branch would never receive
its required status check.

Dependabot and Release Please appear as bot contributors, but they do not change
the repository's human ownership model. Their pull requests are maintenance
inputs for the sole maintainer to merge or decline.
