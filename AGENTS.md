# Agent Instructions

## Scope

These instructions apply to the entire repository.

## Run After Changes

Before completing a change, run the relevant checks:

- `npm run check`
- `npm run test`
- `npm run build` when build output or package/export behavior is affected

After code, test, documentation, or script changes, update the graph:

- `graphify update .` or, in the agent context, `/graphify . --update`

## Version Releases

When asked to build or commit a new version, run the version bump script:

- `npm run increment-version`

After it runs, review the generated `CHANGELOG.md` changes and verify that the entries are correct for the release before committing.
