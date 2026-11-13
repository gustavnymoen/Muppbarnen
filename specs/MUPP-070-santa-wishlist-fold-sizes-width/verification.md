---
type: Verification
title: "MUPP-070 Sizes dialog narrower, Secret Santa wish list folds out: verification"
description: How each requirement of the sizes dialog and the Secret Santa wish list was checked, the test suite before and after, and the requirements as built.
feature: MUPP-070
---

# Verification of MUPP-070

Run locally 2026-11-13. Merged with PR #249 (commit 35bd6ce). Live tests passed on that commit ([run 43410022681](https://github.com/gustavnymoen/Muppbarnen/actions/runs/43410022681), 2026-11-13). The accessibility checklist on the live site and the check on an iPhone were done by the user and marked done; no per-item details were recorded. The test suite time is **not** re-measured.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-070-R1 | Test `MUPP-070-R1 R2 …` in `tests/design.spec.ts`: width at most 70 % of 448 px and 92 vw, inside the screen and no horizontal overflow at 375 and 320 px with a long size text, axe. That other dialogs keep their width: code review (`narrow` is opt-in, only `SizesButton` sets it) | local | Pass | 2026-11-13 |
| MUPP-070-R2 | Same test: the centre of "Stäng" within 1 px of the dialog's centre, height at least 44 px | local | Pass | 2026-11-13 |
| MUPP-070-R3 | Test `MUPP-070-R3 R4 …` in `tests/MUPP-070-santa-wishlist-fold.spec.ts`: button with `aria-expanded` and `aria-controls`, details, link, dash for empty values, no checkbox or "Paxad", axe folded and folded out. The chevron pointing up: code review (`WishRow` shows `ChevronUpIcon` when open) | local | Pass | 2026-11-13 |
| MUPP-070-R4 | Same test (no pencil or bin when folded; both there when folded out; edit shows the new text, focus back on the pencil; removal removes the row) and the 44 px check in the Secret Santa wish list test in `tests/design.spec.ts`; the older tests (MUPP-040, 042, 045, 051) fold the row out first | local | Pass | 2026-11-13 |
| MUPP-070-R5 | Three proposals (A bottom right, B top right, C bottom left) tried on a 375 px phone in the running site; the user chose C without a dividing line; recorded in [solution.md](solution.md) | local | Pass | 2026-11-13 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable, no new logic (the existing 381 pass) | local | – | 2026-11-13 |
| Browser tests | `npm run test:time`: 168 of 168 passed | local | Pass | 2026-11-13 |
| Smoke test | Not applicable, no main page or flow added; the existing smoke tests passed in Live tests on 35bd6ce (run 43410022681) | live | Pass | 2026-11-13 |
| Accessibility | axe in the new tests (sizes dialog, own list folded and folded out). The checklist on the live site, on a phone and with the keyboard | local | axe passes; the checklist on the live site was done by the user (no per-item details recorded) | 2026-11-13 |
| Security | No new route or action; [review.md](review.md). `/security-review` not needed | local | Pass | 2026-11-13 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-13 |
| Real device | Manual check on an iPhone, done by the user and marked done (no details recorded) | iPhone | Pass | 2026-11-13 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 376 unit and 166 browser (TECH-025) | 334.8 s, run with other sessions loading the machine | 7.6 s |
| After | 381 unit and 168 browser | 337.9 s, 7.9 s over the budget of 330 s | 7.7 s |

One new browser test (MUPP-070-R3 R4) and one in `design.spec.ts` (R1 R2) were added; the unit count also includes tests from other merged changes. The time is over budget like the run before, also with other sessions possibly using the machine; it has not been measured on a quiet machine.

## Definition of Done

- [x] Tests: R1 to R5 checked; `test:unit` and `test:local` pass
- [ ] Test suite: 7.9 s over the budget, not measured on a quiet machine
- [x] Deployed, and the smoke tests pass against production (Live tests, 2026-11-13)
- [x] Accessibility: axe passes; the checklist on the live site was done by the user (no per-item details recorded)
- [x] Requirements in the card match what was built (copied below); `solution.md` describes it
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the proposal switch and the preview files are removed
- [x] Clean code: `npm run lint`, `lint:docs` and `typecheck` pass (`npm run build` ran as part of `test:local`)
- [x] Code review: Passed, see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-070-R1 Narrower sizes dialog

The sizes dialog is 19.5 rem wide (never wider than 92 vw) instead of 28 rem; other dialogs keep their width.

### MUPP-070-R2 Centred close button

"Stäng" is centred in the sizes dialog and keeps its size and touch target.

### MUPP-070-R3 Own wish list rows fold out

Each wish in "Din önskelista" is a `WishRow`: title (two lines at most), chevron, folds out to "Beskrivning", "Storlek" (a dash when empty) and the link; a button with `aria-expanded` and `aria-controls`; not paxable.

### MUPP-070-R4 Pencil and bin in the folded-out row

The pencil ("Ändra <titel>") and the bin ("Ta bort <titel>"), 44 px, are shown only in the folded-out row, at the bottom left under the details, and do what they did in MUPP-040.

### MUPP-070-R5 Proposals tried first

Three placements were tried on a phone; C was chosen (see [solution.md](solution.md)).

## Notes

The folded row is a button, not a heading, so tests find it with `wishRow` and fold it out with `foldOut` (`tests/santa.ts`).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
