---
type: Verification
title: "TECH-014 Test suite over its time budget: verification"
description: How each requirement of Test suite over its time budget was checked, the test suite before and after, and the requirements as built.
feature: TECH-014
---

# Verification of TECH-014

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-014-R1 | `git diff --stat main`: only `tests/`, `wiki/`, `specs/TECH-014-test-time/` and the task's line in `specs/features.md` changed. The requirement IDs in the test names from `npx playwright test --list` were compared before (105 tests) and after (104 tests): the same 101 IDs, none missing. `npm run test:unit` and `npm run test:local` pass (two `npm run test:time` runs) | local | Pass | 2026-11-03 |
| TECH-014-R2 | `npm run test:time` twice in a row on the development Mac: "Testernas tid" 163.0 s and 161.1 s, both under 165 s | local | Pass | 2026-11-03 |
| TECH-014-R3 | The same two runs: the slowest tests were 4.3 s and 4.5 s, and nothing was marked "över budget" | local | Pass | 2026-11-03 |
| TECH-014-R4 | Code review ([review.md](review.md)): no `waitForTimeout`, no retries or skips added. The only state shared between tests is the saved sign-in cookies. The new waits (`goto`, `pageAnimationsDone`) live in `tests/helpers.ts`, the admin cookie file next to the site cookie in `tests/site-session.ts`. The sign-in tests (wrong password, refused cookies, blocked address, keyboard) don't call `adminSignIn` and still sign in through the form | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None new; `npm run test:unit`: 137 passed | local | Pass | 2026-11-03 |
| Browser tests | The existing suite; `npm run test:local` passes (104 tests). One test split (MUPP-003-R1 R2 cookies, 5.2 s), two pairs merged (MUPP-022-R1 per card) | local | Pass | 2026-11-03 |
| R1 coverage | `npx playwright test --list` before and after: 101 requirement IDs each, none missing | local | Pass | 2026-11-03 |
| Smoke test | Unchanged (`tests/smoke.spec.ts` is not touched); Preview tests and Live tests run on the pull request and after the merge | preview, live | Not checked yet | 2026-11-03 |
| Accessibility | Not applicable for the live checklist: no page changes. axe still runs on every page and state it ran on before; MUPP-016-R3 R4 runs it once on the closed state, which was checked three times before | local | Pass | 2026-11-03 |
| Security | `/security-review` not needed (card): no site code changes. The admin cookie saved for the tests is made with the made-up local password and lives in `playwright/.auth/`, which Git ignores | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (`main` 3016dbb, card) | 137 unit + 105 browser | 183.7 s (browser) + 0.3 s (unit) | 6.0 s |
| Admin cookie + axe once (measured on the way) | 105 browser | 184.3 s | 5.6 s |
| After, run 1 | 137 unit + 104 browser | 163.0 s (browser) + 0.3 s (unit) | 4.3 s |
| After, run 2 | 137 unit + 104 browser | 161.1 s (browser) + 0.6 s (unit) | 4.5 s |

The margin below 165 s is small, 2–4 s, and runs on the same code vary by about ±2 s. What remains is mostly real waiting that the site needs and the card keeps: React's 300 ms reveal of each streamed page, and the 300 ms open and close animations. A later feature that adds tests will soon need another look (see `wiki/system/testing.md`, Waiting without the backoff).

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (163.0 s and 161.1 s, slowest 4.5 s), and the changed tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility: not applicable, visitors see no change; axe still runs on every page and state
- [x] Requirements in the card match what was built (the two waits added to Scope with the user), no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual: not applicable, nothing changes for users. System docs (`wiki/system/testing.md`) and `wiki/log.md` updated
- [x] No leftovers: `expectNoA11yViolations` uses `pageAnimationsDone` instead of its own copy of the wait; no commented-out code or debug output
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### TECH-014-R1 The site and the tests' coverage are unchanged

The change only touches test code and its documentation, and every requirement that had a test before still has at least one test named after it that checks the same behaviour.

- **Given** the branch, **when** its diff is read, **then** nothing outside `tests/`, `playwright.config.ts`, `wiki/`, `specs/TECH-014-*/` and the task's line in `specs/features.md` has changed.
- **Given** the suite before and after, **when** the requirement IDs in the test names are listed, **then** every ID in the list before is in the list after.
- **Given** `npm run test:unit` and `npm run test:local`, **when** they run, **then** every test passes.

### TECH-014-R2 The browser tests take under 165 s in total

- **Given** `main` with this change, **when** `npm run test:time` runs on the development Mac, **then** "Testernas tid" is under 165 s, in two runs in a row.

### TECH-014-R3 No test takes over 5 s

- **Given** the same two runs, **when** the five slowest browser tests are listed, **then** none is over 5.0 s and nothing is marked "över budget".

### TECH-014-R4 The quality rules still hold

- **Given** the changed tests, **when** they are read, **then** there are no fixed waits (`waitForTimeout`), no retries or skipped tests added, no shared state between tests other than the reused sign-in cookies, and helpers live in `tests/helpers.ts` (or next to `site-session.ts` for the sign-in) instead of copies.
- **Given** the tests that test admin sign-in itself (wrong password, cookie refused, blocked address, keyboard sign-in), **when** they run, **then** they still start without the admin cookie and sign in through the form.

[Specifications](../index.md)
