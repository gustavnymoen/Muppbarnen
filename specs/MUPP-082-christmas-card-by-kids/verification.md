---
type: Verification
title: "MUPP-082 Cards by number of kids: verification"
description: How each requirement of the layout by number of kids was checked, the test suite before and after, and the requirements as built.
feature: MUPP-082
---

# Verification of MUPP-082

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-082-R1 | Not changed; covered by the existing tests of the single kid card (`MUPP-004-R2 R3 …`, `MUPP-014-R2 R4 R5 …`), which pass | local | Pass | 2026-11-16 |
| MUPP-082-R2 | `MUPP-013-R3 MUPP-082-R2 R3 R4 …` in `tests/design.spec.ts` (Christmas Eve with two kids: a wish button per kid, no "Öppna" buttons, axe); `MUPP-004-R2 R4 R5 …` (two kids on Christmas Eve, no age, the list opens); `MUPP-014-R3 R4 R5 …` (a sizes icon per kid). The birthday card with two kids was already this layout | local | Pass | 2026-11-16 |
| MUPP-082-R3 | The same test: three kids on Christmas Eve and on their birthday card are one column of rows, equally wide, over 200 px wide, at least 44 px high, nothing scrolls in the list, axe. `TECH-013-R5` checks that the rows are clear of the arrows at 320 and 375 px. `MUPP-017-R2 R4`, which use rows on both cards, check opening, browsing and Tillbaka | local | Pass | 2026-11-16 |
| MUPP-082-R4 | `MUPP-013-R3 MUPP-082-R2 R3 R4 …` (four kids: a long name on one line, shrunk and cut with an ellipsis, no scroll, axe) and `TECH-006-R5 MUPP-005-R7 MUPP-082-R4 …` (tiles two by two with the same top). A birthday card with four kids or more is not tested: the code is the same for both cards | local | Pass (birthday card with four kids not tested) | 2026-11-16 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned (a layout); `npm run test:unit` passes (438 tests) | local | Pass | 2026-11-16 |
| Browser tests | The two planned tests in `tests/design.spec.ts` got more kids and the IDs. Eleven older tests assumed tiles for Christmas Eve with two or three kids, or the wish buttons on a birthday card with three kids, and were adjusted: they open Vera by her wish button on the two-kid Christmas card (`MUPP-004`, `MUPP-014`, `MUPP-015`, `MUPP-016`, `MUPP-022`, `MUPP-037`), by the row "Öppna Vera" on the three-kid cards (`MUPP-017`) and `TECH-013-R5` checks the rows | local | Pass | 2026-11-16 |
| Smoke test | Not needed (no main page or flow is added) | n/a | Not applicable | 2026-11-16 |
| Accessibility | axe on all three layouts in the test above; rows and tiles at least 44 px high (rows checked). The live checklist for the cards (items 1-4, 6, 7) is not done | local | Partly: live checklist not done | 2026-11-16 |
| Security | Not needed (no data, input or access changes) | n/a | Not applicable | 2026-11-16 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-16 |

## Test suite

`npm run test:time` before and after the change (budget 350 s).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 190 browser | 344.7 s (MUPP-080 verification) | 6.9 s |
| After | 438 unit + 190 browser | 349.6 s (2026-11-16), within the budget by 0.4 s | 7.0 s |

No test was added; the two planned tests got more page loads (about 3 s together). The first full run after the code change was over the budget (593.4 s, 11 tests failed with 30 s time-outs) because of the eleven older tests above; the figure after is from the run after they were adjusted. The margin is small: the next change to the suite must remove time first.

## Definition of Done

- [x] Tests: every requirement has a test; unit and browser tests pass
- [x] Test suite: 349.6 s, within the 350 s budget
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet
- [ ] Accessibility: axe passes; the live checklist is not done
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, lint:docs, typecheck and build pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

Copied from the card (#285), after the user widened it from the Christmas Eve card to every card.


### MUPP-082-R1 One kid: the single card

Unchanged: a card with one kid is the full single card (picture, name, sizes, wish list). Covered by the existing tests.

### MUPP-082-R2 Two kids: like the twin card

A card shall show two kids one above the other as the birthday card does for twins: picture, name and the wish and sizes buttons for each kid, a line between them (and the age where the card has one; Christmas Eve has none). Christmas Eve gets this layout; the birthday card already has it.

Acceptance criteria:

- **Given** two kids, **when** the card is shown, **then** each kid has a wish list button ("Önskelista för <name>") and there are no tiles.

### MUPP-082-R3 Three kids: wide rows

A card (Christmas Eve or birthday) shall show three kids as three wide rows one under the other, each with the picture to the left and the name centred to the right; a row is a button ("Öppna <name>") that opens the kid like a tile does. The rows fit on a 375 × 667 phone without scrolling inside the card.

Acceptance criteria:

- **Given** three kids, **when** the card is shown, **then** the rows are in one column, equally wide, and nothing scrolls in the list.

### MUPP-082-R4 Four kids or more: small tiles

A card (Christmas Eve or birthday) shall show four kids or more as small tiles (as Christmas Eve does today): small tiles two by two, picture over name, a name that is too long shrinks and is cut with an ellipsis (MUPP-013-R3).

Acceptance criteria:

- **Given** four kids, **when** the card is shown, **then** the kids are tiles, two on a row.
## Notes

- The card first covered the Christmas Eve card only and was widened to every card by the user during the build. A birthday card with three or more kids shows only the name on its rows and tiles: the age, the wish button and the sizes icon are in the kid view that a row or tile opens.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
