---
type: Verification
title: "TECH-008 Flaky box measurements: verification"
description: How each requirement of Flaky box measurements was checked, the test suite before and after, and the requirements as built.
feature: TECH-008
---

# Verification of TECH-008

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-008-R1 | `MUPP-003-R8 MUPP-010-R2 R6 …` and `TECH-006-R4 …` run 20 times each under CPU load (12 busy processes on 10 cores, in 5 batches of 4 runs, see [solution.md](solution.md)). Before the change: `TECH-006-R4` failed 2 of 20 (`null` from `row.boundingBox()`), `MUPP-003-R8` passed 20 of 20. After: 20 of 20 and 20 of 20. The 43.99 px did not reproduce, so only CI over time can confirm that cause | local | Pass (43.99 px not reproduced before the change) | 2026-10-30 |
| TECH-008-R2 | Not needed: the `null` was a re-render caught by a bare read, not a layout bug; the button's 43.99 px did not reproduce | local | Not applicable | 2026-10-30 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned; `npm run test:unit`: 110 pass | local | Pass | 2026-10-30 |
| Browser tests | The two tests 20 times each under load, before and after; whole suite with `npm run test:time`: 58 pass | local | Pass | 2026-10-30 |
| Smoke test | None planned | | Not applicable | |
| Accessibility | Not applicable: no visible change | | Not applicable | |
| Security | Not needed | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-10-30 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 110 unit, 58 browser | 99.4 s | 4.7 s |
| After | 110 unit, 58 browser | 98.8 s | 4.8 s |

The slowest test is now `MUPP-003-R8 MUPP-010-R2 R6 …` (3.9 s before, 4.8 s after): about 0.1 s per measured box, 5 s budget.

## Definition of Done

- [ ] Tests: both tests pass 20 runs in a row under load locally (the 43.99 px to be confirmed in CI over time)
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: not applicable
- [ ] Requirements in the card match what was built (the open question is answered: a test problem)

## Requirements as built

### TECH-008-R1 The box measurements are reliable

The site behaves as before. `MUPP-003-R8 MUPP-010-R2 R6 …` and `TECH-006-R4 …` pass in 20 runs in a row locally (`--repeat-each`) and in CI. Every box read in `tests/design.spec.ts` that is compared with a limit or an exact value is taken after the page has settled.

Acceptance criteria:

- **Given** the admin wish list page, **when** the test measures "Ny önskning", **then** the height is at least 44 every time.
- **Given** any other measured box in `tests/design.spec.ts`, **when** it is read, **then** the test has first waited for animations and layout to finish, or the reason it needs no wait is a comment next to it.

### TECH-008-R2 A real layout bug is fixed in the component

If the 43.99 px height is a real rounding bug in the page (for example a line height in fractions), it is fixed there and the test keeps checking 44. Not needed: it did not reproduce, and the `null` was a test problem.

## Notes

The cause of the 43.99 px is inferred from the CI report (a read during an enter animation), not observed.

`--repeat-each` on `MUPP-003-R8` needs the login block emptied every fifth run, because the test types a wrong password on purpose (see [solution.md](solution.md)).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
