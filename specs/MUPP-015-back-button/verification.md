---
type: Verification
title: "MUPP-015 Back button on kids card: verification"
description: How each requirement of MUPP-015 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-015
---

# Verification of MUPP-015

The checks in the tables below were run locally on 2026-10-30. After the deploy (PR #56), Live tests passed on `main` (run 41058524717 on `0a1cfcd`) and the accessibility checklist was gone through on the live site, see "Live accessibility checklist".

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-015-R1 | `MUPP-015-R1 R2 R3 …` (birthday card with several kids, Christmas card) and `MUPP-015-R1 the single kid card has no Tillbaka …` in `tests/MUPP-015-back-button.spec.ts`; corner position, 44 px, heading centred and no overlap in `MUPP-014-R2 R3 R4 R6 MUPP-015-R1 R4 …` in `tests/design.spec.ts` | local | Pass | 2026-10-30 |
| MUPP-015-R2 | The journey tests: two gifts marked, "Tillbaka", all kids shown, deck unlocked (announcement "Kortleken är upplåst." and "Nästa kort" enabled), focus on the kid's button, no marks on reopening; Esc and "Stäng" repeated and unchanged | local | Pass | 2026-10-30 |
| MUPP-015-R3 | The journey tests: accessible names "Tillbaka till alla barn" / "Tillbaka till Julafton", tab order Tillbaka, Storlekar, the list; axe on the open view. The screen reader itself (VoiceOver) was not run: not checked | local | Pass (VoiceOver not checked) | 2026-10-30 |
| MUPP-015-R4 | The design test at 320 × 568 and 375 × 667: no page scroll, no overlap with the heading, the picture or the sizes icon, contrast 4.5:1 or more (also on the Christmas card) | local | Pass | 2026-10-30 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned: no logic. `npm run test:time`: 125 passed | local | Pass | 2026-10-30 |
| Browser tests | `tests/MUPP-015-back-button.spec.ts` (3 tests, axe on the open view) and the extended design test; `npm run test:time`: 72 passed | local | Pass | 2026-10-30 |
| Smoke test | Not applicable: no new main page or flow | - | - | 2026-10-30 |
| Accessibility | axe in the browser tests; the checklist on the live site, see below | local, live | axe pass; checklist done except what is listed as not checked, and one finding at 320 × 568 | 2026-10-30 |
| Security | Not needed: no sign-in, admin, route, server action, query or personal data | - | - | 2026-10-30 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-30 |
| Design critique | `/impeccable critique` run inline, from code and measurements: the heading between the corner buttons overlapped at 375 px, so the heading got its own row | local | Done | 2026-10-30 |

Also run: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` (see the Definition of Done).

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-014) | 125 unit + 69 browser | 115.5 s (browser) + 0.2 s (unit) | 4.3 s |
| After | 125 unit + 72 browser | 124.0 s (browser) + 0.2 s (unit) | 4.7 s |

Three browser tests were added; the look checks went into the existing design test. The total time grew by 7 %, within the budgets (the first number is a different run of the same suite, so some of the change is noise).

## Definition of Done

- [x] Tests: every check in the card's test plan is done locally; `npm run test:unit` and `npm run test:local` pass
- [x] Deployed (PR #56), and the smoke tests pass against production (Live tests, run 41058524717 on `main`)
- [x] Accessibility: axe passes; the relevant checklist items were gone through on the live site (below). Not checked: VoiceOver itself, text spacing (item 5), reduced motion (item 11). Finding: at 320 × 568 the wish list of the birthday card with two kids is squeezed to 10 px (item 4)
- [x] Requirements in the card match what was built, no open questions; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code
- [x] Code review done, no must-fix findings
- [x] No larger improvements noticed for the board
- [x] Test suite within the time budgets

## Live accessibility checklist

Checked on https://muppbarnen.vercel.app on 2026-10-30 in the built-in browser (Chromium, desktop width and emulated 320 × 568 and 375 × 667), reading only, on the open kid view of the two-kid November card and of the Christmas card. Items are from [accessibility.md](../../wiki/system/accessibility.md).

| # | Item | Result |
|---|---|---|
| 1 | Keyboard | Pass. On the two-kid card the tab order inside the card is Tillbaka, Storlekar, the wish list; Enter on Tillbaka closes the list and shows all kids (focus on the kid's "Önskelista" button). On the Christmas card the order is Tillbaka, Storlekar, "Önskelista", "Stäng önskelistan", and Tab then Enter on Tillbaka closes the list; where focus lands there was not read |
| 2 | Focus visible | Pass. Tillbaka has a 3 px solid focus ring (`rgb(154, 169, 224)`) when reached with Tab |
| 3 | Screen reader | Partly. The accessibility tree names the buttons "Tillbaka till alla barn" and "Tillbaka till Julafton". The live region text was not read on the live site, and VoiceOver itself was not run: not checked |
| 4 | 320 px and 400 % zoom | Partly. Pass at 320 × 568 for the Christmas card and at 375 × 667 for the two-kid card: no sideways or page scroll, no overlap of Tillbaka, the sizes icon and the heading. **Finding:** at 320 × 568 the wish list of the two-kid card (Wilda, no wishes yet) is a 10 px high scroll area, so a longer list could hardly be read; at 375 × 667 it is 121 px. Not fixed here; proposed as a card |
| 5 | Text spacing | Not checked |
| 6 | Contrast | Pass. Text `rgb(200, 208, 220)` on `rgb(20, 25, 32)` is 11.4:1 on both cards (the button is opaque). The button border was judged by eye only |
| 7 | Target size | Pass. Tillbaka is 126 × 44 px and the sizes icon 44 × 44 px at 320 px, on both cards |
| 8 | Hover and focus content | Not affected: no tooltip or menu |
| 9 | Errors and labels | Not affected: no form |
| 10 | Title, language, images | Not affected: no new page or image; the arrow is decoration |
| 11 | Reduced motion | Not checked |

## Requirements as built

As on the card (`gh issue view 50`), with one clarification: a Christmas card with one kid counts as a single-kid card and has no button.

- **R1 A back button:** a button with an arrow pointing left and "Tillbaka" in the top left corner of the open kid view on a birthday card with several kids and on the Christmas card, at least 44 px high, the heading centred and not overlapped; none on a card with one kid.
- **R2 It does what "Stäng" does:** closes the list, forgets the marked gifts, shows all kids, unlocks the deck, focus on the kid's button; Esc and "Stäng" unchanged.
- **R3 Keyboard and screen reader:** first in the tab order of the open view, named "Tillbaka till alla barn" or "Tillbaka till Julafton"; the live region says the deck is unlocked.
- **R4 It fits:** no scroll of the main page, no overlap with the heading or the picture, contrast 4.5:1 or more at 320 × 568 and 375 × 667. The heading has a row of its own under the corner buttons.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
