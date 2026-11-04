---
type: Verification
title: "TECH-015 Test suite at its time budget: verification"
description: How each requirement of Test suite at its time budget was checked, the test suite before and after, and the requirements as built.
feature: TECH-015
---

# Verification of TECH-015

How each requirement was checked. This is a change to the tests only; the site is unchanged.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-015-R1 | `git diff --name-only origin/main` lists only `tests/`, `wiki/`, `specs/` (this task's folder, the card's line in `specs/features.md`, and MUPP-032's `verification.md`, a separate commit). `npx playwright test --list` before (114 tests) and after (97): the same 124 requirement IDs in the test names, none missing; the review also compared the assertions of the merged tests against the old ones by reading the diff. `npm run test:unit` (162 passed) and `npm run test:local` (97 passed, every run) pass | local | Pass | 2026-11-03 |
| TECH-015-R2 | `npm run test:time` on the finished change: 167.6 s and 164.3 s of "Testernas tid" in the last two runs in a row; the four before them (a state a few merges shorter) gave 170.3, 165.0, 166.6 and 168.1 s. **Not met reliably**: the average is about 166 s, 12 s under the 178.0 s before, but not always under 165 s. The Mac had another project's process using a CPU during these runs; earlier runs of a state without the restored admin test and with fewer merges gave 160.4 and 159.3 s | local | Not met (166 s on average, goal 165 s) | 2026-11-04 |
| TECH-015-R3 | The five slowest tests of the last two runs: 4.6, 4.4, 4.0, 4.0, 4.0 s and 4.6, 4.3, 4.3, 4.3, 4.0 s; none over 5 s or marked "över budget" | local | Pass | 2026-11-04 |
| TECH-015-R4 | Code review: [review.md](review.md). By search: no `waitForTimeout`, no retries and no new skips in `tests/`; each merged test names every requirement it checks and has a comment per requirement; what the merged tests share is a page they open once, with data that the test itself seeds and `clearFamily` removes | local | Passed | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None new; `npm run test:unit` 162 passed | local | Pass | 2026-11-03 |
| Browser tests | The existing suite, changed only by merging and sharing page loads; `npm run test:local` 97 passed. Requirement IDs compared with `npx playwright test --list` (R1) | local | Pass | 2026-11-03 |
| Smoke test | Unchanged (`tests/smoke.spec.ts` is not touched) | | Live tests after the merge: not yet run | |
| Accessibility | No page changes. axe still runs on every page and state it ran on before, except MUPP-010-R6, which now runs axe once per page (at 430 px) where it ran at both widths | local | Pass | 2026-11-03 |
| Security | Not needed: no site code changes (the card's plan) | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |
| Measured | Per test and per step before (a small reporter outside the repo, logging every step over 250 ms): `goto` waiting for the 300 ms reveal was about 30 s over 114 tests (MUPP-003 alone 12.6 s in 41 loads), the 300 ms animation waits about 20 s. See [solution.md](solution.md) | local | Done | 2026-11-03 |

## Test suite

`npm run test:time` before (`main` at `0b21d83`) and after the change, each on the development Mac, one run at a time.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (`main` at `0b21d83`) | 162 unit + 114 browser | 178.0 s | 4.6 s |
| After, run 1 | 162 unit + 97 browser | 167.6 s | 4.6 s |
| After, run 2 | 162 unit + 97 browser | 164.3 s | 4.6 s |

The browser tests are 17 fewer (merged, none dropped) and about 12 s shorter (7 %); the budget is 180 s and the card's goal 165 s, which the two runs straddle. The comparison of the 85 tests that did not change between the baseline and a later run shows the same speed (ratio 1.01), so the Mac was not slower; what is left of the time is the 300 ms page reveal and the animations that the site does.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested (names unchanged in the sense of IDs); `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: within the 180 s budget (164.3–167.6 s) and no test over 5 s, but the card's goal of under 165 s (R2) is not met in every run; the changed tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility: not applicable to visitors (no page changes); axe still runs on every page and state, see the test plan
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`) has nothing to change (nothing a visitor does is different); `wiki/system/testing.md` and `wiki/log.md` updated
- [x] No leftovers: nothing made unused; the step reporter used for measuring is outside the repo
- [x] Clean code: `npm run lint`, `lint:docs` and `typecheck` pass; `npm run build` is part of every `test:local` (the test server builds the site) and passed
- [ ] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

### TECH-015-R1 The site and the tests' coverage are unchanged

The site shall behave as before, and the tests shall check what they checked before.

- Only `tests/`, `wiki/`, `specs/TECH-015-<name>/` and the task's line in `specs/features.md` have changed.
- No requirement ID is missing from the test names (`npx playwright test --list` before and after).
- `npm run test:unit` and `npm run test:local` pass.

### TECH-015-R2 The suite has room under the budget

`npm run test:local` runs in less than 165 s on the development Mac: both of two runs in a row ("Testernas tid") are under 165 s.

### TECH-015-R3 No test over its budget

None of the five slowest tests of the same two runs is over 5 s or marked "över budget".

### TECH-015-R4 The changed tests follow the quality rules

No fixed waits, retries or skips; merged tests are named after every requirement they check with a comment per requirement; what is shared between tests is only saved sign-in cookies and set-up that a test cleans up itself.

## Notes

- The admin "sixth wrong password" test was deleted by mistake in an early version and restored after the code review.
- A merge of the two MUPP-022-R1 tests (card with several kids and Christmas card) was tried and dropped: 6.0 s for the merged test against 5.1 s for the two.
- MUPP-017-R4 and MUPP-021-R1 changed a little in what they walk through: the second width starts with the view closed again, and the several-kids card is reached from the one-kid card's open list instead of from the first card's. The behaviour checked is the same.
- Live tests (the smoke tests) are not changed and run after the merge.
- R2 stays open for a decision with the user: more cuts need tests of different pages in one test, or a change of what the tests run under (reduced motion, parallel workers), which the card puts out of scope; or the goal moves to 170 s.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
