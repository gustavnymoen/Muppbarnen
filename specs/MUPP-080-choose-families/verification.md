---
type: Verification
title: "MUPP-080 Choose families: verification"
description: How each requirement of the choice of families was checked, the test suite before and after, and the requirements as built.
feature: MUPP-080
---

# Verification of MUPP-080

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-080-R1 | Unit tests `MUPP-080-R1 …` in `lib/family-choice.test.ts` (Alla is no filter, a list is the chosen ids); browser test `MUPP-080-R1 R2 R3 R4 R5 R6 …` in `tests/MUPP-080-choose-families.spec.ts` (the card lists Alla and each family with its description from the start, nothing ticked is refused, one family chosen, the dialog from the button changes it, Alla unticks the families and shows both families' Secret Santa) | local | Pass | 2026-11-17 |
| MUPP-080-R2 | Unit tests `MUPP-080-R2 …` (fewer than two families: nothing asked; two or more and no choice: asked); the browser test above (the card on both pages, no child or Secret Santa shown). With one family nothing changes: every existing browser test runs with the one default family and passes unchanged | local | Pass | 2026-11-17 |
| MUPP-080-R3 | Unit test `MUPP-080-R3 …` (only children whose parent is in a chosen family, a parent in both once); the browser test (the chosen family's children, not the other family's) | local | Pass | 2026-11-17 |
| MUPP-080-R4 | Unit test `MUPP-080-R4 …` (`entranceEvents` by family); the browser test (only the chosen family's Secret Santa is listed, and after changing the choice the other's) | local | Pass | 2026-11-17 |
| MUPP-080-R5 | The browser test: with one Secret Santa in the chosen family the list "Vilken Secret Santa är du med i?" is shown with the link, not the names. Not clicked through in the test; the click-through to the names is the existing flow (`MUPP-048`) | local | Pass | 2026-11-17 |
| MUPP-080-R6 | Unit tests `MUPP-080-R6 …` (the cookie is read and written, odd values are no choice, ids that no longer exist are ignored); the browser test (the choice stays after a reload, changed at the top left both pages follow) | local | Pass | 2026-11-17 |
| MUPP-080-R7 | `tests/MUPP-035-onboarding-card.spec.ts` checks the text "Valet filtrerar bara det som visas" in the visitor tab | local | Pass | 2026-11-17 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit` | local | Pass (438 tests, 8 new in `lib/family-choice.test.ts`) | 2026-11-17 |
| Browser tests | `tests/MUPP-080-choose-families.spec.ts` (1 test, axe on the card with its error and on the dialog) and one line added to `tests/MUPP-035-onboarding-card.spec.ts` | local | Pass | 2026-11-17 |
| Smoke test | Unchanged: with one family nothing changes on the main pages. Live tests (the smoke tests) ran after the merge | live | Pass (Live tests run 43886892076 on the merge commit `9b9b3a5`) | 2026-11-16 |
| Accessibility | axe in the browser test; the live checklist (`wiki/system/accessibility.md`, items 1-7, 9 and 11 apply; 8 and 10 are not affected) is not done | local | Partly: live checklist not done | 2026-11-17 |
| Security | The security points of the review passed (site session and `guardWrite()` first, ids checked as numbers that exist, strict cookie parsing, parameterized SQL). `/security-review` not run: the card says it is probably not needed, as nothing is written to the database | local | Pass | 2026-11-17 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-17 |
| Look | Screenshots on phone widths (390 × 844 and 375 × 667) and on a wide screen of the card, the dialog and the icon button, on the start page and on Secret Santa, were looked at and approved by the user in the conversation. `/impeccable critique` was run on a demo database with made-up data (390 × 844, start page, Secret Santa, the card and the dialog): the detector found nothing and the review found nothing clearly wrong, so nothing was changed. The look is checked in `MUPP-080-R1 R2 …` in `tests/MUPP-080-choose-families.spec.ts` (the card is at most 28 rem wide, fits the screen and has 44 px rows; the button is a 44 px icon in the top left, clear of the menu, no sideways scroll), not in `tests/design.spec.ts` as the card's plan says: the state (two families) exists only in that test, and a test of its own would have put the suite over its budget (350.7 s with a separate test) | local | Pass | 2026-11-16 |

## Test suite

`npm run test:time` before and after the change (budget 350 s).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 190 browser (MUPP-073 verification) | 342.5 s | 6.6 s |
| After | 438 unit + 190 browser | 344.7 s (2026-11-16, after the look checks were added to the existing test) | 6.9 s |

The change added 1 browser test (3.0 s alone) and one line to an existing one, and merged the two MUPP-073 browser tests into one (4.9 s together, 5.2 s before) because the first full run was over the budget (351.4 s and 352.0 s, 191 tests). The whole run before the look checks, 340.9 s, was made after all changes to the look; after it only the wording "sortering" became "filtrering" and the two affected spec files were run again and passed.

## Definition of Done

- [x] Tests: every requirement has a test; unit and browser tests pass
- [x] Test suite: 340.9 s, within the 350 s budget
- [x] Deployed, and the smoke tests pass against production (Live tests, run 43886892076, 2026-11-16)
- [ ] Accessibility: axe passes; the live checklist is not done
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, lint:docs and typecheck pass; build not run again after the last look changes
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

Copied from the card (#279).

### MUPP-080-R1 Choose families

The site shall let a visitor choose one or more families, or Alla (no filter), in a dialog that lists each family's name and description.

Acceptance criteria:

- **Given** the dialog, **when** the visitor ticks two families and confirms, **then** both are chosen.
- **Given** the dialog, **when** the visitor ticks Alla, **then** nothing is filtered, including families added later.

### MUPP-080-R2 Nothing is shown before a choice

The site shall, when there are two or more families and the visitor has not chosen, show a ghost card asking them to choose family, on the start page and on Secret Santa, and no children or groups.

Acceptance criteria:

- **Given** a visitor with no choice, **when** they open the start page or Secret Santa, **then** a ghost card asks them to choose family and no child or group is listed.
- **Given** only one family exists, **when** a visitor opens either page, **then** everything is shown and no choice or ghost card appears.

### MUPP-080-R3 The start page shows the chosen families' children

The site shall show a child on the start page only when its parent belongs to a chosen family.

Acceptance criteria:

- **Given** families X and Y with different parents, **when** the visitor has chosen X, **then** only the children of X's parents are shown, and cards with no child left are gone.
- **Given** a parent in both X and Y, **when** either is chosen, **then** the parent's children are shown (once).

### MUPP-080-R4 Secret Santa lists the chosen families' groups

The site shall list only the Secret Santa groups of the chosen families.

Acceptance criteria:

- **Given** groups in X and in Y, **when** the visitor has chosen X, **then** only X's groups are listed.

### MUPP-080-R5 Groups are always listed, even a single one

The site shall list the Secret Santa groups of the chosen families as a list the visitor has to click through, also when there is only one, so that a wrong choice of families is easy to notice.

Acceptance criteria:

- **Given** a visitor whose chosen families have exactly one Secret Santa group, **when** they open Secret Santa, **then** the group is listed and they must click it to reach its participants.

### MUPP-080-R6 The choice is remembered and reachable

The site shall remember the choice in a cookie on the device, and let the visitor change it from the top left of the start page and of Secret Santa.

Acceptance criteria:

- **Given** a choice, **when** the visitor reloads or returns, **then** the same families are chosen.
- **Given** either page, **when** the visitor opens the choice at the top left and changes it, **then** both pages follow.
- **Given** a cookie naming a family that no longer exists, **when** the page loads, **then** that family is ignored.

### MUPP-080-R7 Explained in "Så funkar det"

The site shall describe the choice of families in a short text in "Så funkar det", including that it only sorts what is shown.

Acceptance criteria:

- **Given** the dialog "Så funkar det", **when** it is open, **then** the text about families is in it.

[Specifications](../index.md)
