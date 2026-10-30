---
type: Verification
title: "TECH-007 Flaky admin tests: verification"
description: How each requirement of Flaky admin tests was checked, the test suite before and after, and the requirements as built.
feature: TECH-007
---

# Verification of TECH-007

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-007-R1 | `MUPP-012-R1 R2 R3 …` before the fix: failed 13 of 20 runs with `--repeat-each 20`; after the fix: 20 of 20 passed. `MUPP-003-R5 …`: 40 runs (incl. the matching R5 test) passed after the added wait; it never failed locally before, so only CI over time can confirm it | local | Pass (MUPP-003-R5 not reproduced before the change) | 2026-10-29 |
| TECH-007-R2 | The `Home` failure was a bug in `ListPicker` (`pointerenter` on a resting pointer); fixed there, the test unchanged and still checking the behaviour (see [solution.md](solution.md)) | local | Pass | 2026-10-29 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned; `npm run test:unit`: 110 pass | local | Pass | 2026-10-29 |
| Browser tests | The two tests run 20 times each; whole suite with `npm run test:time`: 55 pass | local | Pass | 2026-10-29 |
| Smoke test | None planned | | Not applicable | |
| Accessibility | Not applicable: no visible change | | Not applicable | |
| Security | Not needed | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-10-29 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (last recorded, TECH-006) | 110 unit, 55 browser | 98.9 s | 4.4 s |
| After | 110 unit, 55 browser | 96.5 s | 4.3 s |

## Definition of Done

- [ ] Tests: both tests pass 20 runs in a row locally (MUPP-003-R5 to be confirmed in CI over time)
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: not applicable
- [ ] Requirements in the card match what was built (the open question is answered: a real bug in `ListPicker`)

## Requirements as built

### TECH-007-R1 The two tests are reliable

The site behaves as before. `MUPP-003-R5` and `MUPP-012-R1 R2 R3` pass in 20 runs in a row locally (`--repeat-each`) and in CI.

### TECH-007-R2 A real bug is fixed in the component

If the `Home` failure is a bug in `ListPicker` (a key press ignored), it is fixed there and the test keeps checking the behaviour.

## Notes

The cause of the `MUPP-003-R5` failure is inferred from the CI report (axe running mid page-change), not observed.

The `Home` key was not ignored: the active option was overridden by `pointerenter` from the resting mouse pointer.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
