---
type: Review
title: "TECH-018 Test suite at its time budget again: review"
description: "The code review of Test suite at its time budget again: findings, decisions and result."
feature: TECH-018
---

# Code review of TECH-018

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** The wait skip is gated by the setting and a local database file, and wrong tries are still counted and blocked. No requirement lost its test. The 170 s goal of R1 is not met and is reported as such in `verification.md`.
**Security:** Passed, no findings. `wrongWait` skips the wait only with `SKIP_LOGIN_WAIT=1` and a `file:` database, and only the test server sets it. `/security-review`: run, no findings.

## Must fix

None.

## Should fix

- `tests/santa.ts:9` The comment "(tests/../playwright.config.ts)" was garbled. **Done:** now "set in `playwright.config.ts`".

## Suggestions

- `lib/login-block.test.ts` The one-second unit test covers `checkLogin`; the Santa test covers the other path. **Done:** left as it is, both paths are covered.
- `tests/helpers.ts` Keep the `--repeat-each` runs whenever `settledBox` changes again. **Done:** recorded in `solution.md`.
- `tests/MUPP-039-secret-santa-entrance.spec.ts` The merged R5 R6 test is harder to place on a failure. **Done:** left as it is, the name carries both IDs.

## Outside the change

- A way to bring the suite to 170 s (reduced motion for tests not about motion, or more than one worker) is waiting for the user's decision on R1; no card added.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
