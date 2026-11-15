---
type: Verification
title: "TECH-028 Date-proof browser tests: verification"
description: How the fixed test date was checked, the test suite before and after, and the requirement as built.
feature: TECH-028
---

# Verification of TECH-028

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-028-R1 | Unit test `TECH-028-R1 the fixed date of the test server` in `lib/deck.test.ts` (used only with a local database file); full `npm run test:time` with the fixed date: 176 browser tests passed, including the three that failed on 2026-11-15 in CI (MUPP-013-R5, MUPP-017-R1, MUPP-021-R1) and MUPP-011-R1, which needed the same date for the birthday limit | local | Pass | 2026-11-15 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/deck.test.ts` (one new test); `npm run test:unit` 397 passed | local | Pass | 2026-11-15 |
| Browser tests | The whole suite with the fixed date: 176 passed. With `TEST_TODAY` on 2026-12-20 29 tests failed and on 2026-12-26 three: the tests are written for a date outside December (Christmas Eve is part of the deck), which is recorded in `solution.md` and the wiki, not a requirement | local | Pass | 2026-11-15 |
| Smoke test, Accessibility, Security | Not applicable: nothing visitors see changes; the fixed date works only with a local database file (checked in the unit test and the review) | – | n/a | 2026-11-15 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-15 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 396 unit + 176 browser (main) | 387.1 s (one run, with a 30 s timeout test); CI 427.5 s | 30 s / 8.4 s in CI |
| After | 397 unit + 176 browser | 358.1 s | see `test:time` output, none over 8 s except as before |

Over the 330 s budget, as before this change; the user accepted that the test times are over budget (in the chat, 2026-11-15). The change adds no test run time (one unit test).

## Definition of Done

- [x] Tests: `npm run test:unit` and `npm run test:local` pass with the fixed date
- [x] Test suite: 358.1 s, over the 330 s budget as before; the overrun is accepted by the user (2026-11-15)
- [x] Deployed, and the smoke tests pass against production (Live tests): merged in pull request 264, Live tests (run 43756237858) passed on the merge commit 46ee961 on 2026-11-15
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built; `solution.md` describes how it was built
- [x] Manual: not applicable; system docs (`wiki/system/testing.md`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `typecheck` pass (`lint:docs` and `build` run before the commit)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none

## Requirements as built

### TECH-028-R1 The site behaves as before

The tests shall give the same result on every real date, because the local test server and the tests share one fixed date (`TEST_TODAY`, 2026-06-01).

Acceptance criteria:

- **Given** any real date (checked on 2026-11-15, when three tests failed before), **when** `npm run test:local` runs, **then** it passes.
- The fixed date is used only with a local database file, so a deployed site follows the clock (unit test).
- Not a requirement: other fixed dates. The tests are written for a date outside December (the Christmas Eve card is part of the deck).

[Specifications](../index.md)
