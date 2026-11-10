---
type: Verification
title: "MUPP-060 Change participants in a started group: verification"
description: How each requirement of changing participants in a started group was checked, the test suite before and after, and the requirements as built.
feature: MUPP-060
---

# Verification of MUPP-060

Everything ran locally (a production build, the local test database), 2026-11-10. Not yet deployed: the live checks are not done.

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
| Smoke test | Not applicable: it changes data | – | – | – |
| Accessibility | axe on the form and on the question in the browser test and in `design.spec.ts` (375 x 667); the live checklist not done yet | local | Pass locally; live not checked | 2026-11-10 |
| Design | The pencil on a started card (32 px or more) and the question inside a 375 x 667 screen, in the matching test of `tests/design.spec.ts`; `/impeccable critique` not run as a separate pass | local | Pass | 2026-11-10 |
| Security | `/security-review` and the reviewer's security points: see [review.md](review.md) | local | See review | 2026-11-10 |
| Code review | [review.md](review.md) | local | See review | 2026-11-10 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 333 unit + 149 browser, 301.5 s (MUPP-059; other cards merged since) | – | 7.2 s |
| After | 354 unit (0.5 s) + 154 browser | 314.7 s (budget 180 s) | 6.9 s (`design.spec.ts`, got a few assertions, no new page load) |

Over budget with and without this change (TECH-019). This change added 3 browser tests and some assertions to an existing design test.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes locally; the live checklist after the deploy
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
