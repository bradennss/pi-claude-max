# pi-claude-max

A [Pi](https://pi.dev) extension that routes Anthropic OAuth requests through a Claude Pro/Max subscription instead of pay-per-token extra usage. The extension makes Pi identify to the Anthropic API the way the official Claude Code CLI does.

## Verify

```sh
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm test
```

`pnpm run check` runs typecheck, lint, format check, and tests together.

## Contributing and publishing

Follow this workflow:

1. Make the change on a feature branch and run `pnpm run check`.
2. Add a [changeset](https://github.com/changesets/changesets) with `pnpm changeset`. Pick the bump level and write the summary. The `Changeset Check` workflow fails the PR without one.
3. Open a pull request into `main`. Wait for the `CI` and `Changeset Check` workflows to pass, then merge.
4. On merge to `main`, the `Release` workflow opens or updates a `Version Packages` PR that bumps the version and updates `CHANGELOG.md`. Wait for it to appear.
5. Review and merge the `Version Packages` PR. That merge triggers the `Release` workflow again, which packs and publishes the package to npm.
