---
type: Verification
title: "MUPP-073 Families: verification"
description: How each requirement of families was checked, the test suite before and after, and the requirements as built.
feature: MUPP-073
---

# Verification of MUPP-073

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-073-R1 | Unit tests `MUPP-073-R1 …` in `lib/families.test.ts`; browser test `MUPP-073-R1 R2 R3 …` in `tests/MUPP-073-families.spec.ts` (an empty name is refused, a 30-character description is saved and listed with the counts, a family with a parent is not deleted). A description of 31 characters is refused by the server (unit test); the field stops typing at 30, so the browser cannot send it | local | Pass | 2026-11-17 |
| MUPP-073-R2 | Unit tests `MUPP-073-R2 …` (several families, none refused, unknown or non-numeric ids refused, default for a parent inserted without a choice); the browser test above (a new parent without a family is refused, then saved with one) | local | Pass | 2026-11-17 |
| MUPP-073-R3 | Unit tests `MUPP-073-R3 …` (choose among several, automatic with one, the master admin any family and a change without a choice keeps it, an admin without a family refused, a group inserted without a family gets the first); browser tests `MUPP-073-R1 R2 R3 …` (the master admin moves a Secret Santa) and `MUPP-073-R3 R4 …` (one family: no question; two: only hers offered) | local | Pass | 2026-11-17 |
| MUPP-073-R4 | Unit test `MUPP-073-R4 …` (every family and parent change refused for an ordinary admin and for nobody); browser test `MUPP-073-R3 R4 …` ("Sidan finns inte" on Hantera) | local | Pass | 2026-11-17 |
| MUPP-073-R5 | Unit test `MUPP-073-R5 …` in `lib/families.test.ts`: schema and migrations 001–015 on an empty in-memory database with two parents and two Secret Santa, then 016: one family "Familj", both parents in it, no Secret Santa without a family. The visitors' pages are covered by the existing start page and Secret Santa tests, which all pass unchanged apart from the wording | local | Pass | 2026-11-17 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit` | local | Pass (430 tests, 11 new in `lib/families.test.ts`) | 2026-11-17 |
| Browser tests | `tests/MUPP-073-families.spec.ts` (2 tests, axe on the empty-name error and on the Secret Santa form); the existing tests changed only in the wording "grupp" → "Secret Santa" | local | Pass (190 tests) | 2026-11-17 |
| Smoke test | Unchanged: no main page or flow was added or changed. Live tests (the smoke tests) ran after the merge | live | Pass (Live tests run 43875048906 on `edc9aa5`) | 2026-11-16 |
| Accessibility | axe in the two browser tests. The live checklist: not done yet | local | Partly: live checklist not done | 2026-11-17 |
| Security | `/security-review` on the branch: no findings (master-admin check on every new action, ids checked on the server, parameterized SQL, `chooseFamily` limits an ordinary admin to their own families, no new cookie or route); the reviewer's security points passed | local | Pass | 2026-11-17 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-17 |
| Migration against Turso | `016_families.sql` has run on the local test databases and the local development database. On Turso it is run by the build on Vercel (`scripts/db-setup.mjs` before `build`, all or nothing per migration); the build log was not read. Seen: Vercel's status for the merge commit `edc9aa5` is "Deployment has completed" and Live tests passed against the site. Not tried on a copy of the production database first | live | Build and Live tests green; migration output not checked | 2026-11-16 |

## Test suite

`npm run test:time` before and after the change (budget 350 s).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 188 browser (MUPP-074 verification) | 330.1 s | 6.8 s |
| After | 430 unit + 190 browser | 342.5 s | 6.6 s |

Within the budget. The change added 2 browser tests (about 5 s: 2.9 s and 2.3 s in the run of the one file) and changed none in time. The before-number is from another day's run on the same machine, where earlier runs of the same code varied between 330 and 346 s, so the difference is mostly noise.

## Definition of Done

- [x] Tests: every requirement has a test; unit and browser tests pass
- [x] Test suite: 342.5 s, within the 350 s budget
- [x] Deployed, and the smoke tests pass against production (Live tests, run 43875048906, 2026-11-16)
- [ ] Accessibility: axe passes; the live checklist is not done
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, lint:docs, typecheck and build pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

Copied from the card (#255).

### MUPP-073-R1 Manage families

The site shall let the master admin create, rename and delete families, each with a name (1–60 characters, unique ignoring case) and a short description (0–30 characters).

Acceptance criteria:

- **Given** the master admin on the admin page, **when** they add a family with a name and a description of at most 30 characters, **then** it is saved and listed.
- **Given** a family with a description of 31 characters, **when** it is saved, **then** it is refused with a message in Swedish.
- **Given** a family that still has parents or Secret Santa groups, **when** the master admin tries to delete it, **then** it is refused and says why.

### MUPP-073-R2 Parents belong to families

The site shall let the master admin set which families each parent belongs to, and require at least one.

Acceptance criteria:

- **Given** a parent, **when** the master admin ticks two families, **then** the parent belongs to both.
- **Given** a parent, **when** the master admin unticks the last family, **then** it is refused.
- **Given** a new parent, **when** it is created, **then** at least one family has to be chosen.

### MUPP-073-R3 A Secret Santa group belongs to one family

The site shall give every Secret Santa group exactly one family. The master admin can set any family on any group; an administrator who creates a group chooses among the families they belong to, and gets it set automatically when they belong to only one.

Acceptance criteria:

- **Given** a Secret Santa group, **when** the master admin chooses another family for it, **then** the group belongs to that family.
- **Given** an administrator in families X and Y, **when** they create a group, **then** they must choose X or Y and cannot choose another family (also refused on the server).
- **Given** an administrator in only family X, **when** they create a group, **then** it gets X without a question.
- **Given** a group, **when** it is saved without a family, **then** it is refused.

### MUPP-073-R4 Only the master admin manages families

The site shall let only the master admin create, change and delete families and set which families a parent belongs to.

Acceptance criteria:

- **Given** an ordinary administrator, **when** they open the admin page, **then** no family settings are shown (only the choice in R3 when they create a group), and the server refuses family changes made by them.

### MUPP-073-R5 Existing data and visitors are unchanged

The site shall, when the feature goes live, put all existing parents and Secret Santa groups in one default family, and visitors shall see the same site as before.

Acceptance criteria:

- **Given** the database before the migration, **when** it has run, **then** one family exists, every parent belongs to it and every Secret Santa group has it, and no row is left without a family.
- **Given** a visitor, **when** they open the start page and Secret Santa, **then** everything is shown as before.

[Specifications](../index.md)
