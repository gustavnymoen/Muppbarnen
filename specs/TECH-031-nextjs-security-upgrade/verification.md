---
type: Verification
title: "TECH-031 Next.js security upgrade: verification"
description: How each requirement of the Next.js security upgrade was checked, the test suite and the requirements as built.
feature: TECH-031
---

# Verification of TECH-031

Run locally 2026-11-23. Merged with PR #307 (its Preview tests and CI were green, which branch protection requires). The Live tests passed on `main` commit 35369de ([run 45158329627](https://github.com/gustavnymoen/Muppbarnen/actions/runs/45158329627), checked 2026-11-23).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-031-R1 | `package.json` has `next` 16.4.6 (and `eslint-config-next` 16.4.6); `npm audit` lists 7 moderate findings, none for `next` (the dev tools `typescript-eslint` and `minimatch` remain, outside the card) | local | Pass | 2026-11-23 |
| TECH-031-R2 | `npm run build` (twice) and `npm run test:time` (which starts the test server) ran on the first try; no "SecurityFatalError" and no upgrade recommendation in the output | local | Pass | 2026-11-23 |
| TECH-031-R3 | `npm run lint`, `lint:docs`, `typecheck` and `build` pass; `npm run test:time`: 441 unit tests and 188 of 188 browser tests pass, no test changed | local | Pass | 2026-11-23 |
| TECH-031-R3 (preview and live) | Preview tests on the pull request (green, required to merge), Live tests on `main` commit 35369de (run 45158329627) | preview, live | Pass | 2026-11-23 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable, no logic changes (the existing 441 pass) | local | – | 2026-11-23 |
| Browser tests | `npm run test:time`: 188 of 188 passed; none added | local | Pass | 2026-11-23 |
| Smoke test | Preview tests on the pull request and Live tests on `main` commit 35369de (run 45158329627) | preview, live | Pass | 2026-11-23 |
| Accessibility | Not applicable, visitors see no change | – | – | 2026-11-23 |
| Security | `/security-review` not needed (no code change); R1 is the check; the existing CSP, cookie and header tests pass | local | Pass | 2026-11-23 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-23 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (the build of MUPP-086, 2026-11-20) | 441 unit, 188 browser | 357.2 s (two other runs: 347.3 s, 365.1 s) | 7.4 s |
| After | 441 unit, 188 browser | 362.5 s | 7.8 s |

No tests were added, so the feature's own tests add 0 s. The total is 12.5 s over the budget of 350 s, as it already was before the change (runs of the same suite vary by about 18 s between runs); the time is [TECH-030](https://github.com/gustavnymoen/Muppbarnen/issues/301)'s matter, and no limit was raised.

## Definition of Done

- [x] Tests: the test plan is done for the local checks; `npm run test:unit` and `npm run test:local` pass (preview and live checks follow the merge)
- [ ] Test suite: within the time budgets (362.5 s against 350 s, as before the change; handled by TECH-030)
- [x] Deployed, and the smoke tests pass against production (Live tests): run 45158329627
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`: not applicable, no visible change), system docs (`wiki/system/architecture.md` says "Next.js 16", still true) and `wiki/log.md` updated
- [x] No leftovers: only the two versions and the lock file changed
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none new (the dev-tool advisories of `npm audit` are left out of the card; add a task if wanted)

## Requirements as built

### TECH-031-R1 Patched Next.js

The site shall run Next.js 16.4.6.

- **Given** `package.json` and `package-lock.json`, **then** `next` is 16.4.6 and `npm audit` lists no advisory for `next`.

### TECH-031-R2 No security stop

The build and the browser tests shall start without the Next.js security stop.

- **Given** a clean `npm run build` and a clean `npm run test:local`, **then** the first run passes without "SecurityFatalError" or a recommendation to upgrade.

### TECH-031-R3 Unchanged behaviour

The site shall behave as before.

- **Given** the upgrade, **then** lint, type check, build, unit tests and the whole browser suite pass with no test changed, and the preview and live smoke tests pass.

## Notes

- The release notes of 16.4.4, 16.4.5 and 16.4.6 were read: backported fixes and the security release, nothing that needs a code change.
- `eslint-config-next` was raised to 16.4.6 together with `next` (the two are released together and were pinned to the same version); this was not in the card's scope text and is recorded here and in [solution.md](solution.md).
