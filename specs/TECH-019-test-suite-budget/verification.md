---
type: Verification
title: "TECH-019 Test suite budget: verification"
description: How each requirement of Test suite budget was checked, the test suite before and after, and the requirements as built.
feature: TECH-019
---

# Verification of TECH-019

How each requirement was checked. This is a change to the test tooling; what visitors see is unchanged.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-019-R1 | `npm run test:time` on `main` at `90b3eb9` (clean worktree, own `HOME`): 162 browser tests, 327.2 s, seven over 5 s (7.4, 6.9, 6.7, 6.0, 5.6, 5.2, 5.1 s). Step profile: not made again; TECH-018's profile ([verification](../TECH-018-test-suite-room-again/verification.md)) still describes where the time goes (page loads, animation waits, box reads, per-test set-up), and the growth since is 51 more tests at about 2 s | local | Pass (profile not repeated) | 2026-11-12 |
| TECH-019-R2 | The card's limits changed with the user from 210 s and 5 s to 330 s and 8 s (the 210 s needed more workers; the tests over 5 s are large journey tests). `npm run test:time` on the branch: 329.3 s, slowest 7.4 s. `wiki/system/testing.md` says 330 s and 8 s. No test was changed, cut or split | local | Pass, but 0.7 s under the 330 s, inside the spread of about ±2 s between runs | 2026-11-12 |
| TECH-019-R3 | Unit tests `TECH-019-R3 …` in `scripts/test-time-limits.test.ts` (6: nested suites and skipped tests, within the limits, a test over the per-test limit, a total over the limit, attempts summed, the default budget exactly on and one millisecond over). The script run by hand on a made-up report: exit 1 naming a 9 s test over 8 s, exit 0 with `--test-ms 10000`, exit 2 without a file. The CI step is in `ci.yml` and the JSON report in `playwright.config.ts`; run in CI on pull request 224: 166 tests, 363.9 s, slowest 7.4 s, within the CI limits 455 s and 9.3 s (the first CI run plus 25 %) | local and CI | Pass | 2026-11-12 |
| TECH-019-R4 | Cause found (see [solution](solution.md)) and fixed in `expectNoA11yViolations`, which leaves out `[data-toast]`; the toast's contrast is still checked settled in `design.spec.ts` (MUPP-054-R1 R3). `MUPP-051-R1 R2` ran 20 times in a row with six busy processes: 20 passed with the fix, and also 20 passed without it, so the failure seen in CI on 2026-11-11 **did not reproduce locally** (as the card said) and the fix is by reasoning, not shown by a failing run. Other tests that run axe right after a save use the same helper, so they have the same fix | local | Pass (fix not shown to be needed by a failing run) | 2026-11-12 |
| TECH-019-R5 | `npm run lint`, `lint:docs`, `typecheck` pass; `npm run test:time`: 375 unit and 162 browser tests passed. `npm run build`: run by the test server's build in every `test:local` (it printed the known Turbopack warning on `lib/mail-sink.ts`, present on `main`), not run as a separate command | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `scripts/test-time-limits.test.ts` (R3); `npm run test:unit` 375 passed (before 369) | local | Pass | 2026-11-12 |
| Browser tests | The whole suite before and after with `npm run test:time` (R1, R2); `MUPP-051-R1 R2` 20 times under load, with and without the fix (R4) | local | Pass | 2026-11-12 |
| Smoke test, accessibility checklist | Not applicable: no visible change | | | |
| Security | Not needed: no sign-in, route, action or query changed | | | |
| Code review | [review.md](review.md) | local | See review | |

## Test suite

`npm run test:time` before (`main` at `90b3eb9`) and after, on the development Mac, one run at a time (own `HOME`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 369 unit + 162 browser | 327.2 s | 7.4 s |
| After | 375 unit + 162 browser | 329.3 s | 7.4 s |

No browser test changed, so the 2 s difference is the spread between runs. The suite is at its new budget (330 s) with no room: the next feature that adds tests will go over, and the check in CI (with its own limit) is what keeps it from growing unnoticed.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the first CI run of the new check passed: 166 tests, 363.9 s, slowest 7.4 s); `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the budgets in `wiki/system/testing.md` (329.3 s of 330 s, 7.4 s of 8 s), total time grown by 0.6 % (the tests are unchanged)
- [x] Deployed, and the smoke tests pass against production (Live tests): passed on the merge commit 7c5f96e (2026-11-12)
- [x] Accessibility: not applicable to visitors (no visible change); axe still runs in every state it ran in
- [x] Requirements in the card match what was built, no open questions left; copied below as built; the CI limits were set from the first CI run (455 s, 9.3 s)
- [x] Manual (`wiki/manual/`) has nothing to change; `wiki/system/testing.md`, `pipeline.md` and `wiki/log.md` updated
- [x] No leftovers: the three old constants and the test-listing function in `test-time.mjs` moved to the shared module; nothing else made unused
- [x] Clean code: `npm run lint`, `lint:docs` and `typecheck` pass; the build ran in every `test:local`
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none added

## Requirements as built

### TECH-019-R1 The time is measured

On `main` at `90b3eb9`: 162 browser tests, 327.2 s, seven over 5 s, with the slowest tests named; no step profile (changed on the card: it was meant to guide cuts, and no tests were cut).

### TECH-019-R2 The suite is within its budget

At most 330 s in total and 8 s per test (changed with the user from 210 s and 5 s); measured 329.3 s and 7.4 s. No test was changed.

### TECH-019-R3 The budget is kept by a failing check

`scripts/check-test-time.mjs` reads Playwright's JSON report in CI and fails the job, naming the limit and the slowest tests, when the total (CI limit set in `ci.yml`: 455 s, the first CI run's 363.9 s plus 25 %) or one test (CI limit 9.3 s, the slowest 7.4 s plus 25 %) is over. The limits and the comparison are in `scripts/test-time-limits.mjs`, unit-tested.

### TECH-019-R4 The toast does not make axe flaky

`expectNoA11yViolations` leaves out the aria-hidden toast; its contrast is checked settled in `design.spec.ts`.

### TECH-019-R5 The site behaves as before

Nothing the site does changed.

## Notes

- **The limits changed with the user (2026-11-12)** after the measurement: 330 s instead of 210 s, 8 s instead of 5 s; the card was updated first.
- **No margin in the budget:** 329.3 s of 330 s. A local `npm run test:time` may mark the total as over by a second or two; that is noise, not a cause to cut.
- **CI wall time:** the last CI run took 7.1 minutes for `npm run test:local` alone; the job's own limits in `wiki/system/testing.md` (CI at most 8 min) are not met, and the job's `timeout-minutes` is 15. Not part of this card.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
