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
| MUPP-051-R2 | Unit tests `MUPP-051-R2` (the two changes and the recipients they return; each change from one status only; started refused; owner, master admin and a forged id); browser tests `MUPP-051-R1 R2 …` (the toggle Aktiv is a switch, 44 px, the question, cancel, confirm both ways, axe on the dialog), `MUPP-051-R2 R3 a started group…` (the toggle is on, disabled and says "Stoppa gruppen först"; no toggle for another parent; a stale page is refused by the server) and `MUPP-051-R2 the i icon…` (44 px, the three texts, closes with Esc, the cross and a press outside, axe); the toggle under the plus button, centred, and its question on a phone in `tests/design.spec.ts`. **The mails (every member gets mail 1 or 2, and the administrator is told who got none) are not built yet and not checked:** `lib/santa-mail.ts` (MUPP-052) is not on `main` | local | Partly: the status change passes; the mails are not done | 2026-11-09 |
| MUPP-051-R3 | Unit tests `MUPP-051-R3` (add, change, remove while inactive and preparing; refused when started also for the master admin, members unchanged; the rights before the status; what an added member returns for the mail); browser test `MUPP-051-R2 R3 a started group…` (no plus, pencil or trash). **The welcome mail (mail 8) and the activation mail (mail 1) to a new member are not built yet and not checked** (same reason as R2) | local | Partly: the lock passes; the mails are not done | 2026-11-09 |
| MUPP-051-R4 | Unit tests `MUPP-051-R4` (`lib/santa-wishes.test.ts`: allowed while preparing and started; refused when inactive with the list unchanged; deactivating keeps the wishes and activating brings them back); browser tests `MUPP-051-R4 R5 …` (the list page is not reachable while inactive) and `MUPP-051-R6 MUPP-051-R4 …` (kept wishes are back; a change after deactivation is refused with the message) | local | Pass | 2026-11-09 |
| MUPP-051-R5 | Browser test `MUPP-051-R4 R5 an inactive group gives only…` (the text, no card, no link, no list, axe) | local | Pass | 2026-11-09 |
| MUPP-051-R6 | Browser test `MUPP-051-R6 MUPP-051-R4 a preparing group…` (the list card is a link and opens the list, the grey card is a heading without a link with "Inte tilldelad än", axe); the phone check in `tests/design.spec.ts` (44 px card, the orange line's contrast at least 4.5, no sideways scroll). The look of the Santa-hat icon: checked by eye in a screenshot, not tested | local | Pass | 2026-11-09 |
| MUPP-051-R7 | Browser test `MUPP-051-R7 the count and the delete question say deltagare…` ("1 deltagare", "2 deltagare", the delete question, no "medlem" in the tab); the older tests of `MUPP-038` and `MUPP-048` expect the new count; unit test of the started message; `grep` of `app`, `lib` and `wiki/manual` for "medlem" (only code comments and names remain) | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Transitions, who may change the status, members and wishes locked by status, the recipient data (`lib/santa.test.ts`, `lib/santa-wishes.test.ts`, `db/db-setup.test.ts`). The list of mails with a failing recipient is not done (it needs the mail texts) | local | Partly | 2026-11-09 |
| Browser tests | New `tests/MUPP-051-santa-status.spec.ts` (6 tests) with axe, and one phone test in `tests/design.spec.ts`; `MUPP-040`, `MUPP-045`, `MUPP-048`, `MUPP-053` and `design.spec.ts` follow the list's new page. Mails from the test sink: not done (see R2) | local | Partly | 2026-11-09 |
| Smoke test | None, as planned | not applicable | Not applicable | 2026-11-09 |
| Accessibility | axe on the status row, the question, the inactive page, the two cards and the list page. The checklist items of `wiki/system/accessibility.md` on the live site: not checked yet | local | Pass locally; live not checked | 2026-11-09 |
| Security | `/security-review` and the review's security points: [review.md](review.md) | local | `/security-review`: see review.md | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed (run 1, no must-fix) | 2026-11-09 |

## Test suite

`npm run test:time` on `main` (ad32262) before and on this branch after. The suite was over its budget before (TECH-019, not this card).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 241 unit, 130 browser | 263.3 s (unit 0.4 s) | 7.0 s |
| After | 257 unit, 137 browser | 271.7 s (unit 0.4 s) | 6.8 s |

The browser suite grew by 8.4 s (3 %) for 7 more tests (6 new tests plus the phone test), and the tests over the 5 s budget are the same ones as before; the new ones are under it.

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

Copied from the card after its change of 2026-11-09 (the toggle Aktiv, the "i" explanation and "deltagare"). R2 and R3 are built except for the mails (see Notes).

### MUPP-051-R1 Three statuses, inactive first

An event shall have exactly one of the statuses inactive, preparing and started, and a new event shall be inactive.

Acceptance criteria:

- **Given** a new event, **then** it is inactive and its status is shown to its administrator as "Inaktiv".
- **Given** the migration, **then** the existing events are inactive.

### MUPP-051-R2 The Aktiv toggle and the status explanation

The administrator of the event shall activate an inactive event and deactivate a preparing one with the toggle Aktiv, each after "Är du säker?", and shall see what the statuses mean.

Acceptance criteria:

- **Given** an inactive event, **when** the toggle Aktiv is switched on and confirmed, **then** it is preparing and every member gets the activation mail; cancelling changes nothing.
- **Given** a preparing event, **when** the toggle Aktiv is switched off and confirmed, **then** it is inactive and every member gets the deactivation mail.
- **Given** a started event, **then** the toggle Aktiv is on and locked, with the short note "Stoppa gruppen först"; the server refuses a deactivation (it must be stopped first, MUPP-041).
- **Given** an event that belongs to another administrator, **then** the toggle is not shown and the server refuses (MUPP-048-R3).
- **Given** the status text, **then** an "i" icon button (accessible name "Vad betyder statusen?", at least 44 px) next to it opens a short explanation that closes with Esc, the cross and a press outside, with these texts: **Inaktiv:** Gruppen har ej startat. **Förbereder:** Deltagarna kan nu skapa önskelistor men har ej tilldelats en matchning. **Startad:** Deltagarna är matchade och kan se den andres lista, samt skicka meddelanden.
- **Given** a mail cannot be sent to someone, **then** the status still changes and the administrator sees who did not get one.

### MUPP-051-R3 Members: inactive and preparing only

Members shall be added, changed and removed only while the event is inactive or preparing.

Acceptance criteria:

- **Given** a started event, **then** no member can be added, changed (name, phone, email, partner) or removed, the buttons are gone and the server refuses.
- **Given** a member added to an event (inactive or preparing), **then** that member gets the welcome mail (mail 8 of MUPP-052): who added them and whom to contact if it is not them; how it works is in the activation mail.
- **Given** a member added to a preparing event, **then** that member gets the activation mail (mail 1) right after the welcome mail.

### MUPP-051-R4 Wish lists: preparing and started only

Wishes shall be added, changed and removed only while the event is preparing or started.

Acceptance criteria:

- **Given** an inactive event, **then** a member's wish changes are refused on the server and the page has no list.
- **Given** an event deactivated while it holds wishes, **then** the wishes are kept and come back when it is activated again.

### MUPP-051-R5 Inactive page

A member who signs in to an inactive event shall see only the text "Vi har inte kört igång än" under the greeting.

Acceptance criteria:

- **Given** an inactive event, **when** a member has signed in, **then** that text is shown and no wish list, match or chat.

### MUPP-051-R6 Preparing page

In a preparing event the member shall see two cards: "Min önskelista" and a greyed one, "Min matchnings önskelista", with a Santa-hat icon.

Acceptance criteria:

- **Given** a preparing event, **then** "Min önskelista" is an active card (with the wish-list icon of the kid card and admin) that opens the member's own list for adding, editing and deleting wishes.
- **Given** the same page, **then** the second card is greyed out, is not a link and has an orange line "Inte tilldelad än" under its title when it fits.

### MUPP-051-R7 "Deltagare", not "medlem"

Everything a visitor or an administrator reads on the site shall say "deltagare" where it says "medlem" or "medlemmar" today. Decided with the user 2026-11-09.

Acceptance criteria:

- **Given** a group in the admin, **then** the count reads "1 deltagare" and "2 deltagare" (the word is the same in singular and plural), not "medlem" or "medlemmar".
- **Given** the delete confirmation of a group, **then** it says "deltagare" ("<grupp>, dess deltagare och deras önskelistor tas bort. Det går inte att ångra.").
- **Given** the site, mails and `wiki/manual/`, **then** no visible text says "medlem". Names in code and the database (`ss_member` and so on) are not changed.

## Notes

- The mail calls (mails 1, 2 and 8 of MUPP-052) are missing because `lib/santa-mail.ts` was not on `main` when the rest was done. The data they need is returned by `activateEvent`, `deactivateEvent` and `addMember` in `lib/santa.ts`.
- Started shows only the list card on the member's page until MUPP-041 builds its own page.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
