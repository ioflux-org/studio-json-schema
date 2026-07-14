# Versioning & Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versioning, changelogs, and releases.

When you make a change that affects the application (new features, bug fixes, UI updates), you **must** include a changeset.

## How to Create a Changeset

Run:

```bash
npx changeset
```

The CLI will prompt you to select the package(s) to bump (select `json-schema-studio` if prompted).

Choose the bump type according to SemVer:

| Type | Use for |
|------|---------|
| `major` | Breaking changes |
| `minor` | New features |
| `patch` | Bug fixes |

Provide a clear summary — this is included in `CHANGELOG.md`. A markdown file is generated in `.changeset/`; commit it along with your code changes.

## When You Do NOT Need a Changeset

- `.github/**` (CI/CD workflow changes)
- `*.md` files (documentation)
- Internal tests or tooling not affecting the shipped application

::: danger Enforcement
Pull requests without a changeset file will be blocked by CI. This ensures every change is properly versioned and traceable.
:::