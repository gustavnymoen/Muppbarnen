---
type: Verification
title: "MUPP-017 Browse kids with the wish list open: verification"
description: How each requirement of MUPP-017 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-017
---

# Verification of MUPP-017

The checks below were run locally on 2026-11-02 (`npm run test:time`, production build on port 3100). Not yet deployed: the live checks are not done (the user reported the accessibility checklist on the live site tested by hand on 2026-11-09).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-017-R1 | Tests `MUPP-017-R1 a card with one kid …` (button, ArrowRight/ArrowLeft, list open, marks forgotten, focus, announcement, overview card, wrap) and `MUPP-017-R1 a card with several kids next …` in `tests/MUPP-017-browse-with-open-list.spec.ts`; axe on each state | local | Pass | 2026-11-02 |
| MUPP-017-R2 | Tests `MUPP-017-R2 the card with several kids …` and `… Christmas Eve …` (next, previous, wrap, same card, marks, announcement) | local | Pass | 2026-11-02 |
| MUPP-017-R3 | Test `MUPP-017-R3 …` (swipe, arrows in the claim dialog, old text gone); Escape, Stäng and Tillbaka by the updated `MUPP-004`, `MUPP-005` and `MUPP-015` tests | local | Pass | 2026-11-02 |
| MUPP-017-R4 | Tests `MUPP-017-R4 …` at 320 and 375 px (icon only, name, 44 px, no sideways scroll, behaviour); the look in the open-kid-view test in `tests/design.spec.ts` | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: the logic is in a component, no separate function | local | Not applicable | 2026-11-02 |
| Browser tests | `tests/MUPP-017-browse-with-open-list.spec.ts` (7 tests, the R3 one also covers the sizes dialog); the `MUPP-004`, `MUPP-015` and `design.spec.ts` tests updated to the new rule | local | Pass | 2026-11-02 |
| Smoke test | Not applicable: no new smoke test, the read-only smoke test is unchanged | | Not applicable | |
| Accessibility | axe on the open states in the tests; the checklist in `wiki/system/accessibility.md` on the live site | local, live | Local pass; live checklist reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | 2026-11-02 |
| Security | Not applicable: no route, action, query, sign-in or personal data touched; `/security-review` not needed | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-012) | 131 unit + 73 browser | not measured on this branch | not measured |
| After | 131 unit + 80 browser | 130.8 s (browser) + 0.3 s (unit) | 5.0 s (an admin design test, not touched here, at the budget edge) |

Seven browser tests added. Total time is within the 180 s budget.

## Definition of Done

- [x] Tests: every check in the card's test plan is done locally; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: axe passes locally; the live checklist: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements in the card match what was built (below), no open questions left; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the lock text, the lock announcements and the `Button` import are removed
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none noticed

## Requirements as built

### MUPP-017-R1 Browse the deck with a list open on a card with one kid

The site shall, when a list is open on a card with one kid, keep "Föregående kort", "Nästa kort" and the arrow keys active, and show the previous or next card of the deck with that kid's list open.

Acceptance criteria:

- **Given** an open list on a card with one kid and a deck with two or more cards, **when** the visitor presses "Nästa kort" (or ArrowRight), **then** the next card is shown, and if it has one kid its list is open, ready to use, with the focus on the button that folds it up.
- **Given** the next card has several kids or is Christmas Eve, **then** it is shown as the overview of the kids (the list is not opened for one of them).
- **Given** the marks in the list, **when** the visitor browses, **then** they are forgotten.
- **Given** the first card, **when** the visitor goes back, **then** the deck wraps around as it does without a list.

### MUPP-017-R2 Browse between the kids within a card with several kids and on Christmas Eve

The site shall, when a kid's view is open on a card with several kids or on Christmas Eve, make "Föregående kort" and "Nästa kort" (and the arrow keys) change to the previous or next kid on the same card, wrapping around, with that kid's list open.

Acceptance criteria:

- **Given** the open view of the second of three kids, **when** the visitor presses "Nästa kort", **then** the view of the third kid is open; from the last kid it goes to the first, and "Föregående kort" from the first goes to the last.
- **Given** the change, **then** the marks are forgotten, the new kid's list is open and the deck stays on the same card (the card itself does not change).
- **Given** the buttons are pressed, **then** the screen reader hears which kid is shown.

### MUPP-017-R3 Swipe stays off and nothing else is lost

The site shall keep swiping off while a list is open, and keep everything else about the open list as it is: Escape, "Stäng", the fold-up arrow, "Tillbaka" and claiming.

Acceptance criteria:

- **Given** an open list, **when** the visitor swipes sideways, **then** nothing changes (the list still scrolls).
- **Given** the claim dialog is open, **when** the visitor presses an arrow key inside it, **then** the deck does not change (as before).
- **Given** Escape, "Stäng", the fold-up arrow or "Tillbaka", **then** they behave as in MUPP-005, MUPP-013 and MUPP-015.
- **Given** the text "Stäng önskelistan för att bläddra.", **then** it is gone, since browsing is allowed.

### MUPP-017-R4 "Tillbaka" is an icon

The site shall show the "Tillbaka" button on a card with several kids and on Christmas Eve as a return icon only (a left-pointing arrow that curves back, drawn in the site's icon style in `app/components/icons.tsx`, in place of `ChevronLeftIcon` there), no visible text, in the same place (top left), with the same accessible name ("Tillbaka till alla barn", "Tillbaka till Julafton") and the same behaviour (MUPP-015).

Acceptance criteria:

- **Given** an open kid view on such a card, **then** the button shows only a left-pointing arrow, at least 44 × 44 px, first in the tab order, with the same accessible name as before.
- **Given** the button is pressed, **then** the list is closed, the marks are forgotten, and the focus goes to that kid's button (as in MUPP-015).
- **Given** the button has no text, **then** the heading has room on its row as long as the layout allows it (it shares its row with the two corner icons and shrinks below 23 rem, as built; the extra row of MUPP-015 is gone), at 320 px width without overflow.

## Notes

- Two test-timing fixes in `MUPP-015-back-button.spec.ts`: the card slides into place after "Nästa kort", and opening a list or running axe while it slides made the Christmas test flaky (the deck's overflow scrolled to show the focus). The tests now wait for the card to settle.
- The `MUPP-017-R1` browse test assumes the three test kids' birthdays come before Christmas Eve (days 10, 20, 30 from today), so it needs the date to be before about 24 November.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
