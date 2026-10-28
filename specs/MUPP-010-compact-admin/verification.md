---
type: Verification
title: "MUPP-010 Compact admin: verification"
description: How each requirement of Compact admin was checked, the test suite before and after, and the requirements as built.
feature: MUPP-010
---

# Verification of MUPP-010

Everything below was checked locally on 2026-10-28 against the local test server (its own database and picture folder), never against the user's own database or Blob store.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-010-R1 | Browser tests `MUPP-010-R1 R2 R6 Hantera starts folded …` (headings, slim cards, nothing unfolded, "Huvudadministratör"), `MUPP-010-R1 R3 a card unfolds with its form …` (information and form on unfolding), `MUPP-010-R1 R3 R5 a kid's page …` (slim rows, "Ny önskning" folded); the updated MUPP-003 tests (the parent page shows a slim card per kid) | local | Pass | 2026-10-28 |
| MUPP-010-R2 | Browser test `MUPP-010-R1 R2 R6 Hantera starts folded …` (accessible names, `title` tooltips, at least 32 × 32 px, room between neighbours, buttons with text keep theirs); `MUPP-003-R8 every admin page works at … px` (icon buttons 32 px, all other controls 44 px); `MUPP-003-R4 R8 wish lists …` and `MUPP-003-R5 …` (the confirmations still name what is removed); `tests/design.spec.ts` (size and look of the icon buttons) | local | Pass | 2026-10-28 |
| MUPP-010-R3 | Browser test `MUPP-010-R1 R3 a card unfolds with its form …` (pencil opens and closes, another card, the picture panel and the "new" forms fold the first, Esc and saving fold, a form with a mistake stays open); `MUPP-010-R6 with the keyboard only …` | local | Pass | 2026-10-28 |
| MUPP-010-R4 | Browser test `MUPP-010-R4 a picture is uploaded …` (upload, the "Bild" row with the trash can, the confirmation naming the kid, Avbryt keeps, Ta bort clears the column and the file, the avatar shows, `/bilder/<id>` is 404); unit tests `MUPP-010-R4 …` in `lib/family.test.ts` (master admin clears and gets the name back, no picture is no change, a parent, a visitor, a bad id and a missing kid are refused) and `lib/pictures.test.ts` (removing a gone file is no error); `lib/route-checks.test.ts` requires the three checks in `removeChildPicture`; the order (database first, file after) read in the review | local | Pass | 2026-10-28 |
| MUPP-010-R5 | Browser tests `MUPP-010-R1 R3 R5 a kid's page …` (sizes, Födelsedag and Jul are three separate cards, sizes folded, "Sparat." read out, opening an item folds the sizes) and `MUPP-003-R3 sizes are edited and saved …` | local | Pass | 2026-10-28 |
| MUPP-010-R6 | Browser tests `MUPP-010-R6 five kids fit on a phone without scrolling` (375 × 667 and 430 × 932), `MUPP-010-R6 the unfolded panels have no sideways scroll at 320 and 430 px, and pass axe`, `MUPP-010-R6 with the keyboard only …`; card height (at most 56 px) in the R1 tests and in `design.spec.ts`; axe on the folded and unfolded Hantera, the picture panel, the confirmation, the kid's page and the sizes card | local | Pass | 2026-10-28 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/family.test.ts`, `lib/pictures.test.ts`; `lib/route-checks.test.ts` needs no change (it finds the new action) | local, CI | Pass | 2026-10-28 |
| Browser tests | `tests/MUPP-010-compact-admin.spec.ts` (7 tests), the MUPP-003 tests updated to the new buttons, the look in `tests/design.spec.ts` | local, CI | Pass | 2026-10-28 |
| Smoke test | Not needed: no new main page; `/admin` is already in the smoke test | not applicable | Not applicable | 2026-10-28 |
| Accessibility | axe in the browser tests on every changed page and state. The checklist on the live site (keyboard, VoiceOver for the icon names and the folding, 200 % zoom and 320 px, target sizes; MUPP-003's items too) is **not checked**: it comes after the deploy | local | axe Pass; checklist not checked | 2026-10-28 |
| Security | The security points in the review; `/security-review` over the branch: no findings | local | Pass | 2026-10-28 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-28 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-003) | 92 unit, 37 browser | 68.4 s | 4.3 s |
| After | 95 unit, 44 browser | 76.4 s | 4.4 s |

