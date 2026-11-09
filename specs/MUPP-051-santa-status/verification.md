---
type: Verification
title: "MUPP-051 Secret Santa: event status: verification"
description: How each requirement of the Secret Santa event status was checked, the test suite before and after, and the requirements as built.
feature: MUPP-051
---

# Verification of MUPP-051

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-051-R1 | Unit tests `MUPP-051-R1` (`lib/santa.test.ts`: a new event is inactive and listed with its status; the database refuses another status) and `db/db-setup.test.ts` (existing events become inactive); browser test `MUPP-051-R1 R2 a new group is inactive…` ("Status: Inaktiv", axe) | local | Pass | 2026-11-09 |
| MUPP-051-R2 | Unit tests `MUPP-051-R2` (the two changes and the recipients they return; each change from one status only; started refused; owner, master admin and a forged id); browser tests `MUPP-051-R1 R2 …` (the question, cancel, confirm, deactivate, axe on the dialog) and `MUPP-051-R2 R3 a started group…` (no buttons when started or for another parent, a stale page is refused by the server); the question on a phone in `tests/design.spec.ts`. **The mails (every member gets mail 1 or 2, and the administrator is told who got none) are not built yet and not checked:** `lib/santa-mail.ts` (MUPP-052) is not on `main` | local | Partly: the status change passes; the mails are not done | 2026-11-09 |
| MUPP-051-R3 | Unit tests `MUPP-051-R3` (add, change, remove while inactive and preparing; refused when started also for the master admin, members unchanged; the rights before the status; what an added member returns for the mail); browser test `MUPP-051-R2 R3 a started group…` (no plus, pencil or trash). **The welcome mail (mail 8) and the activation mail (mail 1) to a new member are not built yet and not checked** (same reason as R2) | local | Partly: the lock passes; the mails are not done | 2026-11-09 |
| MUPP-051-R4 | Unit tests `MUPP-051-R4` (`lib/santa-wishes.test.ts`: allowed while preparing and started; refused when inactive with the list unchanged; deactivating keeps the wishes and activating brings them back); browser tests `MUPP-051-R4 R5 …` (the list page is not reachable while inactive) and `MUPP-051-R6 MUPP-051-R4 …` (kept wishes are back; a change after deactivation is refused with the message) | local | Pass | 2026-11-09 |
| MUPP-051-R5 | Browser test `MUPP-051-R4 R5 an inactive group gives only…` (the text, no card, no link, no list, axe) | local | Pass | 2026-11-09 |
| MUPP-051-R6 | Browser test `MUPP-051-R6 MUPP-051-R4 a preparing group…` (the list card is a link and opens the list, the grey card is a heading without a link with "Inte tilldelad än", axe); the phone check in `tests/design.spec.ts` (44 px card, the orange line's contrast at least 4.5, no sideways scroll). The look of the Santa-hat icon: checked by eye in a screenshot, not tested | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Transitions, who may change the status, members and wishes locked by status, the recipient data (`lib/santa.test.ts`, `lib/santa-wishes.test.ts`, `db/db-setup.test.ts`). The list of mails with a failing recipient is not done (it needs the mail texts) | local | Partly | 2026-11-09 |
| Browser tests | New `tests/MUPP-051-santa-status.spec.ts` (4 tests) with axe, and one phone test in `tests/design.spec.ts`; `MUPP-040`, `MUPP-045`, `MUPP-048`, `MUPP-053` and `design.spec.ts` follow the list's new page. Mails from the test sink: not done (see R2) | local | Partly | 2026-11-09 |
| Smoke test | None, as planned | not applicable | Not applicable | 2026-11-09 |
| Accessibility | axe on the status row, the question, the inactive page, the two cards and the list page. The checklist items of `wiki/system/accessibility.md` on the live site: not checked yet | local | Pass locally; live not checked | 2026-11-09 |
| Security | `/security-review` and the review's security points: [review.md](review.md) | local | `/security-review`: see review.md | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed (run 1, no must-fix) | 2026-11-09 |

## Test suite

`npm run test:time` on `main` (ad32262) before and on this branch after. The suite was over its budget before (TECH-019, not this card).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 241 unit, 130 browser | 263.3 s (unit 0.4 s) | 7.0 s |
| After | 257 unit, 135 browser | 271.7 s (unit 0.4 s) | 6.8 s |

The browser suite grew by 8.4 s (3 %) for 5 more tests (4 new files tests plus the phone test), and the tests over the 5 s budget are the same ones as before; the new ones are under it.

## Definition of Done

- [ ] Tests: every check in the plan is done; the mail checks of R2 and R3 are not (the mails wait for MUPP-052)
- [ ] Test suite: within the time budgets, total time grown by at most 25 % (see above; the budget was already exceeded before, TECH-019)
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet
- [ ] Accessibility: axe passes locally; the checklist items on the live site are not checked yet
- [ ] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated (the mail parts to be added with the mails)
- [x] No leftovers
- [ ] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass (re-run after the mails)
- [ ] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none found

## Requirements as built

Not yet copied: the card's requirements apply as written, and R2 and R3 are only partly built (the mails). They are copied here when the mails are built.

## Notes

- The mail calls (mails 1, 2 and 8 of MUPP-052) are missing because `lib/santa-mail.ts` was not on `main` when the rest was done. The data they need is returned by `activateEvent`, `deactivateEvent` and `addMember` in `lib/santa.ts`.
- Started shows only the list card on the member's page until MUPP-041 builds its own page.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
