---
type: Verification
title: "MUPP-034 Cross on single-kid wish list: verification"
description: How each requirement of Cross on single-kid wish list was checked, the test suite before and after, and the requirements as built.
feature: MUPP-034
---

# Verification of MUPP-034

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-034-R1 | Test `MUPP-013-R5 MUPP-005-R6 MUPP-028-R1 R2 R3 MUPP-034-R1 …` in `tests/design.spec.ts`: on the card with one kid the button is named "Fäll ihop önskelistan", has the same cross path as on the twins' card, and closes the list; the twins' card has that cross named "Stäng önskelistan" | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None new (presentation only); `npm run test:unit`: 162 passed | local | Pass | 2026-11-03 |
| Browser tests | The MUPP-028 test in `tests/design.spec.ts` updated; `npm run test:local` passes (114 tests) | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: no main page or flow changes | | | |
| Accessibility | axe in the updated test on the open list (one kid and twins). The checklist on the live site: not checked yet | local | Pass (axe) | 2026-11-03 |
| Security | `/security-review` not needed (presentation only) | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (card TECH-015, MUPP-031) | 112–113 browser | 178–182 s | 4.5 s |
| After | 162 unit + 114 browser | 179.1 s (browser) + 0.3 s (unit) | 4.5 s |

No test was added; the change adds one assertion to an existing test. The suite is under the budget by 0.9 s, which TECH-015 is for.

## Definition of Done

- [ ] Tests: `npm run test:unit` and `npm run test:local` pass (done); smoke tests against production after the merge (not yet)
- [x] Test suite: within the time budgets, no test added
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: axe passes; the checklist on the live site not yet checked
- [x] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/startsidan.md`), system docs (`wiki/system/start-page.md`) and `wiki/log.md` updated
- [x] No leftovers: no unused code (`ChevronUpIcon` is still used by `WishRow`)
- [x] Clean code: `lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### MUPP-034-R1 Cross on every card

The site shall show the cross icon on the button of an open wish list on every card, also a card with one kid.

Acceptance criteria:

- **Given** a card with one kid and its list open, **when** the page is shown, **then** the button shows the cross, not an arrow up.
- **Given** the same card, **when** the button is pressed, **then** the list folds up as before.
- **Given** the same card, **when** read by a screen reader, **then** the button is still named "Fäll ihop önskelistan" (cards with several kids and Christmas Eve keep "Stäng önskelistan").

## Notes

None.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
