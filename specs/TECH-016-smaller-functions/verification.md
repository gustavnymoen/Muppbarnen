---
type: Verification
title: "TECH-016 Smaller functions on Vercel: verification"
description: How each requirement of Smaller functions on Vercel was checked, the test suite before and after, and the requirements as built.
feature: TECH-016
---

# Verification of TECH-016

How each requirement was checked. Dates are 2026-11-06. "Not checked" means it needs the pushed branch (Preview and Live tests, Vercel).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-016-R1 | `npm run test:unit` (163) and `npm run test:local` (103) pass unchanged. The web client against Turso (queries, transactions, a saved picture, wish list and claim): not checked, needs the Preview tests | local; preview not checked | Pass locally; preview not checked | 2026-11-06 |
| TECH-016-R2 | Manual (depends on build output): `VERCEL=1` build with dummy values, then `node scripts/function-sizes.mjs`: start 2.6, `/losenord` 2.4, `/bilder/[id]` 2.8, `/admin` pages 3.1, `/admin/hantera` 22.4 MB (limits 6 and 25); no native `libsql` anywhere, `sharp` only in `/admin/hantera`. A normal build fails the script and names each function (10.6 MB, native `libsql`, `sharp`). Linux sizes on Vercel: not checked | local; Vercel not checked | Pass locally | 2026-11-06 |
| TECH-016-R3 | Manual: the `VERCEL=1` build traces no native `libsql`; the test server (no `VERCEL`) builds with the native client and the 103 browser tests run against a database file | local | Pass | 2026-11-06 |
| TECH-016-R4 | `lib/pictures.test.ts` (imports now from `lib/picture-upload.ts`) and the admin picture browser tests pass; the order of the checks read in `app/admin/picture-actions.ts` and in the review; `lib/route-checks.test.ts` covers the new file | local | Pass | 2026-11-06 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`, 163 tests | local | Pass | 2026-11-06 |
| Browser tests | `npm run test:local`, 103 tests | local | Pass | 2026-11-06 |
| Smoke test | Preview and Live tests | preview, live | Not checked | |
| Manual check on Vercel | Function sizes of the preview against the script | Vercel | Not checked | |
| Accessibility | Not applicable: visitors see no change | | | |
| Security | Security points in the review; `/security-review`: no findings | local | Pass | 2026-11-06 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-06 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-015 run 2) | 162 unit + 97 browser | 164.3 s | 4.6 s |
| After | 163 unit + 103 browser | 177.3 s (browser) | 4.7 s |

No test was added or removed by this change; the count and time differ from TECH-015's because of the features merged since (`main` had 103 browser tests before this change). Within the 180 s budget, close to it.

## Definition of Done

- [x] Tests: the plan's local checks are done; Preview and Live tests are not checked yet
- [x] Test suite: within the time budgets (177.3 s of 180 s); no new tests
- [ ] Deployed, and the smoke tests pass against production (Live tests): not checked
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built; no open questions left; `solution.md` describes how it was built
- [x] Manual: no change for users; system docs and `wiki/log.md` updated
- [x] No leftovers: nothing made unused by the change
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements noticed

## Requirements as built

Same as the card (`gh issue view 132`): R1 the site behaves as before; R2 smaller functions (every function but `/admin/hantera` under 6 MB, that one under 25 MB, no native `libsql`, `sharp` only in `/admin/hantera`, the script fails and names a function over its limit); R3 the web client is used in the build on Vercel only; R4 pictures are still checked and shrunk on upload, with the same checks in the same order.

## Notes

The measured sizes are 0.1–0.4 MB below the card's earlier numbers; all are within the limits.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
