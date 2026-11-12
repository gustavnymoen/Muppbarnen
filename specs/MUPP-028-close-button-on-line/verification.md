---
type: Verification
title: "MUPP-028 Wish list close button on the line: verification"
description: How each requirement of Wish list close button on the line was checked, the test suite before and after, and the requirements as built.
feature: MUPP-028
---

# Verification of MUPP-028

The checks in the tables below were run locally on 2026-11-03. After the deploy (PR #99), Live tests passed on `main` (run 41601189668 on `830e4d3`), the user tried the list on a phone against production, and the relevant checklist items were gone through on the live site, see "Live accessibility checklist".

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-028-R1 | Test `MUPP-013-R5 MUPP-005-R6 MUPP-028-R1 R2 …` in `tests/design.spec.ts`: the button's centre on the box's bottom line, the rows' box ends above it, unchanged when scrolled, last row fully visible and pressable at the end; on a card with one kid and on the twins' card | local | Pass | 2026-11-03 |
| MUPP-028-R2 | Same test: 32 × 32 px, round, a hit 21 px from the centre in all four directions reaches it, keyboard focus ring 3 px and inside the card, a cross in the same place and size on the twins' card | local | Pass | 2026-11-03 |
| MUPP-028-R3 | Test `MUPP-013-R5 MUPP-005-R6 MUPP-028-R1 R2 R3 …`: marking the top wish of a 30-wish list shows "Paxa (1)" fully in view at once, under the rows box, and it stays in place when the list scrolls to the end. Test `MUPP-005-R1 R3 R4 R5 MUPP-027-R1 R2 R3 MUPP-028-R3 …`: no Paxa without marks; with a mark, 44 px, under the rows, centred, above the button; the claim dialog as before. Both in `tests/design.spec.ts` | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic | | | |
| Browser tests | As above; the existing tests of opening, folding up and focus (MUPP-004, -005, -015, -016, -017, -021, -022, -023) pass. Two changed only where they reach the list's scrolling box, which is now inside the region (`MUPP-004-R7` scroll check, `MUPP-015` tab order) | local | Pass | 2026-11-03 |
| Smoke test | Not needed: no page or flow added or changed. The existing smoke tests passed against production (Live tests, run 41601189668) | live | Pass | 2026-11-03 |
| Accessibility | `expectNoA11yViolations` on the open list for one kid and for the twins; screenshots at 375 × 667 of the arrow, the cross with the keyboard focus ring and the Paxa row looked at. Impeccable critique (single context, on those screenshots; detector in regex mode, no findings): the button reads as the list's handle and covers no row; noted that "Paxa (n)" was out of view in a long list until scrolled to; the user then changed R3 so that it sits in a fixed row above the button (screenshot looked at). The scrolling box is a group named "Önskningar" (review). On the live site: the user's check on a phone, and the checklist below | local, live | Pass | 2026-11-03 |
| Security | `/security-review` not needed (no sign-in, API, data) | | | |
| Code review | [review.md](review.md): no must-fix, two should-fix fixed | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` on `main` before the change and on the branch after (the change adds no tests).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main) | 137 unit + 105 browser | 186.3 s (budget 180 s) | 6.1 s (MUPP-016 Christmas) |
| After | 137 unit + 105 browser | 183.0 s and 187.8 s in two runs (budget 180 s) | 5.8 s (MUPP-016) |

The suite was already over its budget on `main`, and this change does not move it; a technical task is on the board: TECH-014 Test suite over its time budget.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (over on `main` already; task added), the new checks follow the quality rules; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed (PR #99), and the smoke tests pass against production (Live tests, run 41601189668 on `main`)
- [x] Accessibility: axe passes; the user checked it on a phone against production, and the relevant checklist items were gone through on the live site (below). Not checked by me: VoiceOver itself (the user later reported the live checklist tested by hand, screen reader items included, 2026-11-09, not recorded item by item); 320 px, text spacing (item 5), reduced motion (item 11)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the sticky button row and the text button "Stäng" are gone
- [x] Clean code: reuses `IconButton`; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board

## Live accessibility checklist

Checked on https://muppbarnen.vercel.app on 2026-11-03 in the built-in browser (Chromium, 375 × 812), reading only, on the open kid view of the two-kid November card (cross button, no wishes yet). The user also looked at it on a phone against production and found it good. Items are from [accessibility.md](../../wiki/system/accessibility.md).

| # | Item | Result |
|---|---|---|
| 1 | Keyboard | Pass. Opening the list puts the focus on "Stäng önskelistan"; Shift+Tab goes to the rows' box "Önskningar" (focusable) and Tab back; Escape closes the list |
| 2 | Focus visible | Pass. 3 px solid ring (`rgb(154, 169, 224)`) on the button, drawn in full: 27 px of card below the button |
| 3 | Screen reader | Partly. The accessibility tree names the button "Stäng önskelistan" and the rows' box "Önskningar". VoiceOver itself was not run: not checked |
| 4 | 320 px and 400 % zoom | Not checked on the live site (the local test at 375 × 667 only); no sideways scroll at 375 px |
| 5 | Text spacing | Not checked by me; the user reports it tested by hand (2026-11-09, not recorded item by item) |
| 6 | Contrast | Pass. The icon `rgb(200, 208, 220)` on the button's `rgb(20, 25, 32)` is 11.4:1 |
| 7 | Target size | Pass. Drawn 32 × 32 px, round; a point 21 px from the centre in each direction hits the button (44 × 44 px target) |
| 8 | Hover and focus content | Not affected |
| 9 | Errors and labels | Not affected: no form changed |
| 10 | Title, language, images | Not affected |
| 11 | Reduced motion | Not checked by me; the user reports it tested by hand (2026-11-09, not recorded item by item) |

## Requirements as built

### MUPP-028-R1 The button sits on the line

The site shall show the fold-up button centred on the bottom edge line of the wish list box, so that half of it is over the line and no wish row is covered by it.

Acceptance criteria:

- **Given** an open list with more wishes than fit, **when** it is scrolled to any position, **then** the button is centred on the bottom edge line of the box and covers no text of a wish row.
- **Given** the list scrolled to the end, **then** the last wish row is fully visible and can be pressed.

### MUPP-028-R2 Smaller, still easy to press

The site shall show the button as a 32 px circle, with a pressable area of at least 44 × 44 px, with the same names, focus ring and behaviour as before. On cards with several kids and Christmas Eve it shows a cross instead of the arrow, in the same place and size.

Acceptance criteria:

- **Given** the button, on a card with one kid and on one with several kids, **then** its visible size is 32 px, it has the same place and size in both (arrow up and cross), and its target is at least 44 × 44 px.
- **Given** the button is focused with the keyboard, **then** the site's focus ring is shown and fully visible (not clipped by the box).

### MUPP-028-R3 Paxa is seen at once

The site shall show "Paxa (n)" in a fixed row at the bottom of the open list box, centred above the fold-up button, when one or more wishes are marked, and not show it otherwise. It does not scroll with the list and covers no wish row.

Acceptance criteria:

- **Given** a long list, **when** a wish at the top is marked, **then** "Paxa (n)" is visible at once without scrolling, centred in the box, with the count, and opens the claim dialog as before (MUPP-005).
- **Given** the list scrolled to any position, **then** "Paxa (n)" stays in place and no wish row is under it.
- **Given** no marked wishes, **then** no Paxa button is shown and the list is as before.
- **Given** the fold-up button on the line, **then** it never covers the Paxa button.

## Notes

- Small change next to the work: `IconButton` got a `round` prop, and the corner radius moved from the shared `base` into `buttonClass` and `iconClass`, so that no two radius classes compete (as decided in MUPP-027).
- R3 changed with the user during the build: "Paxa (n)" was first the last row of the list, which hid it in a long list until scrolled to; it is now a fixed row under the rows, centred above the button.
- The list's scrolling box is now a group named "Önskningar" inside the "Önskelista" region, and it takes the keyboard focus instead of the region.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
