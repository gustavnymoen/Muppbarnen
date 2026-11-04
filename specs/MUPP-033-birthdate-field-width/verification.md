---
type: Verification
title: "MUPP-033 Birthdate field fits on a phone: verification"
description: How the birthdate field fix was checked, the test suite before and after, and the requirements as built.
feature: MUPP-033
---

# Verification of MUPP-033

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-033-R1 (320 and 375 px) | Test `MUPP-010-R6 the unfolded panels and the kid pages have no sideways scroll at 320, 375 and 430 px, and pass axe` (`tests/MUPP-010-compact-admin.spec.ts`): the date field's right edge is inside its form in the add form and an edit form, and no sideways scroll | local | Pass | 2026-11-04 |
| MUPP-033-R1 (iPhone, Safari) | Manual, on the user's iPhone against the preview: add form and edit form, the date can be chosen and saved. Not automated: only iOS Safari shows the fault, and there is no iOS Simulator on this machine | preview | Pass: first version fit the form but the date sat at the top of the box; fixed with `flex items-center` (PR 126), then add and edit form looked right and the date could be chosen | 2026-11-04 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: CSS only | | | |
| Browser tests | The R6 test above, extended; the whole suite with `npm run test:time` | local | Pass | 2026-11-04 |
| Smoke test | Not applicable: the admin page needs sign-in | | | |
| Accessibility | axe in the extended R6 test (unchanged); phone check on the iPhone with the picker: field reachable and usable | local | Pass (axe) | 2026-11-04 |
| Security | Not needed: CSS only | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-04 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 97 | about 166 s (TECH-015) | 4.4 s |
| After | 97 | 165.7 s | 4.4 s |

## Definition of Done

All points hold: tests, review, iPhone check and the Live tests (green on `main` after the merge, 2026-11-04). The date was centred in a second step (PR 126).

## Requirements as built

### MUPP-033-R1 The birthdate field fits the form

The site shall show the birthdate field no wider than its form at widths from 320 px, also in Safari on iOS, so that Hantera doesn't scroll sideways. As built: date inputs get `min-w-0 max-w-full appearance-none` (see [Solution](solution.md)).

## Notes

The manual (`wiki/manual/`) is unchanged: visitors see no new function.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
