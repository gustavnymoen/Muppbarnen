---
type: Verification
title: "TECH-029 Test suite time: verification"
description: How each requirement of Test suite time was checked, the test suite before and after, and the requirements as built.
feature: TECH-029
---

# Verification of TECH-029

How each requirement was checked. This is a change to the tests and the instructions; what visitors see is unchanged.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-029-R1 | The findings are in [solution.md](solution.md). Every test that was merged or changed keeps the requirement IDs in its name (the merged tests name all of them: `MUPP-016-R3 R4`, `MUPP-042-R1 R3`, `MUPP-051-R2 R7`, `MUPP-072-R1 R2 R3`); MUPP-022-R2 and the longer part of MUPP-022-R1 run on the card with several kids only, and the Christmas card keeps R1's first part and its own tests (MUPP-015, MUPP-016, MUPP-037). The whole suite passed: 179 tests, no retries. The number of checks per requirement is not lower except the repeats named in solution.md (the Christmas card's second run of the shared motion and focus code, the "Tillbaka does what Stäng does" repeat in MUPP-017-R4). Whether any requirement lost its only test is for the code review | local | Pass | 2026-11-15 |
| TECH-029-R2 | Whole suite on a quiet machine, one run at a time (own `HOME`, port 3211): 322.9 s for 179 tests, 27 s under the budget of 350 s (7 s under the 330 s of the card as first written; see Notes). Not run as `npm run test:time` itself, since that script uses port 3100, which other sessions on the computer use; the same Playwright command and the same `testsIn` sum were used. Slowest test 7.0 s. **CI** (at least 10 % under 455 s, that is 409.5 s or less): pull request 271's CI run, `check-test-time.mjs`: 179 tests, 361.2 s of 455.0 s, 20.6 % under; slowest test 7.5 s of 9.3 s. **Ten runs in a row without a database lock:** run on `main` after the merge (`5c470f4`, own `HOME`, port 3211): ten whole-suite runs in a row, 0 database locks in any log. Three of the ten had a failing test that was not a lock: `MUPP-071-R1` in runs 1, 5 and 8 (a bare `boundingBox()` read 43.x px during an animation) and `MUPP-029-R1 R2` in run 5 (the closing copy had finished before its transform was read). Both are fixed in a separate small change (the two tests, 25 repeats each under four busy processes: 125 passed) | local, CI | Pass (ten runs: no lock; two flaky tests found and fixed separately) | 2026-11-16 |
| TECH-029-R3 | `CLAUDE.md` (the workflow's Test step, the Definition of Done item 9, and the section "Tests": "Be sparing with browser tests") and `wiki/system/testing.md` (Browser tests, "Be sparing") say: a rule is a unit test plus one browser test, a new check joins an existing journey and page load, set-up is shared, the same behaviour is not checked twice, a feature records the seconds its tests added, and a feature that would go over the budget merges or removes tests first and raises no limit in the same pull request. Read against the card's criterion | local | Pass | 2026-11-15 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `scripts/test-time-limits.test.ts` still passes (`npm run test:unit`: 404 passed); none new, no script changed | local | Pass | 2026-11-15 |
| Browser tests | The whole suite before (185 tests, 364.3 s) and after (179 tests, 322.9 s), with the profile by test in between | local | Pass | 2026-11-15 |
| Smoke test, accessibility checklist | Not applicable: nothing a visitor sees changes. axe still runs in every state it ran in, now in the page (`axe-core`), with the same rules and the same exclusion | | | |
| Security | Not needed: no site code changed | | | |
| Code review | [review.md](review.md) | local | See review | |

## Test suite

On the development Mac, one run at a time (own `HOME`), the browser tests' own times summed as `npm run test:time` does.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (`main` at `7ec9062`) | 404 unit + 185 browser | 364.3 s | 7.1 s |
| After | 404 unit + 179 browser | 322.9 s | 7.0 s |

This change added no browser test; it removed six (five merges of two: MUPP-016 R3 R4, MUPP-016 R5, MUPP-042, MUPP-051 and MUPP-072; and the Christmas card's second run of MUPP-022-R2).

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the ten runs without a database lock were made afterwards, see above); `npm run test:unit` and the browser tests pass
- [x] Test suite: within the budget locally (322.9 s of 350 s), and in CI 361.2 s of 455 s
- [x] Deployed, and the smoke tests pass against production (Live tests): passed on the merge commit db58623 (2026-11-16)
- [x] Accessibility: not applicable to visitors; axe runs in every state it did
- [x] Requirements in the card match what was built, no open questions left (the open question, whether the review was enough, is answered in solution.md: it was); copied below as built
- [x] Manual (`wiki/manual/`) has nothing to change; `wiki/system/testing.md`, `CLAUDE.md` and `wiki/log.md` updated
- [x] No leftovers: `@axe-core/playwright` is removed, an unused `goto` import in two tests is removed
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` pass; the build ran in every browser test run
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none added

## Requirements as built

### TECH-029-R1 Less repeated work in the tests

The browser tests do the same checks with less repeated work: axe runs in the page, the parent is chosen in the admin cookie, shared code is tested on one card in full, and tests of one state are merged. The findings are in `solution.md`; every requirement keeps a test named after it.

### TECH-029-R2 Inside the budget

322.9 s locally (budget 350 s, raised from 330 s by the user, see Notes); 361.2 s in CI (limit 455 s, 20.6 % under). `ci.yml` is unchanged; `SUITE_BUDGET_MS` in `scripts/test-time-limits.mjs` was raised from 330 s to 350 s at the user's request (see Notes).

### TECH-029-R3 Restraint in the instructions

`CLAUDE.md` and `wiki/system/testing.md` say that a feature adds as few and as fast browser tests as its requirements allow, and that one that would go over the budget merges or removes tests first and raises no limit in the same pull request.

## Notes

- **The budget was raised to 350 s at the user's request (2026-11-16),** after the suite had been taken down to 322.9 s under the first budget of 330 s, to leave about 27 s of room instead of 7 s. `SUITE_BUDGET_MS` (and its unit test), `wiki/system/testing.md` and the card's R2 say 350 s; the limit in `ci.yml` (455 s) is unchanged. This is the one exception to "no limit is raised in the same pull request": the user decided it, and the suite was inside the old budget without it.
- **Parallel workers were not needed** and would not change the measured total (see solution.md).
