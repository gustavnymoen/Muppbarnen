---
type: Verification
title: "MUPP-016 Wish list open transition: verification"
description: How each requirement of the wish list open transition was checked, the test suite before and after, and the requirements as built.
feature: MUPP-016
---

# Verification of MUPP-016

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-016-R1 | Test `MUPP-016-R1 the single kid list slides up, ends in place and is usable` in `tests/MUPP-016-wishlist-open-transition.spec.ts`: only the `wish-slide` animation runs (so `reveal` is gone), then the list is at rest, usable, focus on the fold-up arrow, axe | local | Pass | 2026-11-02 |
| MUPP-016-R2 | Test `MUPP-016-R2 …`: after closing a ghost copy animates and then goes, the button is back with focus, a new press during the motion opens at once, axe | local | Pass | 2026-11-02 |
| MUPP-016-R3 | Test `MUPP-016-R3 R4 …` for the card with several kids and the Christmas card: the first frame of the animation is the pressed button's box, the last is the whole card, then the ordinary open view, axe | local | Pass | 2026-11-02 |
| MUPP-016-R4 | Same tests: closing with Stäng, Tillbaka and Esc ends at the button's box, focus on it; after a window resize the target is where the button now is | local | Pass | 2026-11-02 |
| MUPP-016-R5 | Tests `MUPP-016-R5 …` with `reducedMotion: "reduce"` on the three cards: no animation (colour transitions aside) and no ghost after opening or closing | local | Pass | 2026-11-02 |
| MUPP-016-R6 | Test `MUPP-016-R6 …`: double press, Esc right after opening, nothing left over and no sideways scroll; the MUPP-004, -005, -013, -014, -015, -017 and -019 tests pass unchanged | local | Pass | 2026-11-02 |

The look of the motion (curve, distances) is not tested, by design (the card's test plan). It has **not been looked at** on a phone in the running site yet.

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | not applicable: no logic outside the browser (the origin is measured there) | | | |
| Browser tests | `tests/MUPP-016-wishlist-open-transition.spec.ts`, one test per requirement, axe on each state; the older tests did not need a change | local | Pass | 2026-11-02 |
| Smoke test | none new; the existing ones pass | local | Pass | 2026-11-02 |
| Accessibility | axe at rest in the open and closed states of the three cards; the live checklist (focus after open and close, nothing announced twice, reduced motion, 2.3.3) is not checked yet | local | Pass (live: not checked) | 2026-11-02 |
| Security | not applicable: only components and CSS | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

`npm run test:time`, with its own `HOME` since another session shares the test database.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-019) | 127 unit + 76 browser | 124.3 s | 4.3 s |
| After (merged with MUPP-017) | 132 unit + 91 browser | 152.5 s | 4.8 s (an older admin test) |

(Other cards landed on `main` since MUPP-019, so the counts include theirs. In the last full run `MUPP-003-R6 a picture is uploaded…` failed once and passed twice on its own: unrelated to this card, and not looked into.)

## Definition of Done

- [x] Tests: all checks of the test plan done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (152.5 s of 180 s; grown 23 % since MUPP-019, partly other cards)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes; the live checklist is not checked yet
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers (`reveal` and `.wish-list` are gone)
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-016-R1 Single-kid list slides up when opened

The site shall, on a card with one kid, show the wish list sliding up from the position of the "Önskelista" button while fading in, in at most 300 ms, replacing the current roll-down from the top.

Acceptance criteria:

- **Given** a card with one kid and a folded list, **when** the visitor presses "Önskelista", **then** the list appears with an upward slide and a fade, ends in its normal place, and is usable (rows can be opened, focus is on the fold-up button) when the motion ends.
- **Given** the roll-down from the top used before, **when** the list opens, **then** it is not used any more (no `reveal` clip-path animation remains).

### MUPP-016-R2 Single-kid list closes with the reverse motion

The site shall, on a card with one kid, close the list by sliding it back down towards the button while fading out, in at most 200 ms.

