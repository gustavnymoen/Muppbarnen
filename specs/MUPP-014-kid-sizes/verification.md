---
type: Verification
title: "MUPP-014 Expose kids sizes on kids card: verification"
description: How each requirement of MUPP-014 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-014
---

# Verification of MUPP-014

All checks below were run locally on 2026-10-30. Nothing was checked on the live site or in CI yet.

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
| Accessibility | axe in every browser test state. The checklist items on the live site (keyboard, screen reader names, 400 % zoom, contrast on the Christmas card) are not checked yet | local | axe pass; checklist not checked | 2026-10-30 |
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
- [ ] Deployed, and the smoke tests pass against production (Live tests): not done yet
- [ ] Accessibility: axe passes; the checklist on the live site is not done yet
- [x] Requirements in the card match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements noticed for the board

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
