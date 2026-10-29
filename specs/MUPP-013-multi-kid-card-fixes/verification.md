---
type: Verification
title: "MUPP-013 Multi-kid birthday card fixes: verification"
description: How each requirement of Multi-kid birthday card fixes was checked, the test suite before and after, and the requirements as built.
feature: MUPP-013
---

# Verification of MUPP-013

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-013-R1 | Test `MUPP-013-R1 R2 R3 R4 …` in `tests/design.spec.ts` (each kid in its own equal part at 375 × 844; the lower kid's button is in the lower half) | local | Pass | 2026-10-29 |
| MUPP-013-R2 | Same test: the line is 1 px, starts at 20 % of the width, and is not the old edge colour | local | Pass | 2026-10-29 |
| MUPP-013-R3 | Same test (a 31-letter name on the two-kid card on one line, between 12 and 18 px, not clipped) and `MUPP-013-R3 Christmas Eve …` (the same name in its tile: one line, 12 px, ellipsis, no scroll in the list) | local | Pass | 2026-10-29 |
| MUPP-013-R4 | Same first test: the mark's colour is the sun colour and its contrast on the mark's background is at least 4.5 | local | Pass | 2026-10-29 |
| MUPP-013-R5 | Test `MUPP-013-R5 …` in `tests/design.spec.ts` (the wish button is gone, "Stäng" has the focus, sits centred at the bottom, is 44 px high, stays put when a 30-wish list scrolls, closes the list, focus back, deck unlocked, axe); `tests/MUPP-004-birthday-card.spec.ts` updated for the swap | local | Pass | 2026-10-29 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned; `npm run test:unit`: 110 pass | local | Pass | 2026-10-29 |
| Browser tests | The three tests above in `tests/design.spec.ts`; three checks in `tests/MUPP-004-birthday-card.spec.ts` changed; `npm run test:local`: 58 pass | local | Pass | 2026-10-29 |
| Smoke test | None new | | Not applicable | |
| Accessibility | axe on the two-kid card, the Christmas card and an open list in the tests; the checklist in `wiki/system/accessibility.md` on the live site: not checked yet | local | Pass locally, live not checked | 2026-10-29 |
| Security | Not needed: only looks and one button | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-10-29 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 110 unit + 55 browser | 97 s (first run, with two of the new tests) | 6.8 s (MUPP-012, flaky once) |
| After | 110 unit + 58 browser | 94 s | 4.8 s |

Not run before the change; the browser count before is 58 minus the three new tests. In the first run `MUPP-012-R1 R2 R3` failed once on the active option of the list and passed in the next two runs; it was not touched by this change.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets; the new tests follow the quality rules (the Christmas part was split off to stay under 5 s)
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: the relevant items of `wiki/system/accessibility.md` checked on the live site
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the "Dölj" state of `WishButton` is deleted; `.claude/launch.json` is local only and not committed
- [ ] Clean code: `npm run lint` and `npm run typecheck` pass; `npm run build` and `npm run lint:docs` not run yet
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### MUPP-013-R1 The kids are spread out

On a card with several kids, the space is used: the upper kid sits a little higher and the lower kid a little lower, so the card is filled from top to bottom instead of grouped in the middle.

### MUPP-013-R2 A clearer divider

The line between the kids is a bit clearer than today (still calm, not a heavy rule): 60 % of the card's width (20 % margin on each side) in the muted text colour at 45 % strength.

### MUPP-013-R3 A name stays on one line

A kid's name is never broken onto a second line, on the birthday card with several kids and on the Christmas card tiles (for example "Emmas ofödda" now breaks into two lines): the text is made smaller to fit instead, down to 12 px. A name that does not fit even then is cut with an ellipsis, and the full name stays available to screen readers. Real names will be shorter once the kids are named.

### MUPP-013-R4 The "next" mark is yellow

The mark on the next card ("Nästa födelsedag", "Nästa: Julafton") is yellow, in the existing sun colour (`--color-child-sun`), instead of following the kid's colour: yellow text, star and edge on a soft yellow background. It is the same on every card that has the mark.

### MUPP-013-R5 A small Stäng button replaces the wish button on an open list

When a wish list is opened, the wish button ("Önskelista · N") is replaced by a small "Stäng" button, centred at the bottom of the list. It is sticky: it stays there while the list scrolls. It closes the list, so the deck is unlocked and the visitor can browse to the next card or kid. The focus moves to "Stäng" when the list opens and back to the wish button when it closes (also with Escape, as in MUPP-004-R9). The button is at least 44 px high. This replaces the earlier "Dölj" state of the wish button (MUPP-004-R7).

## Notes

- R5 changed during the build: the first version kept "Dölj" and added a corner "Stäng"; two buttons doing the same was too much, so the wish button is swapped for a centred "Stäng".
- R1 only shows on phones taller than about 700 px; at 375 × 667 the card is already full.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
