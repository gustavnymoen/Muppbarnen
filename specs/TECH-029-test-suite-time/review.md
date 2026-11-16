---
type: Review
title: "TECH-029 Test suite time: review"
description: "The code review of the faster browser tests and the rules for new tests: findings, decisions and result."
feature: TECH-029
---

# Code review of TECH-029

**Result:** Passed
**Date:** 2026-11-15, review run 1
**Summary:** No requirement lost its only test, no limit was raised, the axe helper keeps the same rules and exclusion, and `adminSignIn` is correct. Two wrong counts in the documents and one unexplained number are fixed.

**Security:** Passed. No site code changed; the test-only admin cookie is signed with the made-up test key, and nothing touches the user's database. `/security-review` not needed.

## Must fix

None.

## Should fix

- **Fixed:** `wiki/log.md` and `verification.md` said seven tests merged into three and three merges of two; the diff is six fewer tests: five merges of two (MUPP-016 R3 R4, MUPP-016 R5, MUPP-042, MUPP-051, MUPP-072) and the Christmas card's second run of MUPP-022-R2.
- **Fixed:** `tests/helpers.ts` said 190 checks, `solution.md` 188; both say 188.

## Suggestions

- **Done:** a comment names the cookie format where `adminSignIn` reads the expiry.
- `package-lock.json`: `engines.node` changed from `>=24` to `24.x`, which matches `package.json` (an old lock mismatch that `npm` fixed). Mentioned in the commit.

## Checks made

1. Merged tests keep every requirement ID in their titles. MUPP-022-R2 now runs on the first card only (the one reduction judged weaker; accepted, the code is shared: `transition.ts`, MUPP-032). MUPP-017-R4 lost a repeat that MUPP-015 checks on both cards. MUPP-003-R8 makes its wish with `addWish`; the add form is tested in MUPP-045.
2. `expectNoA11yViolations`: the same five tags, the same `[data-toast]` exclusion and the title guard; no import of `@axe-core/playwright` is left.
3. `adminSignIn`: the cookie is `<expires>.<parent id>.<hmac>`; the name check also matches the `__Host-` variant; the tests of the sign-in and of the choice of parent still use the page.
4. `git diff origin/main -- .github scripts` is empty: no limit raised.
5. `CLAUDE.md` and `wiki/system/testing.md` cover every point of TECH-029-R3.
6. The numbers in the specs match (364.3 s with 185 tests before, 322.9 s with 179 after); what was not run (CI margin, ten runs, `npm run test:time` itself) is marked as not checked.

Not checked by the review: tests, lint and the build were not run; the bodies of the merged MUPP-042, MUPP-051 and MUPP-072 tests were read by title and IDs only (they passed in the whole-suite run).
