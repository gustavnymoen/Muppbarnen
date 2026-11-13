---
type: Verification
title: "TECH-025 Build warnings on Vercel: verification"
description: How each requirement of the build warnings task was checked, the test suite and the requirements as built.
feature: TECH-025
---

# Verification of TECH-025

Run locally 2026-11-12. Merged with PR #242. The build log of the deploy was read by the user 2026-11-12 (R2, R3, R4). The Live tests passed on `main` commit 7255728 (checked 2026-11-13, [run 43388796707](https://github.com/gustavnymoen/Muppbarnen/actions/runs/43388796707)); the test suite time is **not** re-measured.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-025-R1 | `npm run lint`, `lint:docs`, `typecheck` and `build` pass; `npm run test:time`: 376 unit tests and 166 browser tests pass | local | Pass | 2026-11-12 |
| TECH-025-R2 | `package.json` has `"node": "24.x"`; the deploy's build log (shown by the user) no longer has the `engines` warning | local, deploy | Pass (build log read by the user) | 2026-11-12 |
| TECH-025-R3 | `npm ci` in an empty folder with the new `package.json` and lock file: no `install-scripts` warning, `require('unrs-resolver')` loads; `npm install-scripts ls` lists nothing undecided; the deploy's build log (shown by the user) has no `install-scripts` warning | local, deploy | Pass | 2026-11-12 |
| TECH-025-R4 | ESLint 10 tried: installs, lint passes, but `npm ls` reports it invalid against the peer ranges of `eslint-plugin-import`, `-jsx-a11y` and `-react`; reverted to 9; the blocker and when to retry are in [solution.md](solution.md); the deploy's build log still has `deprecated eslint@9.39.5`, as expected | local, deploy | Pass (blocker recorded) | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable, no logic changes (the existing 376 pass) | local | – | 2026-11-12 |
| Browser tests | `npm run test:time`: 166 of 166 passed | local | Pass | 2026-11-12 |
| Smoke test | Live tests on `main` commit 7255728, which contains TECH-025 (run 43388796707) | live | Pass | 2026-11-13 |
| Accessibility | Not applicable, nothing visitors see changes | – | – | – |
| Security | No install script approved; the one that was looked at (`unrs-resolver`) was read and denied. `/security-review` not needed | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |
| Build log | The user read the deploy's log: the warnings left are `deprecated eslint@9.39.5` (R4, blocked) and `Unknown env config "cache-dir"` (Vercel's own, out of scope) | deploy | Pass | 2026-11-12 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 376 unit and 166 browser (MUPP-069, same suite) | 711 s under heavy load from other sessions, not reliably measured | – |
| After | 376 unit and 166 browser | 334.8 s, 4.8 s over the budget of 330 s | 7.6 s |

No test was added or changed, so the change cannot have made the suite slower; the run was made while other sessions were using the machine.

## Definition of Done

- [x] Tests: R1 to R4 checked (the build log by the user); `test:unit` and `test:local` pass
- [ ] Test suite: total time 4.8 s over the budget, measured with other work running on the machine; no tests changed
- [x] Deployed, and the smoke tests pass against production (Live tests, 2026-11-13)
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
