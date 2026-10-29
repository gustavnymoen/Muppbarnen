---
type: Verification
title: "MUPP-011 Future birthdate: verification"
description: How each requirement of Future birthdate was checked, the test suite before and after, and the requirements as built.
feature: MUPP-011
---

# Verification of MUPP-011

How each requirement was checked. All checks are local so far; the live checks are added after the deploy.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-011-R1 | Unit tests `MUPP-011-R1 …` in `lib/form-input.test.ts` (today, ten months, one day too far, 1899, month ends, Swedish date) and `lib/family.test.ts`; browser test `MUPP-011-R1 R2 R4 …` (the `max` of the field, 11 months refused with the message, 4 months saved) | local | Pass | 2026-10-29 |
| MUPP-011-R2 | Unit test `MUPP-011-R2 …` in `lib/deck.test.ts` (no age, place by date, no date in the data); browser test `MUPP-011-R1 R2 R4 …` (the start page shows "Beräknad {månad}", no "Fyller", the date not in the page) | local | Pass | 2026-10-29 |
| MUPP-011-R3 | Unit tests `MUPP-011-R3 …` in `lib/deck.test.ts` (born today, yesterday and earlier this year give 1; an expected kid turns ordinary on the day) | local | Pass | 2026-10-29 |
| MUPP-011-R4 | Browser test `MUPP-011-R1 R2 R4 …` (the kid's row says "Beräknad {datum}") | local | Pass | 2026-10-29 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `parseBirthdate`, `latestBirthdate`, the deck; `npm run test:unit` | local | Pass | 2026-10-29 |
| Browser tests | `tests/MUPP-011-future-birthdate.spec.ts`; `tests/MUPP-003-admin-page.spec.ts` changed to the new message; axe on the form with the error, on the manage page and on the start page | local | Pass | 2026-10-29 |
| Smoke test | Not applicable: the start page is read-only and unchanged for existing data | n/a | n/a | 2026-10-29 |
| Accessibility | axe in the browser test (see above); the checklist on the live site: not checked yet | local | Pass (axe) | 2026-10-29 |
| Security | Not needed per the card: no new route, action or query; the check is still on the server. Covered by the security points in the review | local | Pass | 2026-10-29 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-29 |

The card planned a check of the "Beräknad" text in `tests/design.spec.ts`; it was not added because the text uses the existing age style (no new look), and the browser test shows it.

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-004) | 106 unit, 49 browser | 84.6 s | 3.8 s |
| After | 110 unit, 50 browser | 83.5 s | 3.9 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations` (done), and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not checked yet)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none)

## Requirements as built

### MUPP-011-R1 A birthdate up to ten months ahead is accepted

The admin form accepts a birthdate from 1900-01-01 up to ten months after today (Swedish date), and refuses everything later with "Skriv ett riktigt datum, högst tio månader fram." The date field has a `max` that matches the limit; the limit is one named constant (`MAX_MONTHS_AHEAD`). At month ends it stays in the month (30 April plus ten months is 28 February).

### MUPP-011-R2 An expected child is shown without an age

On the start page the birthday card of a child whose birthdate is after today shows "Beräknad {månad}" in place of the age, and never a number. The child is in the deck at its place by date with the wish list as for any child; only the month and a flag go to the browser, never the date. The Christmas card lists the child like any other.

### MUPP-011-R3 The age is never below 1

A child whose birthdate is today or earlier is never shown with age 0: the next birthday is the first one. An expected child turns into an ordinary one on the day, without any change by an administrator.

### MUPP-011-R4 The admin list shows who is expected

The administrator's list shows "Beräknad {datum}" instead of "Född {datum}" for a child whose birthdate is after today.

## Notes

- The sentence "not in the future" in the MUPP-003 solution and verification is changed or annotated; its test now checks the new message.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
