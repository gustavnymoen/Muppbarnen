---
type: Verification
title: "TECH-009 Settled boxes in the feature tests: verification"
description: How each requirement of Settled boxes in the feature tests was checked, the test suite before and after, and the requirements as built.
feature: TECH-009
---

# Verification of TECH-009

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-009-R1 | `grep -n "boundingBox()" tests/*.ts`: only the one inside `settledBox` in `tests/helpers.ts`. Compared boxes are read with `Promise.all`; the two reads in `MUPP-004` are one | local | Pass | 2026-10-30 |
| TECH-009-R2 | `git diff origin/main -- tests`: only the reads changed, no test removed, skipped or loosened. `npm run test:time`: 69 browser tests pass, 116.1 s against 116.0 s before | local | Pass | 2026-10-30 |
| TECH-009-R3 | The four spec files with `--repeat-each 20` while 12 `yes` processes kept the CPUs busy: Run of all four files: 311 passed, 9 failed. `MUPP-010-compact-admin.spec.ts` alone: 6 of 160 failed. All 15 failures are `MUPP-010-R4`, a test this card did not change. See Notes | local | Partly: no failure in a changed read; one unchanged test flaked | 2026-10-30 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned; `npm run test:unit`: 125 pass | local | Pass | 2026-10-30 |
| Browser tests | The four spec files 20 times each under load (R3), then the whole suite with `npm run test:time` | local | See R3 | 2026-10-30 |
| Smoke test | None planned | | Not applicable | |
| Accessibility | Not applicable: nothing visible changes | | Not applicable | |
| Security | Not needed: tests only | | Not applicable | |
| Code review | [review.md](review.md) | local | See review | 2026-10-30 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 125 unit, 69 browser | 116.0 s | 5.3 s |
| After | 125 unit, 69 browser | 116.1 s | 4.7 s |

Two tests of `MUPP-003-admin-page.spec.ts` were over the 5 s budget in the "before" run (5.3 s and 5.2 s); this card did not touch them and none was over in the "after" run.

## Notes

`MUPP-010-R4` (a picture is uploaded and removed) failed in two of four runs of `MUPP-010-compact-admin.spec.ts` with `--repeat-each 20` under load: 9 of 20 in the run of all four files, 6 of 20 in the file alone. Each time at `expect(img[src="/bilder/1"]).toBeVisible()`, the thumbnail after "Spara bild". The same file on the unchanged tests passed 160 of 160 twice, and on the changed tests a third run passed 160 of 160, and `MUPP-010-R4` has no box read, so the cause is not found and it is not shown to be caused by this card. It is a different flake than the one this card is for (a box read mid-animation); the other 311 runs of the four files, which contain every changed read, all passed.

## Definition of Done

- [ ] Tests: every read passes in 20 runs under load, but `MUPP-010-R4` (unchanged) flaked in two runs; see Notes
- [x] Test suite: no slower (116.1 s against 116.0 s), within the budgets
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: not applicable
- [x] Requirements in the card match what was built; copied below as built
- [x] Manual, system docs and `wiki/log.md` updated (no manual change: tests only)
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)

## Requirements as built

As on the card (`gh issue view 47`), unchanged:

- **R1 Every read is settled:** every box in the feature tests is read with `settledBox`, also the visually hidden 1 px heading; boxes that are compared are read together.
- **R2 The tests check what they did:** same assertions as before; the suite is not slower.
- **R3 Reliable under load:** the changed spec files pass repeatedly under load (see Notes for the one exception, outside the changed reads).

[Specifications](../index.md)
