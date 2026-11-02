---
type: Verification
title: "MUPP-019 Wish row: info button, labels and order: verification"
description: How each requirement of the wish row's info button, labels and order was checked, the test suite before and after, and the requirements as built.
feature: MUPP-019
---

# Verification of MUPP-019

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-019-R1 | Test `MUPP-019-R1 …` in `tests/MUPP-019-wish-row.spec.ts` (button in place of the checkbox, press / Enter / Esc / press elsewhere, rows do not move, sentence not in the details, axe with the bubble shown); size and column in `tests/design.spec.ts` | local | Pass | 2026-11-02 |
| MUPP-019-R2 | Test `MUPP-019-R2 …` in `lib/wishes.test.ts` (three groups, stable order, claimed unlimited counts as claimed) and in `tests/MUPP-019-wish-row.spec.ts` (order in an open list) | local | Pass | 2026-11-02 |
| MUPP-019-R3 | Test `MUPP-019-R3 R4 …` in `tests/MUPP-019-wish-row.spec.ts` (label and order against "Storlek:", none without a description, line breaks kept) | local | Pass | 2026-11-02 |
| MUPP-019-R4 | Test `MUPP-005-R1 R3 R4 R5 …` in `tests/design.spec.ts` (colour of the mark and the line, contrast at least 4.5:1) and axe in `tests/MUPP-019-wish-row.spec.ts` | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `sortWishes` with all three groups mixed | local | Pass | 2026-11-02 |
| Browser tests | info button (press, Esc, outside press, Enter), order, label with and without description, axe with the bubble shown and with a claimed row unfolded | local | Pass | 2026-11-02 |
| Smoke test | not applicable: the main flow does not change | | | |
| Accessibility | axe in the browser tests; looked at the bubble on a 375 px screenshot. Live checklist, on the wish "test 2" of a kid's list at 375 px in the built-in browser (not a real phone, no screen reader): the info button is named "Kan köpas flera gånger", is 44 × 44 px, has `aria-expanded` and `aria-controls` pointing at the bubble; Tab reaches it before the row's own arrow and Enter shows the bubble (a `status` with the text); Esc hides it and the list stays open; the order of the rows is claimable, unlimited, claimed. Not checked: that a screen reader reads the bubble aloud, and a long title on an unlimited row (the long title found lives on a claimable row; there it pushes the row's arrow out of the list, see MUPP-023). The bubble covers the row's own arrow while it is shown, as designed | live | Pass (screen reader and long unlimited title: not checked) | 2026-11-02 |
| Live tests | "Live tests" run 41430693065 on merge commit f47a1e5 | live | Pass | 2026-11-02 |
| Security | not applicable: no data or route changes | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-018) | 126 unit + 73 browser | 125.1 s | 4.7 s |
| After | 127 unit + 76 browser | 124.3 s | 4.3 s |

## Definition of Done

- [x] Tests: all checks of the test plan done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets
- [x] Deployed, and the smoke tests pass against production (Live tests): run 41430693065 on f47a1e5
- [ ] Accessibility: axe passes; the live checklist is done except a screen reader reading the bubble and a long title on an unlimited row (see the table)
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

As on the card (`gh issue view 62`), with these details of the build: the bubble starts to the right of the info button and covers the row itself; the colour is `--color-claimed` `#E3A15F`; Esc hides the bubble only while focus is inside the button's wrapper.

### MUPP-019-R1 Explanation behind an info button

A gift that can be bought several times has an info button (an "i" in a circle, 44 px, in the checkbox's column) named "Kan köpas flera gånger" that shows "Den här presenten kan köpas flera gånger, så den går inte att paxa." as a bubble over the row; a second press, Esc or a press elsewhere hides it. The sentence is no longer in the unfolded row. The button is not a checkbox.

### MUPP-019-R2 Order of the wish list

Claimable gifts, then gifts that can be bought several times, then claimed gifts; the admin order inside each group.

### MUPP-019-R3 Description has a label

The unfolded row shows "Beskrivning: {text}" above "Storlek: …", nothing when empty, line breaks kept.

### MUPP-019-R4 "Paxad" and "Paxad av" in an orange-like colour

"Paxad" and "Paxad av {name} {date}" are orange-like text with at least 4.5:1 contrast (the site has only a dark theme).

## Notes

The existing MUPP-005 tests were adjusted: the row button is found by its title, and the sentence check became a check of the info button.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
