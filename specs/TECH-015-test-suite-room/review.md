---
type: Review
title: "TECH-015 Test suite at its time budget: review"
description: "The code review of Test suite at its time budget: findings, decisions and result."
feature: TECH-015
---

# Code review of TECH-015

**Result:** Passed
**Date:** 2026-11-04, review run 2
**Summary:** The change touches only tests, wiki and specs. Every merged test keeps the assertions of the tests it replaced, every requirement ID is still in a test name, and the tests have no new fixed waits, retries or skips. The documentation matches the 97 tests and records honestly that R2 (under 165 s in both runs) is not met reliably.
**Security:** Passed. No site code, sign-in, API, database or personal data changes, so `/security-review` is not needed (the card says so).

How the review works: `wiki/system/code-review.md`.

## Review run 1 (2026-11-03): Stopped, one must-fix, resolved in run 2

- **Must fix, resolved:** the admin test "the sixth wrong password blocks the address, and then even the right one is refused" had been deleted by an over-wide replacement in the cookie merge. It is restored unchanged (`git diff origin/main` shows no hunk for it). It is not the same as TECH-005-R3, which tests the site password; the ID comparison had missed it because `MUPP-003-R1` is in other names.
- **Should fix, resolved:** MUPP-006 lost "removing a stale claim leaves the others alone": R4 now comes first in the merged test with a third claim (`Kamera`) that neither R3 nor R4 may touch; a trailing blank line was removed; the test names in MUPP-003's `verification.md` were updated.

## Must fix

None.

## Should fix

None open. Run 2 found two: the MUPP-006 point above (the "other claim stays after R3 and a reload" assertion, fixed with the third claim) and the MUPP-003 `verification.md` wording "(three tests)" and "(two tests)" for the merged widths and keyboard tests (fixed; the edit is mentioned in TECH-015's `verification.md`).

## Suggestions

- MUPP-009's R2 part is inside `if (runsLocally)`, so against the live site the merged test passes with R2 unchecked, where it used to show as skipped. Keep it in mind when reading live results.
- MUPP-014: the open-list variant now expects both saved sizes (`122`, `30`); the "only the saved sizes" check is covered by the first half of the same test.
- Other `specs/*/verification.md` files may still name old test titles (MUPP-002, -006, -010, -014, -017, -019, -021); a sweep of old test names in the specs is a candidate for the backlog.
- R2 is not met reliably (164.3–170.3 s against under 165 s); the decision is the user's: accept a goal of about 170 s, or take the measures the card puts out of scope.

## Other checks

- Requirement IDs before and after (`npx playwright test --list`): the same 124, none missing.
- The merges (MUPP-002, -003, -006, -007, -009, -010, -014, -015, -017, -019, -021) keep every assertion, except the axe run of MUPP-010-R6, which runs at the last width only (recorded in `verification.md`).

[Specifications](../index.md)
