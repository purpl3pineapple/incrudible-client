## Summary

Describe the behavior changed and why.

## Verification

- [ ] `dist/incrudible-client.min.js` is rebuilt when source changed
- [ ] Public behavior or API changes are documented

CI is the required merge gate and reports its result directly on this pull
request; it does not need a manual checkbox.

## Release

Use a Conventional Commit PR title, such as `fix: hide inactive wizard shells`
or `feat: expose form state snapshots`. The squash-merged title determines the
next automated release version.
