---
type: Verification
title: "MUPP-079 Stay signed in to several Secret Santa groups: verification"
description: How each requirement of MUPP-079 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-079
---

# Verification of MUPP-079

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-079-R1 | Unit tests `MUPP-079-R1 …` in `lib/santa-session.test.ts` (two entries read in order, only ids, years and signatures; at most 10, the oldest dropped); browser test `MUPP-079-R1 R2 R3 …` (the cookie after two sign-ins) | local | Pass | 2026-11-15 |
| MUPP-079-R2 | Browser test `MUPP-079-R1 R2 R3 …`: sign in to A, then B with the form, both work | local | Pass | 2026-11-15 |
| MUPP-079-R3 | Browser tests `MUPP-079-R1 R2 R3 …` (Tillbaka and the choice of group, no new sign-in, axe on both groups' own pages and the choice of group), `MUPP-079-R3 a group in the address …` (a group without a sign-in, a group that does not exist, no group with one or two sign-ins), `MUPP-079-R3 the wish list …` (a write goes to its own group, a changed hidden group id writes nothing); the old tests of MUPP-039, 042, 043, 048, 051, 055 and `design.spec.ts` were updated for the arrow as a link and `?grupp=` in the address | local | Pass | 2026-11-15 |
| MUPP-079-R4 | Browser test `MUPP-079-R4 …`: a removed member loses only that group's sign-in; an entry from before the cleanup year is refused and the other kept | local | Pass | 2026-11-15 |
| MUPP-079-R5 | Unit test `MUPP-079-R5 …` (a forged, foreign-key or malformed entry is ignored, the valid one stays); browser test `MUPP-079-R5 …` (a changed member id with another entry's signature) | local | Pass | 2026-11-15 |
| MUPP-079-R6 | Unit tests `MUPP-048-R5 MUPP-079-R6 …` in `lib/santa.test.ts` (the same phone or email in one group is refused on add and edit, accepted in two groups); browser test `MUPP-079-R6 …` (the same phone signs in to each group separately) | local | Pass | 2026-11-15 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-session.test.ts` (list, limit, forged entries), `lib/santa.test.ts` (R6) | local | Pass | 2026-11-15 |
| Browser tests | `tests/MUPP-079-santa-several-groups.spec.ts`, 6 tests | local | Pass | 2026-11-15 |
| Smoke test | Not applicable: no main page or flow is added; the sign-in flow is the same | | | |
| Accessibility | axe on the choice of group and the own page of both groups; the live checklist of `wiki/system/accessibility.md` is marked done by the user, no per-item details were recorded | local, live | Pass (axe); checklist as reported by the user | 2026-11-16 |
| Security | Security points in the review; `/security-review` run, no findings at confidence 8 or higher | local | Pass | 2026-11-15 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-15 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-078, merged main) | 400 unit + 179 browser | 390.4 s | 30.1 s (a failing test; 7.4 s on the run before) |
| After | 404 unit + 185 browser | 376.7 s | 7.7 s |

The total is over the 330 s budget, as it already was on `main`; this change adds 6 short tests. Two `design.spec.ts` tests failed in the full run (they still expected the arrow as a button and `/matchning` without `?grupp=`); they were fixed and pass in a separate run, but the full suite was not run again after that.

## Definition of Done

- [x] Tests: every requirement is tested; `npm run test:unit` passes; the browser suite passed except two tests fixed afterwards and run on their own
- [ ] Test suite: over the total budget as before; the 25 % growth rule holds (the total is lower than the last recorded one)
- [x] Deployed, and the smoke tests pass against production (Live tests): run 43765010550 on `main` after the merge, 2026-11-15, success
- [x] Accessibility: axe passes; the live checklist is marked done by the user (no per-item details recorded)
- [x] Requirements in the card match what was built (below); `solution.md` describes how it was built
- [x] Manual, system docs and log updated
- [x] No leftovers: `leave` and `clearSantaCookie` are deleted
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review passed, see [review.md](review.md); `/security-review` run
- [x] No technical tasks added

## Requirements as built

### MUPP-079-R1 Several memberships in the cookie

The cookie shall hold a signed list of memberships, one per group, with the same signature rules as today and still nothing but ids and the cleanup year. The list holds at most one membership per group, and at most 10 memberships in all (the oldest is dropped).

Acceptance criteria:

- **Given** a visitor signed in to two groups, **when** the cookie is read, **then** both memberships are valid and nothing but ids and the cleanup year is in it.

### MUPP-079-R2 Signing in adds

Signing in to another group shall add its membership and not replace the others.

Acceptance criteria:

- **Given** a visitor signed in to group A, **when** they sign in to group B, **then** they are signed in to both.

### MUPP-079-R3 Switching keeps the sign-ins

"Tillbaka" and the choice of group shall switch the shown group without removing the other sign-ins. The own page knows its group from a group id in the address (`?grupp=<group id>`); the id only selects among the memberships in the cookie, so it never gives access to anyone else.

Acceptance criteria:

- **Given** a visitor signed in to groups A and B, **when** they go back to the choice of group and open A, **then** they land on their own page in A (`?grupp=A`) without signing in.
- **Given** a group id in the address that the cookie has no membership for, **then** the visitor is asked to sign in to that group, and nobody else's page is shown.
- **Given** no group id in the address, **then** the choice of group is shown (with one membership: that group, as today).

### MUPP-079-R4 Invalid membership

A removed member or the yearly cleanup shall only invalidate that one membership.

Acceptance criteria:

- **Given** a visitor signed in to A and B and removed from A, **when** they open the site, **then** A asks for sign-in and B still works.

### MUPP-079-R5 No picking another person's membership

Nobody shall be able to pick another person's membership by changing the cookie; each entry is signed.

Acceptance criteria:

- **Given** a cookie with an entry whose signature does not match, **when** it is read, **then** that entry is ignored.

### MUPP-079-R6 Phone and e-mail are unique within a group only

Phone and e-mail shall be unique among the people of one group, and may be the same in different groups. This already holds (`contactTaken` in `lib/santa.ts`, `UNIQUE (event_id, phone)`); this card adds the tests that keep it true.

Acceptance criteria:

- **Given** a person with a phone or e-mail that another person in the same group already has, **when** the administrator adds or edits the person, **then** an error is shown on that field and nothing is saved.
- **Given** the same phone and e-mail in two different groups, **then** both are accepted, and the visitor signs in to each group separately (a member id is per group, MUPP-048).

## Test plan

## Notes

- The live accessibility checklist and a check on a real phone are marked done by the user on 2026-11-16; no per-item details were recorded.

- A visitor with exactly one sign-in who opens `/secret-santa` without a group is sent straight to that group, as the card says. "Tillbaka" on the own page links to `/secret-santa?val=grupp`, which switches that redirect off so the choice of group can be reached.
- Without `?grupp=` the own page and its sub pages use the cookie's single entry, so old bookmarks keep working.
- An old one-entry cookie is a valid list of one, so nobody is signed out by the deploy.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
