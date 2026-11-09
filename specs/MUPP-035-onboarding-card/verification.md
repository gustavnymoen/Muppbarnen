---
type: Verification
title: "MUPP-035 Onboarding card: verification"
description: How each requirement of the onboarding card was checked, the test suite before and after, and the requirements as built.
feature: MUPP-035
---

# Verification of MUPP-035

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-035-R1 | Test `MUPP-035-R1 R2 R3 R4 R5 R6 R7 …` (opens by itself with focus inside, the page behind cannot be pressed, OK closes it, no dialog after a reload) and `MUPP-035-R1 R2 every way of closing …` (not on the password page) in `tests/MUPP-035-onboarding-card.spec.ts`; `global-setup.ts` shows the dialog is the first thing a new sign-in meets. Not opened on the admin pages: only `app/page.tsx` passes `onboarding` (code review, not a test) | local | Pass | 2026-11-04 |
| MUPP-035-R2 | Same tests: OK, "Stäng", Esc and a press outside each in a fresh browser context set the cookie; closing from the menu with Esc | local | Pass | 2026-11-04 |
| MUPP-035-R3 | Same journey: the menu lists Start, Så funkar sajten, Admin; the item opens the dialog on "Besökare"; focus is back on "Meny" after Esc. `MUPP-002-R1 R2 R4` updated for the new item | local | Pass | 2026-11-04 |
| MUPP-035-R4 | Same journey reads the texts of the "Besökare" panel ("Paxad", "Kan köpas flera gånger", the orange arrow); axe | local | Pass | 2026-11-04 |
| MUPP-035-R5 | Same journey reads the "Förälder" panel ("Admin", "Obegränsad", "Arkiverade"); axe. Checked against `wiki/manual/admin.md` when written | local | Pass | 2026-11-04 |
| MUPP-035-R6 | Same journey: tab list "Läs som" with the two tabs, `aria-selected`, arrow keys, Tab into the panel. `design.spec.ts` `MUPP-035-R6 …` at 320 × 568: fits, panel scrolls, 44 px buttons, axe. No motion is added, so reduced motion needs no check | local | Pass | 2026-11-04 |
| MUPP-035-R7 | Unit test `lib/onboarding.test.ts` (options, one year, no Domain); browser test reads `__Host-onboarding`, `HttpOnly`, `Secure`, path `/`, one year. No site session does nothing: code review, backed by `lib/route-checks.test.ts`, which requires `hasSiteSession()` and `guardWrite()` first in the action (no behavioural test) | local | Pass | 2026-11-04 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/onboarding.test.ts`; `npm run test:unit` 163 passed | local | Pass | 2026-11-04 |
| Browser tests | One new file with two tests, one test in `design.spec.ts`; `npm run test:local` 100 passed | local | Pass | 2026-11-04 |
| Smoke test | Unchanged: the dialog does not open without a session. R1 on the live site: not checked yet | live | Not checked | |
| Accessibility | axe on both tabs and at 320 px; the checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass | 2026-11-04 |
| Security | Review of the cookie and the action; `/security-review` run, no findings (review.md) | local | Pass | 2026-11-04 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-04 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 97 | about 166 s (TECH-015) | 4.6 s |
| After | 100 | 167.8 s | 4.6 s |

The dialog shares the sign-in of the other tests: `global-setup.ts` presses OK once, so no other test meets it. Two older tests were updated for the new menu item (MUPP-002) and for the word "exempel" in the text (MUPP-004).

## Definition of Done

- [x] Tests: every requirement is tested; `test:unit` and `test:local` pass
- [x] Test suite within the budgets (167.8 s of 170 s goal)
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility checklist on the live site: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers; `npm run lint`, `lint:docs` and `typecheck` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)

## Requirements as built

### MUPP-035-R1 Opens once, after sign-in

The site shall open the dialog on the start page when a visitor who has signed in with the site password has no onboarding cookie, and not open it by itself when the cookie is there.

Acceptance criteria:

- **Given** a signed-in visitor without the cookie, **when** the start page is shown, **then** the dialog "Så funkar sajten" is open, with focus inside it, and the deck behind it can not be used.
- **Given** the same visitor, **when** "OK" is pressed, **then** the dialog closes, the cookie is set, and the focus goes back to the page.
- **Given** a visitor with the cookie, **when** the start page is shown or reloaded, **then** the dialog is not open.
- **Given** the password page or an admin page, **when** it is shown, **then** the dialog does not open there.

### MUPP-035-R2 Closing

The site shall close the dialog with "OK", the close button, Esc and a press outside it, and every way of closing it shall set the cookie.

Acceptance criteria:

- **Given** the dialog opened by itself, **when** it is closed by any of the four ways, **then** it does not open by itself on the next visit.
- **Given** the dialog opened from the menu, **when** it is closed, **then** nothing changes about the cookie (it was already set, or it is set as in R1).

### MUPP-035-R3 Open it again from the menu

The site shall have an item "Så funkar sajten" in the hamburger menu that opens the same dialog at any time.

Acceptance criteria:

- **Given** the menu, **when** it is opened, **then** "Så funkar sajten" is there, between "Start" and "Admin" (which stays last and muted).
- **Given** the item is pressed, **when** the menu closes, **then** the dialog opens on the "Besökare" tab, whether or not the cookie is set.
- **Given** the dialog is closed again, **when** the focus is checked, **then** it is back on the menu button.

### MUPP-035-R4 The visitor tab

The site shall show, on the "Besökare" tab, a short description of what the site is for and three short parts: finding a kid, opening the wish list and finding the sizes; claiming a gift and what "Paxad" and "Kan köpas flera gånger" mean; and how to remove a claim.

Acceptance criteria:

- **Given** the dialog is open, **when** the "Besökare" tab is shown, **then** it explains in plain Swedish: the purpose (so the same gift is not bought twice); how to browse the cards and open a wish list with the "Önskelista" button and open a row for more; where the sizes are (on the card); that "Paxad" means someone has said they are buying it, and "Kan köpas flera gånger" means it can not be claimed because many can give it; why you claim (so nobody else buys it); how to remove a claim with the undo arrow and why (changed your mind or claimed wrong, so it is free again).
- **Given** the texts, **when** they are read, **then** they use the site's own words (`specs/terms.md`, the button and mark texts as they appear on the site).

### MUPP-035-R5 The parent tab

The site shall show, on the "Förälder" tab, how a parent reaches their kids, what can be administered, and where the archive is.

Acceptance criteria:

- **Given** the dialog is open, **when** the "Förälder" tab is shown, **then** it explains: how to get to your kids (Admin in the menu, the admin password, choose who you are); what can be administered (the kid's sizes and wish lists, per occasion, and "Obegränsad" for gifts many can give); and that old wishes are in the archive and can be added again.
- **Given** the "Förälder" tab, **when** its texts are checked against the manual (`wiki/manual/admin.md`), **then** they agree with it.

### MUPP-035-R6 The tabs work with every input

The site shall let the tabs be used with finger, mouse and keyboard and read correctly by a screen reader.

Acceptance criteria:

- **Given** the dialog, **when** it is read by a screen reader, **then** it is a dialog named "Så funkar sajten" with a tab list "Besökare" and "Förälder", and the shown panel belongs to the selected tab.
- **Given** the keyboard, **when** the left and right arrow keys are pressed on a tab, **then** the other tab is selected and its panel is shown; Tab moves on into the panel.
- **Given** a 320 × 568 phone, **when** the dialog is open, **then** it fits the screen, the text is short and the panel scrolls inside the dialog when it does not fit (the page behind does not), and the buttons are at least 44 px.
- **Given** reduced motion, **when** the dialog opens and the tabs change, **then** nothing moves.

### MUPP-035-R7 The cookie

The site shall remember with a cookie, and only with it, that the visitor has seen the dialog.

Acceptance criteria:

- **Given** the cookie is set, **when** it is read, **then** it is named with the `__Host-` prefix, `HttpOnly`, `Secure`, path `/`, no `Domain`, holds no personal data, and lasts one year.
- **Given** the action that sets it, **when** it is called without the site session, **then** it does nothing (sign-in first, `guardWrite()`).

## Notes

- The card's R4 and R5 were adjusted when the user approved the texts: three parts each, R5 ends with the archive instead of "how to fill in a wish list".
- `wiki/manual/startsidan.md` said "Admin gör ingenting än"; that was out of date (it links to /admin) and is corrected.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