The browser time grew about 12 %, inside the 25 % rule and the budgets. One new test was split in two to stay under 5 s. `adminSignIn` now waits for "Byt förälder" when it chooses a parent, since a page opened before the choice was stored showed "Sidan finns inte" (a flaky start found by the new tests).

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by 12 %, and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): not done, comes after the merge
- [ ] Accessibility: axe passes on the changed pages and states; the checklist on the live site is not done yet (after the deploy)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: `Disclosure.tsx`, the large buttons and the size chips on the parent's page are deleted; no commented-out code or debug output
- [x] Clean code: reuses `IconButton`, `ConfirmAction`, `Form`, `Avatar`, `Card`; `npm run lint`, `lint:docs`, `typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none needed

## Requirements as built

Copied from the card (`gh issue view 30`). As built, with two clarifications: "one open at a time" holds for the whole page (one `FoldGroup` per page, so a list, a picture panel and a "new" form all fold each other), and the parent's own page shows each kid as a slim card with the list icon only (the sizes are on the kid's page, in their own card).

### MUPP-010-R1 Slim cards, folded

Acceptance criteria:

- **Given** "Hantera", **then** it has the headings "Föräldrar" and "Barn", and under each a stack of slim cards, one per parent or kid. A folded card shows only a small thumbnail (a kid: the picture or the avatar with the initial; a parent: no picture), the name and the icon buttons; for a parent also "Huvudadministratör" when it applies.
- **Given** a card that is unfolded, **then** the picture and the information beside it (name, birthdate, parent) look as they do today, and only the buttons below them are icons (R2); the edit form opens under them.
- **Given** the page is opened, **then** every card is folded.
- **Given** the parent's own page (their kids) and a kid's page, **then** a kid is a slim card in the same way, and every wish list item is a slim row (title, with its icon buttons) that unfolds to its details; "Ny önskning" and the sizes are folded until chosen.

### MUPP-010-R2 Icon buttons

Acceptance criteria:

- **Given** a card or a row, **then** "Ändra" is a pencil, "Ta bort" a trash can and "Bild" a picture icon, and "Önskelistor och storlekar" (the link to a kid's page) an icon too (a list), each with an accessible name that says what it is for (for example "Ändra Otis", "Ta bort Otis", "Bild för Otis", "Önskelistor för Otis") and a tooltip with the same text. "Ny förälder", "Nytt barn", "Ny önskning" and the buttons that send a form keep their text.
- **Given** an icon button, **when** measured, **then** its touch target is at least 32 × 32 px, and there is room between neighbours so that the targets do not overlap. This replaces 44 × 44 px (MUPP-001-R4) for the compact icon buttons only; all other buttons stay at 44 × 44 px. WCAG 2.2 level AA asks for 24 × 24 px.
- **Given** "Ta bort", **then** the confirmation that names what is removed stays as it is.

### MUPP-010-R3 One open at a time

Acceptance criteria:

- **Given** a folded card, **when** the pencil is chosen, **then** the card unfolds with its form; **when** it is chosen again (or the form is saved), **then** it folds.
- **Given** one card, picture panel or "new" form is open, **when** another is opened (a card, "Ny förälder", "Nytt barn", "Ny önskning"), **then** the first one folds, so at most one is open in a list.
- **Given** a form with a mistake, **then** it stays open with its message next to the field.

### MUPP-010-R4 Pictures

Acceptance criteria:

- **Given** a kid, **when** the picture icon is chosen, **then** a small panel opens with the file field and "Spara bild", as today (JPEG, PNG or WebP, at most 4 MB).
- **Given** a kid with a picture, **then** the panel shows a row with a small thumbnail, the text "Bild" and a trash can (accessible name "Ta bort bilden för Otis"). Choosing it asks first, naming the kid, and then removes the picture from the store and clears it from the kid, who shows the avatar again.
- **Given** the removal, **then** only the master admin can do it: the server checks the site cookie, the admin cookie and `guardWrite()`, validates the id, and refuses it for anyone else, as for every other action.

### MUPP-010-R5 Sizes in their own card

Acceptance criteria:

- **Given** a kid's page, **then** the sizes (clothes, shoes, head, gloves) are their own card, folded until chosen, and not part of or under the wish lists; the wish lists "Födelsedag" and "Jul" are separate cards of their own.
- **Given** the sizes card is opened, **then** the form works as today ("Sparat." read out, a bad value shows a message next to the field), and it follows the rule of one open at a time (R3).

### MUPP-010-R6 Smaller and mobile

Acceptance criteria:

- **Given** the admin pages, **then** headings, spacing and the thumbnails are smaller than today, so that a folded card is about one line high (at most about 56 px) and at least five kids fit on a phone screen without scrolling the page.
- **Given** a screen from 320 × 568 to 430 × 932 px and a desktop, **then** every admin page works with no sideways page scroll.
- **Given** the changed pages and states (folded, unfolded, the sizes card, the picture panel, the confirmation), **then** each passes axe, every control has an accessible name, and everything works with the keyboard only (Tab, Enter, Escape).

## Notes

- **The parent's page no longer shows the sizes.** A folded card shows only thumbnail, name and icons (R1), so the chips would have been hidden; the sizes are on the kid's page.
- **Hover:** the tooltip is the `title` attribute, so it shows on a mouse hover and with a long press, not on keyboard focus; the accessible name is the same text, which screen readers read on focus.
- **Names that wrap:** a long name wraps in the slim row, so such a card is higher than 56 px; the height checks use short names, as real ones are.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
