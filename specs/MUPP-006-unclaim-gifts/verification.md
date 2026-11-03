---
type: Verification
title: "MUPP-006 Unclaim gifts: verification"
description: How each requirement of Unclaim gifts was checked, the test suite before and after, and the requirements as built.
feature: MUPP-006
---

# Verification of MUPP-006

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-006-R1 | Test `MUPP-006-R1 …` in `tests/MUPP-006-unclaim-gifts.spec.ts` (button on claimed rows only, 44 px, axe at 320 px); unit test `MUPP-006-R1` of `canUnclaim` in `lib/wishes.test.ts`; look in `tests/design.spec.ts` (`… MUPP-006-R1 R2 …`: frameless, in the checkbox column, orange, contrast ≥ 3:1) | local | Pass | 2026-11-03 |
| MUPP-006-R2 | Test `MUPP-006-R2 …` (title, text, focus on Avbryt, Escape and Avbryt return focus to the arrow and change nothing, marks kept, axe with the dialog open); design test (fits 320 px, buttons side by side, 44 px) | local | Pass | 2026-11-03 |
| MUPP-006-R3 | Test `MUPP-006-R3 R4 …` (row unclaimed with a checkbox, focus on the fold button, kept after reload); unit tests `MUPP-006-R3 …` in `lib/family.test.ts` (claim removed and claimable again; unclaimed, unlimited and missing wishes unchanged) | local | Pass | 2026-11-03 |
| MUPP-006-R4 | Same browser test (status line on success); test `MUPP-006-R4 …` (claim removed by someone else meanwhile: told so, list updated) | local | Pass | 2026-11-03 |
| MUPP-006-R5 | Test `MUPP-006-R5 …` (no site session: nothing changed, told to log in); unit test `MUPP-006-R5 …` (bad ids change nothing and get the error text; tested there rather than in the browser, see the card's test plan); `lib/route-checks.test.ts` (site check first, `guardWrite()`); code review and `/security-review` | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/family.test.ts` (3 new), `lib/wishes.test.ts` (1 new), `lib/route-checks.test.ts` (covers the new action) | local | Pass | 2026-11-03 |
| Browser tests | `tests/MUPP-006-unclaim-gifts.spec.ts` (5 new), the open-list test in `tests/design.spec.ts` extended | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: the card adds no smoke test; the start page smoke test is unchanged | — | — | — |
| Accessibility | axe in R1, R2 and R3 (list with claimed rows, dialog, after removal) at 320 px; the checklist on the live site: not checked yet (after the deploy) | local | Pass (axe) | 2026-11-03 |
| Security | Security points in the review and `/security-review` (no findings): see [review.md](review.md) | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md): passed in run 1, the two should-fix findings fixed | local | Passed | 2026-11-03 |
| Design | Two proposals tried with the user in the running site at 320 px (2026-11-03); Impeccable critique 33/40, no finding needing a change (`.impeccable/critique/`, local only) | local | Done | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-010) | 137 unit + 103 browser | 168.6 s | 4.7 s |
| After | 141 unit + 108 browser | 169.5 s | 4.4 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the live accessibility checklist after the deploy); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (169.5 s of 180 s, +0.5 % against TECH-010's 168.6 s; slowest 4.4 s of 5 s), and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (Live tests): run 41648268605 against the merge `6660ace8` passed (2026-11-03)
- [ ] Accessibility: axe passes on the changed states; the checklist in `wiki/system/accessibility.md` on the live site (button name, the arrow's contrast, focus after the dialog, the status line): after the deploy
- [x] Requirements in the card match what was built (rewritten with the user on 2026-11-03: one claim at a time with an undo arrow, "Ta bort" on the confirm button), no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/startsidan.md`), system docs (`wiki/system/start-page.md`, `DESIGN.md`) and `wiki/log.md` updated
- [x] No leftovers: the prototype switch between the two proposals, its launch configuration and its database are removed
- [x] Clean code: reuses `Dialog`, `IconButton` and the claim's `done` step; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### MUPP-006-R1 Claimed rows have an undo button

The site shall give every claimed row that is not "Kan köpas flera gånger" a button with an undo arrow, named "Ta bort paxningen på {title}", in the open list, in the place and with the size of the checkbox of unclaimed rows.

Acceptance criteria:

- **Given** an open list with a claimed wish, **then** its row has the button "Ta bort paxningen på {title}", at least 44 × 44 px, and no checkbox.
- **Given** an unclaimed wish, **then** its row has a checkbox and no undo button; **given** a row that can be bought several times, **then** it has neither.

### MUPP-006-R2 Confirmation before removing

The site shall, when the visitor presses the undo button, open a modal dialog "Ta bort paxningen" that names the gift and who claimed it ("{title} är paxad av {name}."), asks "Är du säker? Ta bara bort paxningen på presenter du själv har paxat.", and has the buttons "Avbryt" and "Ta bort" (short, so that both fit side by side on a 320 px phone). Nothing is changed until the visitor confirms.

Acceptance criteria:

- **Given** the dialog is open, **then** focus is on "Avbryt" (so Enter does not remove the claim by mistake); Esc and "Avbryt" close it without changing anything, focus returns to the undo button, and rows marked for claiming stay marked.
- **Given** the dialog, **then** it meets the same accessibility rules as the claim dialog (modal, labelled and described, axe clean).

### MUPP-006-R3 Removing the claim

The site shall, when the visitor confirms, remove the claim on the wish (`claimed_by` and `claimed_at` become empty) through a server action that follows the security rules of `specs/rules.md`, and then show the row as unclaimed.

Acceptance criteria:

- **Given** a claimed wish, **when** the visitor confirms, **then** the row is unclaimed (no "Paxad", no "Paxad av …") and has a checkbox, the dialog is closed and focus is on the button that folds or closes the list.
- **Given** the page is reloaded or opened by another visitor, **then** the row is still unclaimed.
- **Given** a wish that can be bought several times, an unclaimed wish, or an id that does not exist, **when** the action is called with it, **then** nothing is changed.

### MUPP-006-R4 Message afterwards

The site shall tell the visitor, in the status line under the list, what happened: "Paxningen på {title} är borttagen.", or "Paxningen på {title} var redan borttagen. Listan är uppdaterad." when someone else removed it first (or the wish is gone), and the list then shows the current state.

Acceptance criteria:

- **Given** the visitor confirms, **then** the status line says "Paxningen på {title} är borttagen." and a screen reader reads it.
- **Given** another visitor removes the claim while the dialog is open, **when** the visitor confirms, **then** the status line says it was already removed and the row is shown as unclaimed.

### MUPP-006-R5 Safe on the server

The site shall check on the server that the visitor is signed in, that the request is allowed (`guardWrite()`), and that the id is one positive whole number, and shall never show internals in an error.

Acceptance criteria:

- **Given** no site session, **when** the visitor confirms, **then** nothing is changed and the dialog says "Något gick fel. Ladda om sidan och försök igen." (`proxy.ts` refuses the request before the action runs; a reload leads to the password page). The action also refuses on its own without a session ("Du är utloggad. Ladda om sidan och logga in igen."), shown by `lib/route-checks.test.ts`.
- **Given** a bad id (not a positive whole number), **then** nothing is changed and the error text says what to do, without SQL or names from the code.
- **Given** `lib/route-checks.test.ts`, **then** it passes for the new action.

## Notes

- After the deploy the user tried it on their phone (2026-11-03) and found it good. Two things they noticed went to a new card instead of this one: focus rings that show after a tap when a dialog opens and closes (all dialogs, not only this one), and the birthdate field in the admin that is wider than the page on iOS Safari. The accessibility checklist on the live site is not gone through item by item yet.
- The first full run had 7 failures, all in the tests: three older tests looked up a row's button by the title (`getByRole("button", { name: "Hoppborg" })`), which now also matches "Ta bort paxningen på Hoppborg", so they match the start of the name; and the new tests clicked "Önskelista" while the cards faded in, which made Playwright scroll the deck sideways (not seen with a click after the animation, nor on `main` with one), so they wait for the animation first.
- R5: without a site cookie `proxy.ts` refuses the server action with 401 before it runs, so the action's own "Du är utloggad …" never reaches the browser; the dialog shows "Något gick fel. Ladda om sidan och försök igen." (a reload leads to the password page). R5's acceptance criterion was changed to this with the user (2026-11-03).
- Small and related (TECH-010 leftovers, carried in this change): `specs/TECH-010-flaky-thumbnail/verification.md` records that Live tests passed against production for the merge `1accb989` (run 41642127355, 2026-11-03), and `specs/features.md` lists TECH-010 as Done (card #54 is in Done on the board).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
