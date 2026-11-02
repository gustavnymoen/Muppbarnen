---
type: Verification
title: "MUPP-020 Birthday day on the cards: verification"
description: How each requirement of Birthday day on the cards was checked, the test suite before and after, and the requirements as built.
feature: MUPP-020
---

# Verification of MUPP-020

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-020-R1 | Unit test `MUPP-020-R1 …`; browser tests `MUPP-004-R2 R3 … MUPP-020-R1 one kid …` (heading is the date) and `… several kids …` (the date once); look in `tests/design.spec.ts` (`MUPP-020-R1 R2 …`, "29 september" on one line at 320 px, clear of the corner icons) | local | Pass | 2026-11-02 |
| MUPP-020-R2 | Unit test `MUPP-020-R2 …`; browser test `MUPP-011-R1 R2 R4 MUPP-020-R2 …` ("Beräknad {dag och månad}", no age); look test as above | local | Pass | 2026-11-02 |
| MUPP-020-R3 | Unit test `MUPP-020-R3 …` (28 February without a 29th, 29 February in a leap year) | local | Pass | 2026-11-02 |
| MUPP-020-R4 | Unit test `MUPP-004-R6 …` (exact keys of card and kid, no birthdate, no year) and the browser tests (page HTML holds no birthdate) | local | Pass | 2026-11-02 |
| MUPP-020-R5 | Search of `specs/` and `wiki/` for "aldrig dagen", "never the day", "only the month", "bara månaden": nothing left; code review | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/deck.test.ts` | local | Pass | 2026-11-02 |
| Browser tests | The tests above, with axe on each state | local | Pass | 2026-11-02 |
| Smoke test | Not applicable: no page or flow is added | | | |
| Accessibility | axe in the browser tests; the checklist on the live site: not checked yet (after deploy) | local | Partly | 2026-11-02 |
| Security | Security points in the review; `/security-review` not needed (no sign-in, route, query or form changes) | local | Pass | 2026-11-02 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main) | 134 unit + 102 browser | about 177 s (MUPP-023) | |
| After | 137 unit + 103 browser | 175.0 s (budget 180 s) | 5.9 s (MUPP-016, same two over 5 s as before; MUPP-003 design 5.0 s) |

## Definition of Done

- [ ] Deployed, Live tests and the live accessibility checklist: not done yet
- [x] The rest is described in the table and notes above; commit and pull request are left for the user's go-ahead

## Requirements as built

As in the card (`gh issue view 65`): R1 the heading of a birthday card shows day and month ("17 mars"), once per card; R2 an expected kid's card shows "Beräknad 17 mars" and no age; R3 29 February is shown as 28 February in a year without one; R4 the browser gets day, month and age, never the birthdate or the birth year; R5 the rule and texts say day and month are shown.

## Notes

- The heading shrinks on narrow phones (see [solution.md](solution.md)): found by the look tests, since "22 november" wrapped at 320 px and touched the corner icons.
- Earlier full runs timed out in places while another session's test server shared port 3100; the final run, alone on the machine, passed all 103 browser tests.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
