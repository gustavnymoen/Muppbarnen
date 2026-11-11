---
type: Verification
title: "MUPP-060 Change participants in a started group: verification"
description: How each requirement of changing participants in a started group was checked, the test suite before and after, and the requirements as built.
feature: MUPP-060
---

# Verification of MUPP-060

Everything ran locally (a production build, the local test database), 2026-11-10. Deployed the same day (PR #197); the live checks are at the end of this file.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-060-R1 | Unit tests `MUPP-060-R1 …` in `lib/santa.test.ts` (changes in a started group, unique phone and e-mail, not owner and no actor refused); browser test `MUPP-060-R1 R2 R3 R4 a started group …` (pencil, three fields, no partner, saved values) and `MUPP-060-R1 R2 a group that is not started …` (partner field and remove button as before) in `tests/MUPP-060-santa-change-participants.spec.ts`; the duplicate phone message in `MUPP-060-R4 a mail that cannot be sent …` | local | Pass | 2026-11-10 |
| MUPP-060-R2 | Unit tests `MUPP-060-R2 …` and `MUPP-051-R3 MUPP-060-R2 …` (add, remove and any partner value refused in a started group, nothing changed, everything allowed again after the stop); the browser test checks that there is no remove button and no add form | local | Pass | 2026-11-10 |
| MUPP-060-R3 | Unit tests `MUPP-060-R3 …` (draw rows and wishes unchanged) in `lib/santa.test.ts` and `lib/santa-auth.test.ts` (the old phone no longer signs in, the new one does, the member is still found by id); the browser test: Anna signed in before the change is still signed in after it, and signs in with the new phone only | local | Pass | 2026-11-10 |
| MUPP-060-R4 | Unit tests `MUPP-060-R4 …` (`memberToMail` reads the saved address and status, refuses others; `mailNewMember` sends only the started mail in a started group); browser tests: the question names the new address and nothing is sent before the answer, Skicka sends one started mail to the new address and none to the old, "Inte nu" and a name-only change send nothing, a mail that cannot be sent is named and the change stays saved | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa.test.ts`, `lib/santa-auth.test.ts`, `lib/santa-notify.test.ts` (names above) | local | Pass (354) | 2026-11-10 |
| Browser tests | `tests/MUPP-060-santa-change-participants.spec.ts` (3 tests, one journey of a started group); two existing tests changed (`MUPP-051`, `MUPP-041`) | local | Pass (154) | 2026-11-10 |
| Smoke test | Not applicable: it changes data; the Live tests run on `main` after the merge passed (`b08ea39`) | live | Pass | 2026-11-10 |
| Accessibility | axe on the form and on the question in the browser test and in `design.spec.ts` (375 x 667); live checklist: see "Live checks" below | local and live | Pass; items 3, 9 (errors) and the question not checked live | 2026-11-11 |
| Design | The pencil on a started card (32 px or more) and the question inside a 375 x 667 screen, in the matching test of `tests/design.spec.ts`; `/impeccable critique` not run as a separate pass | local | Pass | 2026-11-10 |
| Security | `/security-review` and the reviewer's security points: see [review.md](review.md) | local | See review | 2026-11-10 |
| Code review | [review.md](review.md) | local | See review | 2026-11-10 |

## Live checks

On https://muppbarnen.vercel.app after the merge, in the built-in browser pane at 320 px, signed in as the master admin, group Bollnäs (started, 4 participants), 2026-11-11. Nothing was saved and no data changed: the form was opened and closed with Esc. Checklist numbers from [accessibility.md](../../wiki/system/accessibility.md).

| Item | Result |
|---|---|
| 1 Keyboard | Pass: Tab moves through the form fields in order to Spara, Esc closes the form and focus returns to the pencil of the participant. The rest of the tab was not tabbed through |
| 2 Focus visible | Pass: the focused button has a 3 px ring (rgb(154, 169, 224)); not hidden by the dialog |
| 3 Screen reader | Not checked (VoiceOver) |
| 4 Reflow at 320 px | Pass: the page and the form (282 px wide) fit, no sideways scroll. 200 % zoom not checked |
| 6 Contrast | Pass: field labels 11.36:1, the hint "Skriv numret som 07XXXXXXXX" 5.53:1 (dark theme); the light theme not checked |
| 7 Target size | Pass: the pencils are 32 x 32 px, the fields and the Spara and Stäng buttons 44 px high |
| 9 Errors and labels | Labels: pass, Namn, Telefon and E-post stay visible above their fields, and the form has no partner field in a started group. Error texts not checked live (that would mean saving) |
| The question "Skicka mejlet till den nya adressen?" | Not checked live: it appears only after saving a changed e-mail address, which would change production data. Covered by the browser tests and axe locally |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 333 unit + 149 browser, 301.5 s (MUPP-059; other cards merged since) | – | 7.2 s |
| After | 354 unit (0.5 s) + 154 browser | 314.7 s (budget 180 s) | 6.9 s (`design.spec.ts`, got a few assertions, no new page load) |

Over budget with and without this change (TECH-019). This change added 3 browser tests and some assertions to an existing design test.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019)
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on `main` after the merge passed (2026-11-10)
- [x] Accessibility: axe passes locally and live items 1, 2, 4, 6, 7 and the labels of 9 are done; VoiceOver (3), error texts, the question after saving, 200 % zoom and the light theme are not checked (accepted by the user, 2026-11-11)
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [ ] Code review: see [review.md](review.md)

## Requirements as built

- **MUPP-060-R1:** name, phone and e-mail of a participant can be changed in every status; a started group's form has no partner field; phone and e-mail stay unique; only the owner or the master admin may.
- **MUPP-060-R2:** a started group refuses adding, removing and any partner value on the server; no remove button and no add form; all allowed again after the stop.
- **MUPP-060-R3:** a change leaves the draw and the wishes as they are and does not sign the participant out; next sign-in uses the new phone or e-mail.
- **MUPP-060-R4:** after a changed e-mail "Skicka mejlet till den nya adressen?" with "Skicka" and "Inte nu"; Skicka sends the mail of the group's status to the saved new address only; a failed mail is named and the change stays saved; no question for name or phone only.

## Notes

The text of the question when starting the draw ("Efter det går det inte att lägga till, ändra eller ta bort någon") and the error "Deltagarna kan inte ändras nu." were changed since they no longer were true.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
