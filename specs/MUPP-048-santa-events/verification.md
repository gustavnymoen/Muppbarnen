---
type: Verification
title: "MUPP-048 Secret Santa: events created by any parent: verification"
description: How each requirement of Secret Santa events was checked, the test suite before and after, and the requirements as built.
feature: MUPP-048
---

# Verification of MUPP-048

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-048-R1 | Browser test `MUPP-048-R1 R3 a parent who is not master admin has the tab…` (axe on the tab); unit test `MUPP-048-R1` (`lib/santa.test.ts`: a non-master parent creates, renames, deletes; nobody signed out can do anything) | local | Pass | 2026-11-09 |
| MUPP-048-R2 | Unit tests `MUPP-048-R2` (length, trimming, unique ignoring case and spaces, also when renaming and for `Å`/`å`; deleting frees the name; a parent who owns an event cannot be removed); browser test `MUPP-048-R2 a group name is refused…` (the message, axe) | local | Pass | 2026-11-09 |
| MUPP-048-R3 | Unit tests `MUPP-048-R3` (own events only; every action refused for someone else's event or member; the master admin changes all); browser tests `MUPP-048-R1 R3 …` (another parent sees nothing; the master admin sees both with "administreras av") and `MUPP-048-R3 an action sent for someone else's group is refused…` (a forged `eventId`). "Never who drew whom": there is no draw yet (MUPP-041) | local | Pass | 2026-11-09 |
| MUPP-048-R4 | Browser test `MUPP-048-R4 R5 the entrance lists every group…` (all groups, then only that group's names, no phone or email in the page); unit test `MUPP-048-R4 R5` (`lib/santa-auth.test.ts`); the list of groups on a 375 px phone in `tests/design.spec.ts` (`MUPP-039-R3 R4b…`) | local | Pass | 2026-11-09 |
| MUPP-048-R5 | Unit tests (`lib/santa.test.ts`: phone and email unique within an event, the email ignoring case, the same details in two events, a change in one never touches the other; `lib/santa-wishes.test.ts`: one list per member; `lib/santa-session.test.ts`: an old cookie names nobody); browser tests `MUPP-048-R4 R5…` and `MUPP-040-R3 MUPP-048-R5…` (signing in to one of two groups with the same phone shows only that group's page) | local | Pass | 2026-11-09 |
| MUPP-048-R6 | Not checked: no Secret Santa mail exists yet (MUPP-041 to MUPP-043 and TECH-017 build them); the rule is noted in `solution.md` for those cards | not applicable yet | Not checked | 2026-11-09 |
| MUPP-048-R7 | Unit tests `MUPP-048-R7` in `db/db-setup.test.ts` (made-up families, a person in two families, partners, wishes: owner, ids, details and links kept, a repeated name made unique, the rules hold afterwards; an empty database); the migration run on a copy of the local database (no Secret Santa rows there). Not run on production data (Turso): it runs there at the deploy | local | Pass | 2026-11-09 |
| MUPP-048-R8 | Browser tests `MUPP-048-R8 the names step has Tillbaka…` (one group: href `/`; several: the list; Esc; the sign-in step still goes to the names; no "Byt grupp"; axe) and `MUPP-047-R1 R2 R3…`; position, 44 px and no overlap with the menu button in `tests/design.spec.ts` (`expectBackInCorner`) | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa.test.ts` (17), `lib/santa-auth.test.ts`, `lib/santa-wishes.test.ts`, `lib/santa-session.test.ts`, `db/db-setup.test.ts` (the migration, 2 tests (one with a blank name)): 234 in all | local | Pass | 2026-11-09 |
| Browser tests | New `tests/MUPP-048-santa-events.spec.ts` (5 tests); `MUPP-038`, `MUPP-039`, `MUPP-040`, `MUPP-045`, `MUPP-046`, `MUPP-053` and `design.spec.ts` updated for groups. `npm run test:local`: 130 tests | local | Pass (the one failure of the first run, an old assertion of MUPP-047 that the names step has no Tillbaka, was updated and re-run) | 2026-11-09 |
| Smoke test | The existing `@smoke` test `MUPP-039-R1` (the entrance is behind the site password and shows no names) still covers `/secret-santa` | local; preview (Preview tests on the pull request); live (Live tests run 42655300363 on 10f4f31) | Pass | 2026-11-09 |
| Accessibility | axe in the browser tests on the tab (non-master parent, master admin), the name error, the entrance (list of groups, names, back button). The event list and the tab for a non-master parent on the live site: see the Result column | local | Pass locally; live: the user reports it tested by hand (2026-11-09, said by the user; not recorded item by item) | 2026-11-09 |
| Security | `/security-review` (no findings at confidence 8 or higher) and the review's security points: [review.md](review.md) | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time`, on `main` (812d831) before and on this branch after. The suite was already over its budget before (TECH-019, not this card).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 226 unit, 125 browser | 259.3 s (unit 0.4 s) | 7.6 s |
| After | 234 unit, 130 browser | 272.1 s (unit 0.4 s) | 6.8 s |

The browser suite grew by 12.8 s (5 %) for 5 more tests. The tests over the 5 s budget are mostly the same as before; `MUPP-047-R1 R2 R3…` (5.7 s) joined them, with one changed assertion. The new tests are under it. The "after" run was made before that one assertion was updated.

## Definition of Done

- [x] Tests: every check in the plan is done locally except R6 (no mail exists yet); `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (grown 5 %; the budget was already exceeded before, TECH-019); accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): run 42655300363 on 10f4f31, success, 2026-11-09
- [x] Accessibility: axe passes locally; the user went through the live site by hand, including the screen reader items, and reports it as tested (2026-11-09, said by the user; not recorded item by item)
- [x] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none found

## Requirements as built

### MUPP-048-R1 Every parent can create an event

Every parent signed in to the admin shall see the Secret Santa tab and be able to create an event.

Acceptance criteria:

- **Given** Emma (not master admin) on the admin page, **then** the Secret Santa tab is shown and she can create an event, which she then administers.

### MUPP-048-R2 Unique name

An event name shall be 1 to 60 characters and unique among all events, ignoring case and spaces at the ends.

Acceptance criteria:

- **Given** an event "Julen 2026", **when** anyone creates "julen 2026 " (or renames another to it), **then** it is refused with "Det finns redan en grupp med det namnet."

### MUPP-048-R3 Own events only

An administrator shall see and change only the events they created.

Acceptance criteria:

- **Given** Emma's event, **when** Erik opens the admin or sends an action for it, **then** he does not see it and the action is refused on the server.
- **Given** the master admin, **then** they see and can change all events, but never who drew whom.

### MUPP-048-R4 Events on `/secret-santa`

`/secret-santa` shall list all events by name, and picking one shall continue to the names and the sign-in of that event.

Acceptance criteria:

- **Given** several events, **when** a visitor opens `/secret-santa`, **then** all group names are listed, and the visitor picks the one they belong to; **given** one event, **then** its names show directly (as today).
- **Given** a picked event, **then** only that event's member names are shown, and no phone or email.

### MUPP-048-R5 Separate members and lists per event

Each event shall have its own members. A real person in several events is a separate member in each, with separate wish lists, draws, questions and sign-ins, and may have the same phone and email in each.

Acceptance criteria:

- **Given** the same phone number added in two events, **then** both are accepted; the same phone or email twice in one event is refused.
- **Given** a person in two events, **when** they sign in to one, **then** they see only that event's page; a change in one never touches the other.
- **Given** an administrator, **then** they never see members of an event they cannot manage.

### MUPP-048-R6 Mails name the event

Every Secret Santa mail shall say which event it is about, and nothing else about who is who.

Acceptance criteria:

- **Given** the start mail, a change mail or a message mail, **then** the text names the event ("Secret Santa: <gruppens namn>") and no member names.

### MUPP-048-R7 Existing data kept

The family built under MUPP-038 shall become an event owned by its creator, with members, partners and sign-ins unchanged.

Acceptance criteria:

- **Given** the migration, **then** the existing family is an event owned by the master admin parent, and no member, partner or contact detail is lost.
- **Given** people who were in several families, **then** each family gets its own copy of them, with the same details.

### MUPP-048-R8 Back to the events from the names

The step with the member names of a picked event shall have the shared back button in the top left corner, and shall not have a text button for it (today "Byt familj"). With several events it goes back to the list of events; with one event the names are the first step, so it goes to the start page (`/`).

Acceptance criteria:

- **Given** several events and a picked event, **when** the names show, **then** a back button (accessible name "Tillbaka", at least 44 px, keyboard focus, passes axe) is in the top left corner and "Byt familj" / "Byt grupp" is not there.
- **Given** the back button, **when** pressed (or Esc), **then** the list of events shows again with nothing picked.
- **Given** the sign-in step, **then** its back button still goes back to the names of the same event (MUPP-047).
- **Given** one event, **then** the names show with a back button that goes to the start page (the kid cards), since the names are the first step.

## Notes

- R6 (mails name the event) cannot be built or tested until the mails exist; it stays a requirement for MUPP-041 to MUPP-043 and TECH-017.
- Everyone who was signed in to Secret Santa is signed out by the change of the cookie's signature (see `solution.md`).
- The card says a name is unique "ignoring case": SQLite only lowercases ASCII, so the check is made in code (`toLocaleLowerCase("sv")`).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
