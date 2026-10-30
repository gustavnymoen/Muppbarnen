---
type: Verification
title: "MUPP-014 Expose kids sizes on kids card: verification"
description: How each requirement of MUPP-014 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-014
---

# Verification of MUPP-014

The checks in the tables below were run locally on 2026-10-30. After the deploy (PR #51), Live tests passed on `main` (run 41032144275) and the accessibility checklist was gone through on the live site, see "Live accessibility checklist".

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-014-R1 | Unit tests `MUPP-014-R1 …` in `lib/deck.test.ts` (trimmed sizes, empty sizes, no birthdate) and `lib/family.test.ts` (`listDeckInput` reads the four sizes) | local | Pass | 2026-10-30 |
| MUPP-014-R2 | `MUPP-014-R2 R5 …` in `tests/MUPP-014-kid-sizes.spec.ts`; position and 44 px in `MUPP-014-R2 R3 R4 R6 …` in `tests/design.spec.ts` | local | Pass | 2026-10-30 |
| MUPP-014-R3 | `MUPP-014-R3 R4 R5 …` in the spec (names, per-kid sizes); the 70-80 % split, 44 px and one line in the design test | local | Pass | 2026-10-30 |
| MUPP-014-R4 | The spec on the single-kid, multi-kid and Christmas cards; corner position and 44 px in the design test at 320 × 568 and 375 × 667 | local | Pass | 2026-10-30 |
| MUPP-014-R5 | The spec: rows only for saved sizes, empty text, Esc and "Stäng", focus return, list and mark unchanged, focus stays out of the page, plain text, 40 characters at 320 px | local | Pass | 2026-10-30 |
| MUPP-014-R6 | The design test at 320 × 568 and 375 × 667: no page scroll, no overlap, nothing cut off sideways. On the card with two kids at 568 px high the list may still scroll inside the card, as before this change | local | Pass (see Notes) | 2026-10-30 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:time`: 125 passed | local | Pass | 2026-10-30 |
| Browser tests | `npm run test:time`: 69 passed; `tests/MUPP-014-kid-sizes.spec.ts` (6 tests, axe on every state including the open dialog) and two design tests | local | Pass | 2026-10-30 |
| Smoke test | Not applicable: no new main page or flow | - | - | 2026-10-30 |
| Accessibility | axe in every browser test state; the checklist on the live site, see below | local, live | axe pass; checklist done except what is listed as not checked | 2026-10-30 |
| Security | Security points in the review; `/security-review` run, no findings | local | Pass | 2026-10-30 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-30 |
| Design critique | `/impeccable critique` run inline (no sub-agents) on screenshots at 375 × 667: found the dialog text centred by the browser default, fixed (`text-left`) | local | Done | 2026-10-30 |

Also run: `npm run lint`, `npm run typecheck`, `npm run build` (pass). `npm run lint:docs` is checked at the end.

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-005, last recorded) | 121 unit + 61 browser | 108 s | under 5 s |
| After | 125 unit + 69 browser | 115.5 s (browser) + 0.2 s (unit) | 4.3 s |

The first run had one design test of 5.7 s, over the 5 s budget; it was split into one test per phone size.

## Definition of Done

- [x] Tests: every check in the card's test plan is done locally; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by 7 %, and the new tests follow the quality rules
- [x] Deployed (PR #51), and the smoke tests pass against production (Live tests, run 41032144275 on `main`)
- [x] Accessibility: axe passes; the relevant checklist items were gone through on the live site (below). Not checked: VoiceOver itself, text spacing (item 5), reduced motion (item 11)
- [x] Requirements in the card match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements noticed for the board

## Live accessibility checklist

Checked on https://muppbarnen.vercel.app on 2026-10-30 in the built-in browser (Chromium, desktop and emulated 320 × 568), on the two-kid card, the Christmas card with a kid's list open and a single-kid card. Items are from [accessibility.md](../../wiki/system/accessibility.md).

| # | Item | Result |
|---|---|---|
| 1 | Keyboard | Pass. Enter on the focused "Storlekar" button opens the dialog; focus moves to "Stäng" (the only control), Tab stays inside, Space/Enter on "Stäng" and Esc close it. The page behind is inert while it is open. The open wish list stays open |
| 2 | Focus visible | Pass. 3 px focus ring on "Storlekar" buttons and "Stäng", not hidden by the dialog |
| 3 | Screen reader | Partly. The accessibility tree gives "Storlekar" and "Storlekar för {name}" as button names, the dialog has a heading "Storlekar för {name}" that names it, and the icon is `aria-hidden`. VoiceOver itself was not run: not checked |
| 4 | 320 px and 400 % zoom | Pass at 320 × 568 (the same width as 400 % of 1280): no sideways scroll, dialog inside the screen, nothing cut off or overlapping on the Christmas card (corner icon) and the single-kid card |
| 5 | Text spacing | Not checked |
| 6 | Contrast | Pass. Icon `rgb(200, 208, 220)` on the button background `rgb(20, 25, 32)` is 11.4:1, also on the Christmas card (the corner button is opaque, so the card behind does not matter). The button border was judged by eye only |
| 7 | Target size | Pass. Icon buttons 44 × 44 px; the "Storlekar" button is 44 px high (a card that is not in front is scaled down by the carousel, so it measures smaller on screen) |
| 8 | Hover and focus content | Not affected: the sizes show in a dialog, not a tooltip |
| 9 | Errors and labels | Not affected: no form |
| 10 | Title, language, images | Not affected: no new page or image; the icon is decoration (`aria-hidden`) |
| 11 | Reduced motion | Not checked |

## Requirements as built

As on the card (`gh issue view 43`), unchanged:

- **R1 Sizes reach the deck:** every kid of the deck has `clothes`, `shoes`, `head` and `gloves` as trimmed text (empty when none), and nothing more about the child.
- **R2 "Storlekar" on the single-kid card:** a button "Storlekar" with the sizes icon between the age and "Önskelista", at least 44 px high, opens the dialog.
- **R3 Icon beside the wish button on the multi-kid card:** per kid an icon button "Storlekar för {name}", at least 44 × 44 px, on one line with "Önskelista", which takes 70-80 % of the two together.
- **R4 Icon in the corner of an open kid view:** the icon button "Storlekar", at least 44 × 44 px, in the top right corner whenever a kid's list is open on any card; the "Storlekar" button of R2 is then not shown.
- **R5 The sizes dialog:** modal, "Storlekar för {name}", one row per saved size (Kläder, Skor, Huvud, Handskar), "Inga storlekar inlagda än." when none, "Stäng"; Esc or "Stäng" closes it, focus returns to the opening button, the open list and marks are unchanged, focus stays inside, plain text, 40 characters wrap at 320 px.
- **R6 It fits:** no scroll of the main page, no overlap and nothing cut off at 320 × 568 and 375 × 667.

## Notes

- To make R6 hold, the single-kid picture now shrinks with the screen height (`SOLO_AVATAR`, 96-192 px) and the month in an open kid view is smaller on phones narrower than 23 rem, so the corner icon fits.
- The design checks are two tests (one per phone size) in `tests/design.spec.ts` instead of additions to the existing tests, to keep each under the 5 s budget.
- Esc in the claim dialog used to close the open wish list as well; the shared `Dialog` now stops that.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
