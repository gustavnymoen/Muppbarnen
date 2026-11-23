---
type: Solution
title: "TECH-031 Next.js security upgrade: solution"
description: "How the Next.js security upgrade was done: the versions, what was checked and why only a patch release."
feature: TECH-031
card: "#302"
depends_on: []
---

# TECH-031 Next.js security upgrade: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 302`.

## Data

None.

## Interface

None. Visitors and administrators see no change; only `package.json` and `package-lock.json` changed.

## Decisions

- **16.4.6, the latest patch, and nothing newer.** `npm audit` named seven advisories for `next` 16.0.0 to 16.4.4, all fixed in 16.4.5 or later. 16.4.6 is the `latest` tag and a patch within 16.4, so no breaking change is expected; `16.5` exists only as canary and was left alone.
- **`eslint-config-next` moved with it, to 16.4.6.** It was pinned to the same version as `next` (16.4.3) and is released together with it, so keeping them equal avoids a lint config that is a release behind the framework. `npm run lint` passes and `npm ls eslint` reports nothing invalid, so the ESLint 9 decision of [TECH-025](../TECH-025-build-warnings/solution.md) still holds.
- **`npm install --save-exact`, not `next upgrade --agent=security`.** The upgrade command is the one the security notice recommends and starts an agent. A plain install of one patch version does the same here, and the diff is only the two versions and the lock file entries of `next` and its platform packages (`@next/swc-*`, `@next/env`).
- **No code change.** The site does not use `"use cache"`, `unstable_cache`, the Edge runtime or image optimization (pictures go through `app/bilder/[id]`), and it is hosted on Vercel, not self-hosted; so none of the seven advisories reach the code, but the version they sit in is gone. `react` and `react-dom` stayed at 19.3.0 (Next.js 16.4.6 accepts it).
- **The seven other `npm audit` findings stay.** They are dev tools (`typescript-eslint`, `minimatch`), outside this card.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Architecture](../../wiki/system/architecture.md) (names "Next.js 16"), [Project setup](../../wiki/system/project-setup.md).

[Specifications](../index.md)
