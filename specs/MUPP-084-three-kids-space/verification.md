---
type: Verification
title: "MUPP-084 Three kids: use the card's space: verification"
description: How each requirement of the three-kid card layout was checked, the test suite before and after, and the requirements as built.
feature: MUPP-084
---

# Verification of MUPP-084

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-084-R1 | `MUPP-013-R3 MUPP-082-R2 R3 R4 MUPP-084-R1 R2 R3 R4 …` in `tests/design.spec.ts` (`expectRows`): three rows equally high, 12 px apart, the first at the top and the last at the bottom of the list, nothing scrolls; on the Christmas Eve card and the birthday card at 375 × 667, and on Christmas Eve at 320 × 568. Also looked at in screenshots of both sizes | local | Pass | 2026-11-17 |
| MUPP-084-R2 | The same test: the picture is square (round) and at least 56 px at 375 and 320 px. Screenshots: about 92 px at 375 × 667 and about 70 px at 320 × 568 (limited by 40 % of the width). The reduced padding for very low screens is not tested (no phone in the plan is that low) | local | Pass | 2026-11-17 |
| MUPP-084-R3 | The same test: a short name is over 18 px; the long name is smaller than the short one and on one line (cut with an ellipsis only at 12 px). The tiles' long name is checked as before (MUPP-082-R4) | local | Pass | 2026-11-17 |
| MUPP-084-R4 | The same test keeps the rows at least 44 px high; the existing tests of the three-kid rows (`MUPP-017-R2 R4`, `TECH-013-R5`) and of one, two and four kids pass unchanged | local | Pass | 2026-11-17 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned (a layout); `npm run test:unit` passes (441 tests) | local | Pass | 2026-11-17 |
| Browser tests | No new test and no new page load: the checks are in `expectRows` and a 320 px resize in the existing test | local | Pass | 2026-11-17 |
| Smoke test | Not needed for the change (no main page or flow is added); Live tests (the smoke tests) ran after the merge, run 43950359324 on merge commit `284e3a9` | live | Pass | 2026-11-17 |
| Accessibility | axe in `expectRows`, on both cards, at 375 and 320 px; rows at least 44 px. The live checklist (size and contrast of the larger name) is not gone through | local | Pass (live checklist not done) | 2026-11-17 |
| Security | Not needed (no sign-in, API, action or data) | n/a | Not applicable | 2026-11-17 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-17 |

## Test suite

`npm run test:time` before and after the change (budget 350 s).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 190 browser (the card, from MUPP-082) | 349.6 s | 7.0 s |
| After | 441 unit + 186 browser | 346.2 s (2026-11-17), within the budget by 3.8 s | 6.7 s |

The before figure is from the card, not measured again on `origin/main`; the counts and the total differ because other cards changed the suite in between. The change adds no test and no page load: the 320 px resize and the new checks add about 1 s to the existing test (1.7 s before the extra checks, 2.4 s after).

## Definition of Done

- [x] Tests: every requirement has a test; unit and browser tests pass
- [x] Test suite: 346.2 s, within the 350 s budget
- [x] Deployed (pull request 298, merge commit `284e3a9`), and the smoke tests pass against production (Live tests, run 43950359324)
- [ ] Accessibility: axe passes; the live checklist is not done
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, lint:docs, typecheck and build pass (build see below)
- [x] Code review done, no must-fix findings: see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

Copied from the card (#291). No requirement changed during the work, except that the rows have no vertical padding at all (the picture is centred in the row).

### MUPP-084-R1 The rows fill the card

On a card with three kids the three rows share the height of the list equally, with the same gap between them as before (12 px), so the list has no empty space above or below the rows. Nothing scrolls in the list.

### MUPP-084-R2 Larger pictures

The picture in a row is as large as the row allows: its diameter is the row's height less its padding, but at most 40 % of the row's width, and never smaller than 56 px. It stays round.

### MUPP-084-R3 Larger names

The name in a row is `text-3xl` instead of `text-lg`, centred beside the picture, and shrinks one pixel at a time until it fits on one line, down to 12 px, after which it is cut with an ellipsis (`FitName`).

### MUPP-084-R4 Everything else as before

A row is still one button "Öppna <name>" that opens the kid as before, at least 44 px high, and the layouts for one, two and four or more kids are unchanged.
