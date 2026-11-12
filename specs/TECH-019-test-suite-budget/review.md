---
type: Review
title: "TECH-019 Test suite budget: review"
description: "The code review of Test suite budget: findings, decisions and result."
feature: TECH-019
---

# Code review of TECH-019

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** The check is small and correct; the shared module, the JSON report and the CI step fit together, and the unit tests cover the comparison logic. No must-fix findings.
**Security:** Passed. No sign-in, route, action, query or personal-data change, no secrets or real data added. `/security-review`: not needed (nothing it covers was touched).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `.github/workflows/ci.yml:55` The per-test limit in CI was the local 8 s, with the slowest test only 8 % under it, so CI's slower machine would likely fail it. **Done:** CI passes `--test-ms 12000` next to `--total-ms`, both provisional until the first CI run with the report; the card, `testing.md`, `solution.md` and `verification.md` say so.
- `verification.md` (R1) The card asked for a step profile that was not made. **Done:** the requirement was changed on the card (the profile was meant to guide cuts, and no tests were cut); `verification.md` says so.
- `verification.md` (R2) The suite is 329.3 s against 330 s, inside the run-to-run spread. **Done:** written in Notes in `verification.md`; the CI check has its own, higher limits, so only a local `npm run test:time` can mark it over by a second or two.

## Suggestions

- `tests/helpers.ts:197` `.exclude("[data-toast]")` leaves the toast out of every axe check; the settled contrast is checked in `design.spec.ts` (success toast) and `MUPP-003-admin-page.spec.ts` (the red error toast). **Done:** checked, both toasts are covered.
- `verification.md` (R4) The fix passed 20 of 20 both with and without it, so it rests on the cause found by reading. **Done:** left as it is and recorded; the card is reopened if the CI failure shows up again.
- `scripts/test-time-limits.test.ts` The CLI (`check-test-time.mjs`) has no unit test. **Done:** left: it was run by hand with made-up reports (exit 0, 1 and 2), recorded in `verification.md`.

## Outside the change

- `scripts/test-time.mjs` still holds `UNIT_BUDGET_MS`, so the budgets live in two places. Left: the unit budget is not checked in CI.
