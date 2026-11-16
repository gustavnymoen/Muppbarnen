---
type: Verification
title: "MUPP-074 Amount on Secret Santa groups: verification"
description: How each requirement of the amount on Secret Santa groups was checked, the test suite before and after, and the requirements as built.
feature: MUPP-074
---

# Verification of MUPP-074

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-074-R1 | Unit tests `MUPP-074-R1 …` in `lib/santa.test.ts`; browser tests `MUPP-074-R1 …` in `tests/MUPP-074-santa-amount.spec.ts` | local, CI | Pass | 2026-11-16 |
| MUPP-074-R2 | Browser test `MUPP-074-R2 …` in `tests/MUPP-074-santa-amount.spec.ts` (beside the greeting, none without an amount); the look on a 320 px phone with a long name: test in `tests/design.spec.ts` | local | Pass | 2026-11-16 |
| MUPP-074-R3 | Unit tests `MUPP-074-R3 …` in `lib/santa-mail.test.ts`, `lib/santa-notify.test.ts` and `lib/santa.test.ts` | local | Pass | 2026-11-16 |
| MUPP-074-R4 | Browser test `MUPP-074-R1 R4 …` (closed card, after a change, none when cleared); the look with a long name and the "Admin: …" line on 320 px: test in `tests/design.spec.ts` (no sideways scroll) | local | Pass | 2026-11-16 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npx vitest run` | local | Pass (419 tests) | 2026-11-16 |
| Browser tests | `tests/MUPP-074-santa-amount.spec.ts` (3 tests, axe in two) and one in `tests/design.spec.ts`; all 188 passed in the last local run; CI "check" had one `database is locked` in a MUPP-043 test on its first run and passed on the rerun | local, CI | Pass | 2026-11-16 |
| Smoke test | Unchanged: no main page or flow was added or changed | preview, live | Pass (Live tests run 43845878124) | 2026-11-16 |
| Accessibility | axe in the browser tests; the live checklist marked done by the user (no per-item details recorded) | local, live | Pass | 2026-11-16 |
| Security | `/security-review` on the branch: no findings (server check, parameters, `canManage`, no new route) | local | Pass | 2026-11-16 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-16 |

## Test suite

`npm run test:time` before and after the change (budget 350 s after TECH-029).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured on `main` without this change; TECH-029 recorded 179 browser tests in 322.9 s, and MUPP-077 and MUPP-079 added tests after that | | |
| After | 419 unit + 188 browser | 330.1 s | 6.8 s |

Within the budget. The change itself added 4 browser tests (3 in `tests/MUPP-074-santa-amount.spec.ts`, 1 in `tests/design.spec.ts`) and changed one (MUPP-045). The after-number is one local run; earlier runs of the same code gave 343.1 s and 345.5 s, so the machine's noise is larger than the change.

## Definition of Done

- [x] Tests: every check in the test plan is done; every requirement is tested; unit and browser tests pass
- [x] Test suite: 330.1 s, within the 350 s budget
- [x] Deployed, and the smoke tests pass against production (Live tests): pull request 276 merged as commit 611865f; Live tests run 43845878124 passed on 2026-11-16
- [x] Accessibility: axe in the browser tests; the live checklist marked done by the user
- [x] Requirements in the card match what was built; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, lint:docs, typecheck and build pass
- [x] Code review done, no must-fix findings; `/security-review` without findings, see [review.md](review.md)
- [x] No larger improvements to add to the board; the occasional `database is locked` in the browser tests is known from TECH-029

## Requirements as built

Copied from the card (#256).

### MUPP-074-R1 Amount on the group

The site shall let an administrator enter an optional amount, a whole number of kronor, when creating or editing a Secret Santa group.

Acceptance criteria:

- **Given** the group form in admin, **when** the administrator enters an amount (for example 200) and saves, **then** the amount is stored on the group.
- **Given** the field is left empty, **then** the group has no amount.
- **Given** something that is not a whole number above 0 (letters, a decimal, a negative number, a range), **when** it is saved, **then** it is refused with a message and nothing is saved; the server checks it, not only the form.
- **Given** a group with an amount, **when** the administrator edits the group and clears the field, **then** the amount is removed.

### MUPP-074-R2 Amount on the home screen

The site shall show the group's amount on the Secret Santa home screen, shown to the right of "Hej <name>" on the same line, as a small pill reading "200 kr" (decided by the user from sketches: option B).

Acceptance criteria:

- **Given** a group with an amount, **when** a member opens their home screen, **then** the amount is shown.
- **Given** a group without an amount, **then** nothing is shown and no space is left for it.

### MUPP-074-R3 Amount in the match mail

The mail that tells each member who they were matched with (the draw mail, `lib/santa-mail.ts`) shall state the amount when the group has one.

Acceptance criteria:

- **Given** a group with an amount, **when** the draw mail is made, **then** its text says "Beloppet är 200 kr".
- **Given** a group without an amount, **then** the mail text is as before.

### MUPP-074-R4 Amount in the admin overview

The site shall show the group's amount on the group's card in the Secret Santa tab of admin, with the other facts about the group (status, number of members and, for the main administrator on other people's groups, who the admin is), so the administrator sees it without opening the group.

Acceptance criteria:

- **Given** a group with an amount, **when** the administrator looks at the tab, **then** the card shows "200 kr" next to the other facts, both when the card is closed and when it is open.
- **Given** a group without an amount, **then** nothing is shown and no space is left for it.
- **Given** the amount is changed in the form, **when** it is saved, **then** the card shows the new amount.
- **Design:** the user wants to see how it looks (on a phone, with a long group name and with the "Admin: …" line) before it is built; the placement is decided from a sketch in the running site and written on this card.

## Notes

The migration is `015_santa_amount.sql` (014 was taken by MUPP-077 while this was built). The MUPP-045 test of the new-group form changed, since the form now has two fields (Enter goes name, amount, send).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
