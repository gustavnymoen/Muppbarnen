---
type: Verification
title: "TECH-025 Build warnings on Vercel: verification"
description: How each requirement of the build warnings task was checked, the test suite and the requirements as built.
feature: TECH-025
---

# Verification of TECH-025

Run locally 2026-11-12. Not deployed yet: the build log of the preview (R2, R3, R4) and the Live tests are **not checked**.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-025-R1 | `npm run lint`, `lint:docs`, `typecheck` and `build` pass; `npm run test:time`: 376 unit tests and 166 browser tests pass | local | Pass | 2026-11-12 |
| TECH-025-R2 | `package.json` has `"node": "24.x"`; the preview's build log is not read yet | local | Not checked in the build log | – |
| TECH-025-R3 | `npm ci` in an empty folder with the new `package.json` and lock file: no `install-scripts` warning, `require('unrs-resolver')` loads; `npm install-scripts ls` lists nothing undecided | local | Pass | 2026-11-12 |
| TECH-025-R4 | ESLint 10 tried: installs, lint passes, but `npm ls` reports it invalid against the peer ranges of `eslint-plugin-import`, `-jsx-a11y` and `-react`; reverted to 9; the blocker and when to retry are in [solution.md](solution.md) | local | Pass (blocker recorded) | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable, no logic changes (the existing 376 pass) | local | – | 2026-11-12 |
| Browser tests | `npm run test:time`: 166 of 166 passed | local | Pass | 2026-11-12 |
| Smoke test | Preview and Live tests after the merge | preview, live | Not checked | – |
| Accessibility | Not applicable, nothing visitors see changes | – | – | – |
| Security | No install script approved; the one that was looked at (`unrs-resolver`) was read and denied. `/security-review` not needed | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |
| Build log | The log of the pull request's preview is read for R2–R4 | preview | Not checked | – |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 376 unit and 166 browser (MUPP-069, same suite) | 711 s under heavy load from other sessions, not reliably measured | – |
| After | 376 unit and 166 browser | 334.8 s, 4.8 s over the budget of 330 s | 7.6 s |

No test was added or changed, so the change cannot have made the suite slower; the run was made while other sessions were using the machine.

## Definition of Done

- [x] Tests: R1 and R3 checked, R4 recorded; `test:unit` and `test:local` pass; R2 and the build log wait for the preview
- [ ] Test suite: total time 4.8 s over the budget, measured with other work running on the machine; no tests changed
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements match what was built; `solution.md` describes it
- [x] Manual (no change), system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review: Passed, see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### TECH-025-R1 The site behaves as before

Lint, docs check, type check, build and all tests pass as before.

### TECH-025-R2 Node.js major is pinned

`engines.node` is `24.x`.

### TECH-025-R3 Install scripts are decided

The install scripts of `unrs-resolver` and `fsevents` are denied in `allowScripts` (not approved), because they are not needed; a clean `npm ci` prints no `install-scripts` warning.

### TECH-025-R4 ESLint is supported or the blocker is written down

ESLint stays on 9; the blocker (the peer ranges of the plugins in `eslint-config-next`) and when to retry are in `solution.md`.

## Notes

The `cache-dir` warning is Vercel's own and is left, as the card says.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
