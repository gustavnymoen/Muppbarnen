---
type: Verification
title: "MUPP-083 Admin wish lists: sizes and flipping between kids: verification"
description: How each requirement of MUPP-083 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-083
---

# Verification of MUPP-083

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-083-R1 | Test `MUPP-010-R1 R2 R5 MUPP-083-R1 R2 R3 R4 …` in `tests/MUPP-010-compact-admin.spec.ts`: the corner button opens the sizes (with axe), Stäng returns focus to it, a kid without sizes gets the empty text | local | Pass | 2026-11-17 |
| MUPP-083-R2 | Same test: in the open "Ändra" card the sizes open on top, Esc closes only them, the typed title stays | local | Pass | 2026-11-17 |
| MUPP-083-R3 | Unit test `lib/kid-neighbours.test.ts` (circular, two kids, one kid, unknown id); the same browser test: next, next (round) and previous go to the right kid. Parent scope: code review (the neighbours come from `listChildren(parent.id)`) | local | Pass | 2026-11-17 |
| MUPP-083-R4 | Same browser test: both arrows at least 44 px and never overlapping the row's title, pencil or trash can at 320, 375 and 430 px; inert behind a card by the browser's modal `<dialog>` | local | Pass | 2026-11-17 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/kid-neighbours.test.ts`, 3 tests | local | Pass | 2026-11-17 |
| Browser tests | The checks joined the existing wish list page test (no new file); `{ exact: true }` on the "Storlek" label in the MUPP-003 and MUPP-045 tests, since "Storlekar" now also matches it | local | Pass | 2026-11-17 |
| Smoke test | Not needed for the change (no main page or flow is added); Live tests (the smoke tests) ran after the merge, run 43935647958 on merge commit `d221afe` | live | Pass | 2026-11-16 |
| Accessibility | axe on the page and on the open sizes dialog; the live checklist is marked done by the user (2026-11-25), who tested it on the live site, not gone through item by item by Claude | local, live | Pass (axe); live checklist marked done by the user | 2026-11-25 |
| Security | Security points in the review; `/security-review` not needed (no new route, action or query) | local | Pass | 2026-11-17 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-17 |

## Test suite

`npm run test:time`. The suite was at its budget, so tests were merged before the new checks were added.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main) | 441 unit, 190 browser | 349.6 s (the card's figure) | 6.9 s |
| After | 441 unit, 186 browser | 347.3 s | 6.9 s |

The feature's own checks added about 2.5 s (the wish list page test went from about 3 s to 5.4 s). Merged to make room: MUPP-023-R3 into the MUPP-018 test, MUPP-010-R2 R5 into the MUPP-010-R1 R5 test, and the MUPP-010 "five kids" and "keyboard only" tests into the "no sideways scroll" test. Every old check is kept.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (347.3 s of 350 s), and the new tests follow the quality rules
- [x] Deployed (pull request 293, merge commit `d221afe`), and the smoke tests pass against production (Live tests, run 43935647958)
- [x] Accessibility: axe passes; the live checklist is marked done by the user (2026-11-25), who tested it on the live site, not gone through item by item by Claude
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none found

## Requirements as built

### MUPP-083-R1 Sizes at the top

The kid's wish list page shall have a "Storlekar" icon button at the top right, on the same row as "Till barnen". It opens a dialog "Storlekar för <name>" with the kid's clothes, shoes, head and gloves sizes that are filled in, or "Inga storlekar inlagda än." when none are, and a "Stäng" button; Esc closes it and focus returns to the button (the behaviour of `SizesButton`).

Acceptance criteria:

- **Given** a kid with sizes, **when** the button is pressed, **then** the dialog shows them, and **when** it is closed, **then** focus is on the button.
- **Given** a kid without sizes, **when** the button is pressed, **then** the dialog says that none are filled in.

### MUPP-083-R2 Sizes when adding a wish

The form cards "Ny önskning" and "Ändra" (both lists) shall have the same "Storlekar" button at the bottom right of the card, so the sizes can be looked at while writing the wish without losing what is typed.

Acceptance criteria:

- **Given** "Ny önskning" (or "Ändra") is open with a title typed, **when** the sizes are opened and closed, **then** the typed title is still there and the form card is still open.

### MUPP-083-R3 Flipping between kids

The kid's wish list page shall have two arrow buttons, "Föregående barn" and "Nästa barn", the same as the arrows of the start page's deck (`IconButton`-sized with the chevron icons, 44 px, vertically centred), at the left and right edge of the screen, that open the previous and next kid's wish list page (the same page, other kid). The kids and their order are those of the admin's list of kids (oldest first), so a parent flips only between their own kids, also the master administrator (the list of kids shows only their own). The order is circular. With one kid there are no buttons.

Acceptance criteria:

- **Given** two or more kids, **when** "Nästa barn" is pressed, **then** the page shows the next kid's name and lists, and from the last kid it shows the first; "Föregående barn" does the opposite.
- **Given** one kid, **then** neither button exists.
- **Given** a parent, **then** the buttons never lead to another parent's kid.

### MUPP-083-R4 Usable on a phone

The arrows shall be at least 44 px, reachable with the keyboard, and never cover a button, a field or text on the page, at 320 px width too. While a form card is open (the page behind is inert) they are not reachable.

Acceptance criteria:

- **Given** a 320 px wide window, **when** the page is shown, **then** the arrows do not overlap the buttons or text of the lists (the arrows are at the very edge, not 8 px in as the deck's, since the wish rows reach too close to the edge for that).

## Notes

- Found while building: Esc in the sizes dialog also closed the form card below it, because React's `onCancel` bubbles in the component tree. `Dialog` now stops it (see the solution).
- The arrows are at the very edge (`left-0`/`right-0`), not 8 px in as the deck's, since they otherwise covered the wish row at 375 and 430 px.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
