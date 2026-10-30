---
type: Verification
title: "MUPP-005 Kid card and claiming gifts: verification"
description: How each requirement of Kid card and claiming gifts was checked, the test suite before and after, and the requirements as built.
feature: MUPP-005
---

# Verification of MUPP-005

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-005-R1 | Test `MUPP-005-R1 R2 R3 …` in `tests/MUPP-005-kid-card-and-claiming.spec.ts` (marks without unfolding, claimed last, plain text, page does not scroll); unit tests `MUPP-005-R1` in `lib/wishes.test.ts` (order); look in `tests/design.spec.ts` `MUPP-005-R1 R3 R4 R5 …` (contrast of the marks) | local | Pass | 2026-10-30 |
| MUPP-005-R2 | Same browser test (details, link attributes, empty fields, `aria-expanded`, claimed and unlimited texts); unit test of `webLink` | local | Pass | 2026-10-30 |
| MUPP-005-R3 | Same browser test (checkboxes, "Paxa (n)", cleared when folded); unit test `canClaim`; target sizes in the design test | local | Pass | 2026-10-30 |
| MUPP-005-R4 | Test `MUPP-005-R3 R4 R5 claiming …` (focus in the name field, text, errors, Escape and Avbryt return focus to Paxa, success); design test (fit on 375 × 667, focus ring, 44 px buttons); axe with the dialog open | local | Pass | 2026-10-30 |
| MUPP-005-R5 | Unit tests in `lib/family.test.ts` (free, unlimited, claimed, missing, name and id checks, repeated id); browser test (a gift claimed meanwhile by another visitor is not overwritten, the visitor is told); `lib/route-checks.test.ts` (site check first, `guardWrite()`); code review and `/security-review` for the action. The two parallel claims of the same wish were not unit tested (see solution.md): atomicity rests on the `WHERE` clause | local | Pass | 2026-10-30 |
| MUPP-005-R6 | Test `MUPP-013-R5 MUPP-005-R6 …` in `tests/design.spec.ts`; `tests/MUPP-004-birthday-card.spec.ts` | local | Pass | 2026-10-30 |
| MUPP-005-R7 | Test `TECH-006-R5 MUPP-005-R7 …` in `tests/design.spec.ts` (no count on the narrow button); `tests/MUPP-004-birthday-card.spec.ts` (Stäng) | local | Pass | 2026-10-30 |
| MUPP-005-R8 | `tests/MUPP-004-birthday-card.spec.ts` (Christmas Eve: Stäng, back to the card) | local | Pass | 2026-10-30 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/wishes.test.ts` (4), `lib/family.test.ts` (7 claim tests), `lib/deck.test.ts` adjusted; `npm run test:unit`: 121 pass | local | Pass | 2026-10-30 |
| Browser tests | `tests/MUPP-005-kid-card-and-claiming.spec.ts` (2), `tests/design.spec.ts` (1 new, 2 renamed); `npm run test:local` equivalent on port 3177: 61 pass | local | Pass | 2026-10-30 |
| Smoke test | None new (nothing writes against production) | | Not applicable | |
| Accessibility | axe on the unfolded list, an unfolded row and the open dialog with an error; the checklist in `wiki/system/accessibility.md` on the live site: not checked yet | local | Pass locally, live not checked | 2026-10-30 |
| Security | Security points in the review; `/security-review` run: no finding | local | Pass | 2026-10-30 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-30 |

## Test suite

`npm run test:time` before and after the change. `test:local` is fixed to port 3100, which another checkout's test server was using, so the browser tests were run as `playwright test` on port 3177 with a separate `HOME`.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-013, last recorded) | 110 unit + 58 browser | 94 s | 4.8 s |
| After | 121 unit + 61 browser | 108 s (browser 1.8 min, unit 0.2 s) | under 5 s |

Time grew by about 15 %, within the 25 % limit; the browser suite is within the 3 minute budget.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; `npm run test:unit` and the browser tests pass
- [x] Test suite: within the time budgets; the new tests follow the quality rules (combined by journey, no fixed waits, data cleaned up)
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: the relevant items of `wiki/system/accessibility.md` checked on the live site
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the unused `count` prop and "Visa mer" text are gone; no unused ref; no debug output
- [x] Clean code: `npm run lint`, `npm run typecheck`, `npm run lint:docs` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### MUPP-005-R1 Wish rows

Each row in the unfolded list shall show the headline of the wish and whether it is taken or can be bought several times.

Acceptance criteria:

- **Given** an unfolded list, **then** each row shows the headline and, without unfolding, "Paxad" for a claimed gift and "Kan köpas flera gånger" for an unlimited one.
- **Given** the list, **then** claimed gifts come last, the others keep their order from the admin page.
- **Given** a long list, **then** it scrolls inside the card and the page does not scroll.
- **Given** the texts, **then** they are plain text, never HTML.

### MUPP-005-R2 Row details

A row shall unfold to show its details.

Acceptance criteria:

- **Given** a row, **when** its button is pressed, **then** it shows the description, the size and the link (opened in a new tab with `rel="noopener noreferrer"`; only `http:` and `https:` links are links), `aria-expanded` is `true`, and pressing again folds it. Empty fields are not shown.
- **Given** a claimed row that is unfolded, **then** it shows "Paxad av <name> <date>".
- **Given** an unlimited row that is unfolded, **then** it explains that it can be bought several times and that it is not claimed.

### MUPP-005-R3 Marking rows

A visitor shall be able to mark one or several rows that can be claimed.

Acceptance criteria:

- **Given** an unclaimed, limited row, **then** it has a checkbox named after the wish; claimed and unlimited rows have none (nothing to mark).
- **Given** at least one marked row, **then** the button "Paxa" appears with the number marked; with none marked it is hidden.
- **Given** the list is folded or the kid card is closed, **then** the marks are cleared.

### MUPP-005-R4 Claiming

Pressing "Paxa" shall open a window where the visitor enters their name and confirms.

Acceptance criteria:

- **Given** "Paxa" is pressed, **then** a modal dialog opens with focus in the name field, listing the marked gifts, and the text "Du paxar nu den här presenten. Om du ändrar dig, ta gärna bort paxningen så att andra vet." (plural for several).
- **Given** a name of 1–60 characters, **when** confirmed, **then** all marked gifts get that name and today's date, the dialog closes and the rows show as claimed.
- **Given** an empty or too long name, **then** the dialog stays open with an error saying what to do.
- **Given** Escape or "Avbryt", **then** the dialog closes without claiming, and focus returns to "Paxa".

### MUPP-005-R5 Claiming is checked on the server

The server shall claim only gifts that can be claimed, and each at most once.

Acceptance criteria:

- **Given** a request for a gift that is already claimed (also at the same moment as another visitor) or unlimited, or that doesn't exist, **then** that gift is not changed, no earlier claim is overwritten, and the visitor is told which gifts could not be claimed and that the list is updated.
- **Given** a request without the site session, from another origin or over the write limit, **then** nothing is claimed (`specs/rules.md`).
- **Given** the name, **then** it is trimmed and checked for length on the server; errors never show SQL or internals.

### MUPP-005-R6 Arrow buttons on a card with one kid

On a card with one kid, the wish list folds out and in with arrow buttons instead of "Visa mer" and a number of rows.

Acceptance criteria:

- **Given** a folded list, **then** the wish button says only "Önskelista" and shows an arrow pointing down; it has no "Visa mer" and no number of wishes.
- **Given** the button is pressed, **then** the list unfolds and the kid card grows to hold it (the picture gets smaller, the page still does not scroll).
- **Given** an unfolded list, **then** a button with an arrow pointing up ("Fäll ihop önskelistan", at least 44 px) is sticky at the bottom centre of the list, so it can fold the list wherever the visitor has scrolled to; it has the focus when the list opens, and the focus returns to the wish button when it folds.

### MUPP-005-R7 Several kids on one birthday: no number, Stäng

On a card with several kids on the same birthday, the narrow wish button says only "Önskelista" (no number of wishes). In an opened wish list the sticky button says "Stäng" and takes the visitor back to the card with several kids.

### MUPP-005-R8 Christmas Eve: straight to the wish list

On the Christmas Eve card, pressing a kid opens that kid's wish list directly, with the same sticky "Stäng" button as in R7, which takes the visitor back to the Christmas Eve card.

## Notes

- Claimed gifts keep their database order among themselves (the sort is stable), so the one claimed first is first among the claimed.
- A name error keeps the dialog open; gifts that could not be claimed close it and show a status line under the list.
- `test:local` uses a fixed port 3100 (noted above); not changed here.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
