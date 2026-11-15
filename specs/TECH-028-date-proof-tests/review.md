---
type: Review
title: "TECH-028 Date-proof browser tests: review"
description: "The code review of the fixed test date: findings, decisions and result."
feature: TECH-028
---

# Code review of TECH-028

**Result:** Passed (after one must-fix, fixed)
**Date:** 2026-11-15, review run 1
**Summary:** The fixed-date approach is sound and the guard is correct. One test that still used the real year (MUPP-044) would have failed from 2027-01-01; it is fixed.
**Security:** Passed. `clockNow()` returns the fixed date only if `TEST_TODAY` is set and the database URL starts with `file:`, so a deployed site (`libsql://`) follows the clock; there is a unit test for both cases. `TEST_TODAY` is not a `NEXT_PUBLIC_` variable and reaches no route or input. `/security-review`: not needed, no sign-in, API route, server action, query or personal data is changed.

How the review works: `wiki/system/code-review.md`.

## Must fix

- `tests/MUPP-044-santa-cleanup.spec.ts:11` `realYear` used the real clock while the server files a draw under the year of the fixed date, so it would fail from 2027-01-01. **Done:** it uses `testToday().year`; `tests/` has no other `getFullYear` or `new Date()` outside `helpers.ts`.

## Should fix

- `tests/helpers.ts` `testNow()` has no local-database guard. **Done:** a comment says why it is safe (the config sets `TEST_TODAY` only for the local server).
- `verification.md` was missing when the reviewer read the folder. **Done:** written in the same change.

## Suggestions

- The unit test compared with a fixed 2026 date. **Done:** it compares with `Date.now() - 86_400_000`.
- The `T12:00:00Z` date is built in two places (`lib/deck.ts`, `tests/helpers.ts`). **Left as it is:** two places, one line each; a shared function when a third appears.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
