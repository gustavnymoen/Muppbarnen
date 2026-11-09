---
type: Verification
title: "TECH-018 Test suite at its time budget again: verification"
description: How each requirement of Test suite at its time budget again was checked, the step profile, the test suite before and after, and the requirements as built.
feature: TECH-018
---

# Verification of TECH-018

How each requirement was checked. This is a change to the tests, the test server and the wait after a wrong password; what visitors see is unchanged.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-018-R1 | R1 was relaxed from 170 s to 180 s with the user on 2026-11-09. `npm run test:time` six times on the finished change: 178.3, 177.8, 180.7, 178.4, 179.7 and 176.6 s (before: 203.0 s); five of six are within 180 s, one is 0.7 s over. No test is over 5 s | local | Pass (goal 180 s; one run 0.7 s over, spread about ±2 s) | 2026-11-09 |
| TECH-018-R2 | Unit tests `TECH-018-R2 …` in `lib/login-block.test.ts` (`wrongWait`: 0 only with the setting on **and** a `file:` database, 1000 for Turso, `https:`, no setting and `0`; `checkLogin` with the default wait is answered only after one second, with fake timers) and in `lib/santa-auth.test.ts` (the same for a wrong Secret Santa sign-in, and the try still counts: one row in `login_attempts`). The browser tests of the wrong tries (MUPP-039-R4 R4b, TECH-005-R3, MUPP-003-R1) pass on the test server, which sets `SKIP_LOGIN_WAIT=1`; the sixth wrong try still blocks | local | Pass | 2026-11-09 |
| TECH-018-R3 | `npx playwright test --list` before (121 tests) and after (111): the same 154 requirement IDs in the test names, none missing and none new (script in the notes). Unit tests 196 passed, browser tests 111 passed, none retried (`retries` is 0). The two `>= 900 ms` lines of MUPP-003-R1 R8 and MUPP-009-R1 R5 moved to the unit test `TECH-018-R2 MUPP-003-R1 R8 MUPP-009-R1 R5 …` | local | Pass | 2026-11-09 |
| TECH-018-R4 | `wiki/system/testing.md` has the shared set-up, the test server's skipped wait, the opt-in trace, and the numbers; `npm run lint:docs` passes | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `wrongWait` and the default wait of `checkLogin` and `checkSantaSignIn` (R2); `npm run test:unit` 196 passed (before 193) | local | Pass | 2026-11-09 |
| Browser tests | The whole suite before and after with `npm run test:time` (R1); the changed tests ran `--repeat-each 10` (the sixth-wrong-password tests, 20 runs), `--repeat-each 3` (MUPP-010, MUPP-016: 60 runs) without a failure | local | Pass, except R1 | 2026-11-09 |
| Smoke test | None needed; the smoke tests are unchanged and ran in every full run | local | Pass | 2026-11-09 |
| Accessibility | No page changes. axe still runs in every state it ran in before (the merged tests keep one check per state); `design.spec.ts` MUPP-001 runs it at both widths | local | Pass | 2026-11-09 |
| Security | `/security-review` on the change to `lib/login-block.ts`, `lib/santa-auth.ts`, `scripts/test-server.mjs`: see [review.md](review.md) | local | See review | |
| Code review | [review.md](review.md) | local | See review | |

## The step profile

Before the work, `main` at `1acb7d2`, 121 tests, 203.0 s. A small reporter outside the repo summed the time of every step at the top level of the tests, by kind and place in the helpers (`tests/helpers.ts`):

| Time | Count | What |
|---|---|---|
| 33.1 s | 182 | `goto`: waiting until React shows the streamed page (about 0.18 s per load) |
| 21.5 s | 115 | `animationsDone`: waiting for animations to end |
| 21.5 s | 307 | `settledBox`: two reads of a box 50 ms apart |
| 16.0 s | 143 | `pageAnimationsDone` before axe |
| 6.8 s | 182 | `page.goto` itself |
| about 20 s | 121 | Playwright's own set-up of every test's context and page (0.15 to 0.2 s each) |
| 3.4 s + 3.2 s | 118 | before and after hooks (cleaning the data) |

Per file: `design.spec.ts` 43.6 s (24 tests), MUPP-003 28.9 s (14), MUPP-039 14.7 s (6), MUPP-010 11.6 s, MUPP-022 11.1 s, MUPP-016 10.6 s, MUPP-017 7.8 s, MUPP-040 7.6 s. What was cut, with the measured effect: no wait after a wrong password (about 8 s, of which the Santa wait alone about 4 s), Secret Santa tests signed in by cookie and merged (about 11 s), `settledBox` in the page (about 3 s), trace off (about 4 s), the sixth-wrong-password tests on one page (about 5 s), the other merges (about 1 s each). What is left is mostly what the site does: the 300 ms reveal after every page load and the animations.

## Test suite

`npm run test:time` before (`main` at `1acb7d2`) and after the change, each on the development Mac, one run at a time (the Mac was also used for other things; the spread between runs is about ±2 s).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 193 unit + 121 browser | 203.0 s | 4.6 s |
| After, run 1 | 196 unit + 111 browser | 178.3 s | 4.4 s |
| After, run 2 | 196 unit + 111 browser | 177.8 s | |
| After, run 3 | 196 unit + 111 browser | 180.7 s | |
| After, runs 4 to 6 | 196 unit + 111 browser | 178.4 s, 179.7 s, 176.6 s | |

The browser tests are 10 fewer (merged, none dropped) and about 25 s (12 %) shorter. The unit tests take 0.4 s.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the budgets in `wiki/system/testing.md` in five runs of six (one 0.7 s over); no test over 5 s; the changed tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility: not applicable to visitors (no page changes); axe still runs on every state
- [x] Requirements in the card match what was built (R2 widened and R1 relaxed to 180 s, with the user), no open questions left
- [x] Manual (`wiki/manual/`) has nothing to change; `wiki/system/testing.md`, `site-password.md`, `secret-santa-entrance.md` and `wiki/log.md` updated
- [x] No leftovers: nothing made unused; the step reporters used for measuring are outside the repo
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass (run again after the review)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none added (see Notes)

## Requirements as built

- **R1** The browser tests take at most 180 s in total locally, and no single test more than 5 s (three runs in a row; relaxed from 170 s with the user).
- **R2** The local test server skips the one-second wait after a wrong site, admin or Secret Santa password, only with a local database file; a deployed site always waits; the try still counts; unit tests show the guard and the real wait.
- **R3** Every requirement keeps a test named after it (154 IDs before and after); all tests pass, none retried.
- **R4** `wiki/system/testing.md` says what keeps the suite fast and the numbers.

## Notes

- **R1 was relaxed from 170 s to 180 s with the user (2026-11-09).** The suite went from 203.0 s to about 178 s; going lower needs more than one worker, a lower `expect.timeout` or reduced motion, which the card leaves out. The six runs are 176.6 to 180.7 s; the one over 180 s is 0.7 s over.
- **The comparison of requirement IDs** reads the titles of `npx playwright test --list` before and after: each title's IDs are expanded (`MUPP-004-R2 R3` is `MUPP-004-R2` and `MUPP-004-R3`) and the two sets are compared: 154 and 154, none missing.
- **A flaky step was found and removed.** A first version of `settledBox` compared two reads two frames apart and failed once in MUPP-016-R3 R4; the 50 ms between reads was put back, then 60 runs of that file passed.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