Acceptance criteria:

- **Given** an open list on a card with one kid, **when** the visitor presses the fold-up arrow, Escape, or the list is closed in any other way that exists today, **then** the list slides down and fades out, and the "Önskelista" button is back, with focus, when it ends.
- **Given** the list is closing (the real list is already folded, so "Önskelista" is back and what slides down is a copy), **when** the visitor presses "Önskelista" again, **then** the copy is removed and the list opens again, without a jump.

### MUPP-016-R3 Multi-kid and Christmas Eve view grows from the pressed button

The site shall, on a card with several kids and on the Christmas Eve card, show the pressed kid's view growing from the position and size of the pressed button (the kid's "Önskelista" button, or the kid's tile on the Christmas Eve card) to the whole card, in at most 300 ms.

Acceptance criteria:

- **Given** a multi-kid card, **when** the visitor presses a kid's "Önskelista" button, **then** the kid's view starts at that button's place and size and grows to fill the card, so it is clear which kid was pressed.
- **Given** the Christmas Eve card, **when** the visitor presses a kid's tile, **then** the same happens from that tile.
- **Given** the motion has ended, **then** the view is exactly the ordinary open kid view of today (list unfolded, "Tillbaka", "Stäng" and sizes buttons, focus where it is today).

### MUPP-016-R4 Multi-kid and Christmas Eve view shrinks back to the button

The site shall, when the kid's view is closed with "Stäng", "Tillbaka", Escape or any other way that exists today, shrink it back to the button or tile it came from, in at most 200 ms.

Acceptance criteria:

- **Given** an open kid view on a multi-kid or Christmas Eve card, **when** the visitor closes it, **then** it shrinks to the kid's button/tile, the card shows all kids again, the marks in the list are forgotten, and focus is on that kid's button (as today).
- **Given** the visitor scrolled the card or the viewport changed size while the view was open, **when** it closes, **then** it still shrinks to where the button now is (the origin is measured when the motion starts, not saved).

### MUPP-016-R5 Reduced motion

The site shall, when the visitor prefers reduced motion, open and close the list and the kid's view at once, with no movement and no fade.

Acceptance criteria:

- **Given** `prefers-reduced-motion: reduce`, **when** a list or kid view is opened or closed on any of the three cards, **then** it is shown or removed immediately, with no animation running (a colour change on a pressed button is not movement).

### MUPP-016-R6 The transitions never get in the way

The site shall keep the open list and the controls usable during and after the transitions, with unchanged behaviour: nothing in the transition may block a press, break the deck's locking, or leave anything half open.

Acceptance criteria:

- **Given** a transition is running, **when** the visitor presses a button, key or Escape, **then** it is handled as without the transition and the transition ends in the right state (open or closed).
- **Given** the visitor presses the opening button twice quickly, **then** the second press is handled by what is under it, as without the transitions (on a single-kid card the fold-up arrow sits where the button was), and the list is open once or closed, never twice or half open, with nothing left over when the motion ends.
- **Given** the list is open or closed, **then** the deck's behaviour with an open list (swipe locked, the arrows as MUPP-017 made them), the focus rules and the texts of MUPP-005, MUPP-013, MUPP-015 and MUPP-017 are unchanged.
- **Given** the transitions, **then** they use only `transform`, `opacity` and `clip-path` (nothing that changes the layout while it runs), the easing `--ease-out-soft`, and the card does not scroll sideways or jump.


## Notes

- The card was changed while building (after MUPP-017 landed on `main`, R6 no longer says the deck stays locked, since the arrows now work with an open list): R2 (the press during closing removes the ghost copy and opens; the real list is already closed), R5 (a colour change on a pressed button is not movement) and R6 (two quick presses on a single-kid card: the second lands on the fold-up arrow that sits where the button was, as before; the list is open or closed, never twice or half open).
- The check that `reveal` is gone is in the R1 test, not in `tests/design.spec.ts` as the plan said: it reads the running animation's name, which the R1 test already has.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
