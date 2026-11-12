---
type: Solution
title: "TECH-019 Test suite budget: solution"
description: "How the time limits of the browser tests are set and kept by a failing check in CI, and why the axe check no longer sees the toast."
feature: TECH-019
card: "#160"
depends_on: [TECH-018]
---

# TECH-019 Test suite budget: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 160`.

## Data

None.

## Interface

None for visitors. For the developer:

- `scripts/test-time-limits.mjs`: the limits (`TEST_BUDGET_MS` 8 s, `SUITE_BUDGET_MS` 330 s) and `checkTimes(report, limits)`, which reads Playwright's JSON report and says whether the total and every test are within them. `npm run test:time` (`scripts/test-time.mjs`) uses it too, so the local numbers and the CI check agree.
- `scripts/check-test-time.mjs <report.json> [--total-ms N] [--test-ms N]`: the CI step. It prints the total and the five slowest tests and exits 1, naming what went over, when a limit is passed.
- `playwright.config.ts`: in CI the reporter also writes `test-results/report.json`; `.github/workflows/ci.yml` runs the check after `npm run test:local`.
- `tests/helpers.ts`: `expectNoA11yViolations` leaves out `[data-toast]`.

## Decisions

- **The budget follows the suite (decided with the user).** On `main` at `90b3eb9` the suite is 162 browser tests, 327.2 s, seven of them over 5 s (the slowest 7.4 s); TECH-018 had 111 tests in 178 s. The 180 s (and the 210 s first planned) could not be kept without more workers, each with its own database, or without splitting seven large journey tests; for a hobby site for about 20 users that is not worth it. So the limits became 330 s and 8 s, and a failing check in CI keeps them. No test was cut or split.
- **One module for the limits, two users.** The limits and the comparison live in `scripts/test-time-limits.mjs`, so `test:time` (local numbers for `verification.md`) and the CI check cannot disagree. The logic is unit-tested with example reports; the CLI around it only reads the file and prints.
- **CI has its own limits.** CI's computer is slower than the developer's, and the slowest test is only 8 % under 8 s locally, so `ci.yml` passes both `--total-ms` and `--test-ms`. The first values (530 s and 12 s) were provisional and are now set from the first CI run with the JSON report plus 25 %: 363.9 s in total and 7.4 s for the slowest test gave 455 s and 9.3 s (see [Verification](verification.md)).
- **The toast and axe (R4).** `pageAnimationsDone` waits for the animations that exist when it is called. The toast (`app/components/Toaster.tsx`) is shown when a save is answered and fades out in a timer two seconds later, so both its slide-in and its fade-out can start after that wait, and axe then reads the half see-through green band as low contrast (`color-contrast` on `.toast-saved`, PR #206, 2026-11-11). Since the toast is `aria-hidden` and screen readers hear the same through the status lines, the helper leaves `[data-toast]` out; the toast's contrast is still checked when it has settled, in `tests/design.spec.ts` (MUPP-054-R1 R3). The fix is in the helper, so every test that runs axe right after a save has it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (budgets and the check), [Pipeline](../../wiki/system/pipeline.md) (the CI step).

[Specifications](../index.md)
