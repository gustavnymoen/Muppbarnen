---
type: Verification
title: "MUPP-045 Form cards with focus and Enter: verification"
description: How each requirement of the form cards was checked, the test suite before and after, and the requirements as built.
feature: MUPP-045
---

# Verification of MUPP-045

How each requirement was checked. Everything ran locally (a production build with its own test database, started on port 3101 with its own home folder so it did not share the database of other runs); nothing is pushed or deployed, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-045-R1 | Browser test `MUPP-045-R1 …` (the open animation's transform is the card onto the button's box, the copy's transform onto the button, a quick close and reopen leaves no copy, reduced motion has no animation and no copy, a card with no button fades only); `tests/design.spec.ts` (backdrop and colours of the card); code review: `Dialog.tsx` is the only `showModal()` | local | Pass | 2026-11-09 |
| MUPP-045-R2 | Browser tests `MUPP-045-R2 …` (Hantera: edit, new parent, new kid, picture; a kid's wish lists; the Secret Santa tab; the own page; the sizes card on `/admin` and `/admin/barn/<id>/storlekar` is "Sidan finns inte"; the claim window and a question card), the MUPP-003, 005, 006, 010, 011, 012, 038 and 040 tests changed to open the card; `grep` for `Fold` in `app/` and `lib/`: nothing | local | Pass | 2026-11-09 |
| MUPP-045-R3 | Browser tests `MUPP-045-R2 R3 R4 R5 R7 Hantera …` (the cross is named and 44 px, Esc and the cross close with focus on the button, a tap outside does nothing, a gone button gives the section heading focus) and `… the claim window …`; `tests/design.spec.ts` (the cross is 44 px with a ring of at least 3:1 and does not cover the title at 320 px) | local | Pass | 2026-11-09 |
| MUPP-045-R4 | Browser tests (the first field is focused at once, its text selected when editing, a list's button when the first field is a list; the question card starts on "Avbryt"); `tests/design.spec.ts` (at 375 × 667 and 320 × 568 the card is at the top with a margin, inside the screen, and scrolls inside itself at 200 % zoom); WebKit test `MUPP-045-R4 …` (the active element right after the press); manual: see below | local | Pass in the browser and WebKit; the keyboard on a phone not checked | 2026-11-09 |
| MUPP-045-R5 | Unit tests `MUPP-045-R5 enterAction …` (`lib/form-card.test.ts`); browser tests (Enter across the wish form with a new line in Beskrivning and sending from Länk, from the one field of a family, from the e-mail field of a person, the four sizes, the kid's date field before the list, `enterkeyhint`) | local | Pass | 2026-11-09 |
| MUPP-045-R6 | Unit tests `MUPP-045-R6 shortTitle …`, `savedMessage …`; browser tests (a new wish keeps the card with empty fields, focus in Namn, "fotboll lades till", a 38-character title cut to 24 and "…", a second save starts the 3 seconds again, text not HTML, gone after 3 s with the page's clock moved, the same on the own page); `tests/design.spec.ts` (the confirmation is smaller than the body text and at least 4.5:1) | local | Pass | 2026-11-09 |
| MUPP-045-R7 | Browser tests (every other save closes the card, focus on the button, the text a screen reader hears: "Nils sparades", "Ola lades till", "Storlekarna för Otis sparades", "Bilden för Otis sparades"; a failed save keeps the card and the typed values and puts focus on the first error); MUPP-003 and MUPP-005 (the claim window as before) | local | Pass | 2026-11-09 |
| MUPP-045-R8 | Browser tests (the parent list and "Välj person" open in front of the card, are used with a tap and the keyboard, Esc closes the list and not the card, focus returns to the list's button); MUPP-012 changed to the list inside the card | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/form-card.test.ts` (16 tests) | local | Pass | 2026-11-09 |
| Browser tests | `tests/MUPP-045-form-cards.spec.ts` (8, one journey per surface, axe in each state of an open card) and the older tests changed to the cards (MUPP-003, 005, 010, 011, 012, 035, 038, 040, design) | local | Pass | 2026-11-09 |
| WebKit | `tests/MUPP-045-form-cards.webkit.spec.ts` (1, the claim window; admin does not sign in under WebKit here) and `tests/MUPP-032-quiet-focus-after-tap.webkit.spec.ts` (changed: the claim window closes with the cross), `npm run test:webkit` (11 pass) | local | Pass | 2026-11-09 |
| Smoke test | Not applicable: the card says none (the changed pages are behind the admin password) | n/a | n/a | 2026-11-09 |
| Accessibility | axe in every browser test above; the manual checklist on the live site (items 1–4, 6, 7, 9, 11): not checked, nothing is deployed | local | Pass (axe); live not checked | 2026-11-09 |
| Security | Security points in the review; `/security-review` not needed: no server action, route, query, cookie or data was added or changed. `saveSizes` still goes through `manageableChild` on the server (the test changes the child id in the sizes card to another parent's kid and is refused); the sizes sent to the card are the signed-in parent's own kids'; the confirmation and the announcement are rendered as text (the test types `<b>x</b>`); nothing the card held is kept after it has closed (the content is unmounted) | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |
| Look | Screenshots of the cards at 375 and 320 px looked at (the card at the top, the cross in the corner, the list in front of the card); Impeccable's critique was not run | local | Looked at, no critique | 2026-11-09 |

## Manual checks

- **The keyboard on a real iPhone** (R4): not checked. The iOS simulator was not started and the WebKit tests cannot show the keyboard; they show that the first field is the active element right after the press (`flushSync`). **Do this on a phone before merging:** open a form card in Safari and see that the keyboard is up without a second tap and that the card and the confirmation are not hidden behind it. If Safari does not show the keyboard, R4 is changed first, as the card says.
- **VoiceOver:** not checked (title when the card opens, the confirmation, the hidden "sparades" text, focus back on the button).
- **The look of the grow and fold on a phone, with `emil-design-eng`:** not checked on a phone; the motion is the wish list's own helpers, 300 ms.
- Admin does not sign in under WebKit on http (the cookie is `Secure`), so the admin's form cards are tested in Chromium only; the claim window is the same card.

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`). The numbers come from the same run of the whole suite against a test server on port 3101 (port 3100 was taken by another session), with the JSON report.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-040) | 193 unit + 120 browser | 211.3 s (browser), unit 0.4 s | 4.9 s |
| After | 209 unit + 127 browser | about 236 s (browser; 296 s in the run, of which 60 s are two picture tests that failed once on a file left by a new test, fixed and passed on rerun), unit 0.4 s | 8.3 s (MUPP-038-R2) |

Sixteen unit tests and eight browser tests were added and one MUPP-010 test was removed (its checks moved into MUPP-045); growth of the browser time about 12 % (under 25 %). The total was over the 3 minute budget before (it was measured on a busy computer); the new tests take 2.5–5.7 s each. **Over the 5 s budget for one test:** MUPP-038-R2 (8.3 s), MUPP-003-R4 and R5 (5.7 s) and two new tests (5.6 s): every click inside a card waits for the 300 ms grow, and these tests open many cards. Splitting them is a follow-up (a technical task on the board), not done here.

## Requirements as built

As on the card (`gh issue view 143`), with these points as built:

- **R1** The shared component is `Dialog` (`Dialog.tsx`), opened with `ref.open(button)`; a card with no button, or one that is gone, fades only.
- **R2** `FormCard` is the button and the card for every form of the table; `Fold.tsx`, the sizes page and the `hidden` panels are gone; the archive expander is `ArchiveGroupCard`.
- **R3** Cross "Stäng" (44 px), Esc, no close on a tap outside a form card; focus on the button or the section heading.
- **R4** Focus in the first field inside `open()` (`flushSync`), text selected when editing, the card at the top; a focused field is scrolled into view.
- **R5** `enterAction` and `enterkeyhint` as on the card.
- **R6** The confirmation is in the card's `role="status"` line, 3 s, fades the last 300 ms except with reduced motion; the card is scrolled to the top after the save so that the line and the first field are in view together.
- **R7** The hidden announcement is a `<p aria-live="polite">` next to the card (not `role="status"`: an empty status role on every card collided with the existing tests' locators). It keeps its text until the card is opened again.
- **R8** `ListPicker` draws its list in the card's `<dialog>`; the card ignores Esc while a list is open.

[Specifications](../index.md)
