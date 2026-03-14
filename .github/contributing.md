## Contributing

This document outlines how you can get involved and help improves the JSON Schema Studio. We appreciate all contributions!

## Table of Contents

- [How to contribute](#how-to-contribute)
  - [Report bugs or request features via Issues](#report-bug-or-request-features-via-issues)
  - [Improve Documentation](#improve-documentation)
  - [Fix bugs or implement new features](#fix-bugs-or-implement-new-features)
  - [Suggest better visual or UX improvement](#suggest-better-visual-or-ux-improvement)
  - [Important Guidelines](#important-guidelines)
  - [Versioning Rules](#versioning-rules-important)
---


## How to contribute

### Report bugs or request featues via Issues
Encountered a bug on the tool and any request features? Please use the issue templates to report it. The templates provide guidance on the information needed to help us resolve the issue.

### Improve Documentaion 
Want to improve the  documentation? 
We welcome and appreciate contriubutors to improve our documentation.
There are multiple ways you can help enhance our docs:
  - Add relevant information about a tool
  - Suggest enhancements or new sections
  - Fix inaccuracies or outdated content

If you have any suggestions or ideas, feel free to share us. Your contributions helps make the documentation clearer, more acurate, and more useful for everyone.

### Fix bugs or implement new features
If you have fix any bugs or implement new featues, feel free to raise a PR with the relevant changes.
Please ensure that:
   - The changes are clearly described
   - The implementation aligns with the project guidelines

### Suggest better visual or UX improvement
The tool is built with React Flow, so enhancements related to layout, node styling, edge rendering, interactions, or overall user experience are highly encouraged.

### Important Guidelines
  - Before creating an new issue, please ensure that a similar  issue does not already exists.
  - Before opening a PR, wait until the issue has been reviewed, accepted and assigned to it.

### Versioning Rules (Important)

We use the `version` field in `package.json` as the single source of truth for releases. Any PR that introduces **application-level changes** (changes that affect the behavior, UI, or functionality of the app) must bump the version appropriately.

We follow **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

Update the version in `package.json` based on the type of change:

| Change Type        | Version Bump | Example        |
|--------------------|--------------|----------------|
| Bug fix            | PATCH        | 1.2.3 → 1.2.4  |
| New feature        | MINOR        | 1.2.3 → 1.3.0  |
| Breaking change    | MAJOR        | 1.2.3 → 2.0.0  |
| Pre-release build  | Prerelease   | 1.2.3 → 1.2.4-beta |

### When you do NOT need to bump the version

Do **not** bump the version if your PR only changes:

- `.github/**`
- Markdown files (`*.md`)

These PRs are treated as non-release changes and will not trigger deployments or releases.

### Enforcement
>
> [!IMPORTANT]
> Our CI will block PRs if:
>
> - Application code is changed but `package.json` version is not bumped
> - The version format is invalid
> - The version already exists as a Git tag
>
> This ensures every release is clean, predictable, and traceable.



---