---
type: Verification
title: "MUPP-022 Close animation glitch and focus ring on phone: verification"
description: How each requirement of the close animation fix was checked, the test suite before and after, and the requirements as built.
feature: MUPP-022
---

# Verification of MUPP-022

R2's `data-quiet-focus` was replaced by one site-wide rule in [MUPP-032](../MUPP-032-quiet-focus-after-tap/solution.md); the test now checks `data-pointer` on `<html>`. The rows below are the history of 2026-11-02.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-022-R1 | Tests `MUPP-022-R1 …` in `tests/MUPP-022-close-animation-glitch.spec.ts` for the card with several kids and Christmas Eve: the copy's animation has `transform` and `opacity` only (no `clip-path`), it is removed within 500 ms, an animation that is cancelled or cut short by a new open leaves no copy; `MUPP-016-R3 R4 …` checks that the last frame is the button's box (also after a resize) | local | Pass | 2026-11-02 |
| MUPP-022-R2 | Tests `MUPP-022-R2 …`: after Stäng and Tillbaka with the pointer the tile has `data-quiet-focus` and no outline; after Esc the ring (3 px solid) and no attribute; after leaving and coming back with Tab the ring is shown | local | Pass | 2026-11-02 |

Chromium does not show a focus ring after a click (iOS Safari does), so the pointer part of R2 is checked through the attribute that hides the ring as well as the outline. No WebKit is installed here: the stutter and the ring are **not checked on a phone** yet.

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | not applicable | | | |
| Browser tests | `tests/MUPP-022-close-animation-glitch.spec.ts` (6 tests) and the updated `tests/MUPP-016-wishlist-open-transition.spec.ts`; axe at rest after the close on both cards | local | Pass | 2026-11-02 |
| Smoke test | none new; the existing ones pass | local | Pass | 2026-11-02 |
| Accessibility | axe at rest; the live checklist (the ring after Tab on the live site, reduced motion) is not checked yet | local | Pass (live: not checked) | 2026-11-02 |
| Security | not applicable: components and CSS | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

Looked at: the copy paused in the middle of the close in Chromium on 375 px (a whole, smaller card on its way to the button, fading). Not looked at on a phone.

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-016 PR) | 132 unit + 93 browser | 152.6 s | 4.8 s |
| After | 132 unit + 99 browser | 161.9 s | see `npm run test:time` |

## Definition of Done

- [x] Tests: all checks of the test plan done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (161.9 s of 180 s; close to the limit, the six new tests add about 9 s)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes; the live checklist is not checked yet
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated (no manual change: the visitor sees no new function)
- [x] No leftovers (`inset`-based shrink removed)
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] No larger improvements to add to the board (the opening motion still uses `clip-path`, see `solution.md`)

## Requirements as built

### MUPP-022-R1 The kid's view shrinks as a whole picture

The site shall, when a kid's view on a card with several kids or on Christmas Eve is closed, shrink the whole view (scaled, not cut) to the button or tile it came from while it fades out, in at most 200 ms, using only `transform` and `opacity`.

Acceptance criteria:

- **Given** an open kid view, **when** it is closed, **then** the copy that moves is scaled from the full card to the box of the button (measured then) and fades out, and no `clip-path` animation runs.
- **Given** the motion has ended or is interrupted (a new open or close, a cancelled animation), **then** the copy is gone (removed at the latest 500 ms after it started) and nothing animates.

### MUPP-022-R2 No focus ring after a touch or mouse close

The site shall not show the focus ring on the button or tile that gets the focus when a kid's view is closed with a finger or mouse; closed with the keyboard (Esc, or Enter on a button) it shows the ring as before.

Acceptance criteria:

- **Given** a kid's view closed by pressing Stäng or Tillbaka with the pointer, **then** the focused tile has no outline.
- **Given** it closed with Esc, **then** the focused tile has the focus ring (3 px, brand colour).
- **Given** the tile loses the focus and gets it again with the keyboard, **then** the ring shows as usual.


## Notes

- The card's third acceptance criterion of R2 was reworded while building to what can be tested: the ring shows again when the tile gets the focus with the keyboard after it has lost it.
- The test suite is at 90 % of its time budget; a later card may need to trim tests.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
