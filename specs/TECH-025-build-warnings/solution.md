---
type: Solution
title: "TECH-025 Build warnings on Vercel: solution"
description: "How the warnings of the Vercel build were handled: pinned Node.js major, install scripts denied, ESLint kept on 9 with the blocker written down."
feature: TECH-025
card: "#235"
depends_on: []
---

# TECH-025 Build warnings on Vercel: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 235`.

## Data

None.

## Interface

None for visitors. Two things change in `package.json`: `engines.node` and a new `allowScripts` block (written by `npm install-scripts deny`).

## Decisions

- **`engines.node` is `24.x`**, not `>=24`. `>=24` lets Vercel move to Node.js 25 or 26 the day it is released; `24.x` keeps the build on 24 until we change it ourselves (R2).
- **The install scripts are denied, not approved** (R3). `unrs-resolver` (a dependency of `eslint-config-next`) has a `postinstall` that only runs `napi-postinstall`, which fetches the native build for the platform if the optional package for it was not installed. npm installs that optional package itself, so the script is not needed: a clean `npm ci` in an empty folder gave no warning and `require('unrs-resolver')` loaded. Approving a script that does nothing would be a permission for nothing. `fsevents` (macOS only, optional, file watching) is denied for the same reason; it appeared as a warning on the developer's Mac only.
- **ESLint stays on 9** (R4). ESLint 10 installs and `npm run lint` passes, but `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react`, which `eslint-config-next` 16.4.3 depends on, list only ESLint up to 9 in their peer ranges, so `npm ls` reports ESLint 10 as invalid. The `deprecated eslint@9.39.5` warning therefore stays. Retry when `eslint-config-next` (or those plugins) allow ESLint 10: `npm view eslint-plugin-react peerDependencies` and `npm ls eslint` after trying `npm install eslint@^10`.
- **The `cache-dir` warning** comes from Vercel's build environment (the repository has no `.npmrc`) and is left, as the card says.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Project setup](../../wiki/system/project-setup.md).

[Specifications](../index.md)
