---
type: Verification
title: "MUPP-041 Secret Santa: the draw: verification"
description: How each requirement of the Secret Santa draw was checked, the test suite before and after, and the requirements as built.
feature: MUPP-041
---

# Verification of MUPP-041

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-041-R1 | Unit test `MUPP-041-R1` (`lib/santa.test.ts`: no wish, no mark; one wish, mark); browser test `MUPP-041-R1 R2 …` (one check mark, by the right participant); the mark on a phone in `tests/design.spec.ts` | local | Pass | 2026-11-10 |
| MUPP-041-R2 | Unit tests `MUPP-041-R2` (`lib/santa.test.ts`: only a preparing event, owner or master admin, forged id); browser tests `MUPP-041-R1 R2 …` (the question lists who has no wish, cancel changes nothing, confirm draws, Aktiv locked, axe, 44 px) and `MUPP-041-R2 the toggle Startad is off and locked in an inactive group…`; the toggles and the question on a phone in `tests/design.spec.ts` | local | Pass | 2026-11-10 |
| MUPP-041-R3 | Unit tests `MUPP-041-R3` (`lib/santa-draw.test.ts`: 500 random draws against every rule, fallback order, two partners, one member, a tight group of 30; `lib/santa.test.ts`: partners, the set-aside rules in the answer, one participant saves nothing); browser test `MUPP-041-R2 … lone participant` (the message, nothing changed); `lib/santa-notify.test.ts` (the notice text) | local | Pass | 2026-11-10 |
| MUPP-041-R4 | Unit tests `MUPP-041-R4` (`lib/santa.test.ts`: one row per giver for this year, last year's rows feed the next draw and stay as history, removing a participant or event removes their rows) and `db/db-setup.test.ts` (one row per giver and year, a receiver once a year, never yourself) | local | Pass | 2026-11-10 |
| MUPP-041-R5 | Unit test `MUPP-041-R5` (`lib/santa.test.ts`: the event list holds no draw data, for owner and master admin); browser test `MUPP-041-R1 R2 …` (the admin page says nothing about who drew whom). No other page reads `ss_draw`: checked in the code review | local | Pass | 2026-11-10 |
| MUPP-041-R6 | Browser tests `MUPP-041-R1 …` (outbox: one mail 3 per participant, naming the event and nobody else) and `MUPP-041-R2 … a failing mail is named while the draw stands` | local | Pass | 2026-11-10 |
| MUPP-041-R7 | Unit tests `MUPP-041-R7` (`lib/santa.test.ts`: rows of this year deleted, last year's and the wishes kept, preparing again, a new draw possible; only a started event, only owner or master admin); browser test `MUPP-041-R1 …` (the question, mail 4 to everyone, the draw gone, the check marks stay). Deleting conversations: not applicable until MUPP-043 | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | The draw (500 random runs, impossible cases, last year's exclusion), the log, start and stop, secrecy: `lib/santa-draw.test.ts`, `lib/santa.test.ts`, `lib/santa-notify.test.ts`, `db/db-setup.test.ts` | local | Pass | 2026-11-10 |
| Browser tests | New `tests/MUPP-041-santa-draw.spec.ts` (2 tests) with axe, and the check mark and toggles in the existing phone test of `tests/design.spec.ts`; mails from the test sink | local | Pass | 2026-11-10 |
| Smoke test | None, as planned (it changes data) | not applicable | Not applicable | 2026-11-10 |
| Accessibility | axe on the preparing and started group, the question; the mark is an image with a name, not colour only. The live checklist: not checked yet | local | Pass locally; live not checked | 2026-11-10 |
| Security | `/security-review` and the review's security points: [review.md](review.md) | local | Pass (no finding) | 2026-11-10 |
| Code review | [review.md](review.md) | local | Passed (run 1, no must-fix) | 2026-11-10 |

## Test suite

`npm run test:time` (budgets in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 293 unit + 139 browser (`main`, MUPP-058) | over budget already (TECH-019) | over 5 s (TECH-019) |
| After | 311 unit (0.5 s) + 141 browser | 287.3 s (budget 180 s), the machine shared with other sessions | 6.8 s (MUPP-038, not touched) |

The suite is over its budget with and without this change (TECH-019). One design test of the wish list (MUPP-040, not touched) failed once in the full run on a field measured mid-animation (3 px high) and passed when run alone; the design test of this change grew by about 0.5 s (4.9 s, under the 5 s budget).

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` passes and `npm run test:local` passes (one flaky unrelated test, see above)
- [ ] Test suite: over budget as before (TECH-019); the new tests follow the quality rules (combined by journey, no per-value tests)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes; the live checklist is not checked yet
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

Copied from the card (`gh issue view 139`). Built as written, with one reading: "administrator" is the owner of the event or the master admin (MUPP-048), and the log and the draw are one table, `ss_draw`.

### MUPP-041-R1 Ready check

The family view shall mark each member who has written at least one wish.

Acceptance criteria:

- **Given** a member with no wish, **then** no check; after adding one, **then** a check.

### MUPP-041-R2 Start the draw

The administrator of the event shall start the draw for an event that is preparing, with the toggle Startad, after "Är du säker?".

Acceptance criteria:

- **Given** a preparing event, **when** the toggle Startad is switched on and confirmed, **then** every member is drawn once and the event is started; the toggle Aktiv is now locked on.
- **Given** an inactive or started event, **then** the toggle Startad is off and locked (inactive) or cannot be switched on again (started), and the server refuses a start.
- **Given** some members have no wish yet, **then** the confirmation says who, and the admin may still start.

### MUPP-041-R3 Draw rules

Each member shall give to exactly one member and receive from exactly one, never themself, never their partner in that family, and never the person they had last year. If that cannot be done, the last-year rule is dropped first, then the partner rule; the rule against drawing yourself is never dropped.

Acceptance criteria:

- **Given** a family and a history, **when** the draw runs many times, **then** no result breaks a rule.
- **Given** the rules cannot all be met, **then** the draw is made without last year's rule, and if that is still not enough also without the partner rule; the admin is told which rule was set aside, never who drew whom.
- **Given** it cannot be done even then (a single member), **then** nothing is saved or mailed and the admin is told why in plain words.

### MUPP-041-R4 History log

Who drew whom shall be saved in a log by family and year, kept after the yearly cleanup.

Acceptance criteria:

- **Given** a draw, **then** one row per giver exists with family, year, giver and receiver.
- **Given** next year's draw, **then** it reads last year's rows for the "not last year" rule.

### MUPP-041-R5 Secret from everyone but the giver

The result shall not be shown to anyone but the giver.

Acceptance criteria:

- **Given** the admin pages and the family view, **then** no page or response shows who drew whom.

### MUPP-041-R7 Stop

The administrator shall stop a started event, after "Är du säker?", for example when someone was forgotten.

Acceptance criteria:

- **Given** a started event, **when** stop is confirmed, **then** the draw, this year's log rows and all conversations are deleted, the wish lists are kept, the event is preparing and everyone gets mail 4 of MUPP-052.
- **Given** a stopped event, **then** members can be added, changed and removed again, and a new draw can be started; it is a fresh draw, and the log rows of the stopped draw do not count as "last year".
- **Given** a preparing or inactive event, **then** the toggle Startad is off and the server refuses a stop.

### MUPP-041-R6 Start mail

Every member of the event shall get mail 3 of MUPP-052 that the draw is done and that they can go in and look.

Acceptance criteria:

- **Given** a successful draw, **then** one mail per member is sent, naming the event and nobody else.
- **Given** a mail fails, **then** the draw stands, and the admin sees who did not get one.

## Notes

Deleting conversations on stop (R7) waits for MUPP-043; `stopDraw` marks the place.
