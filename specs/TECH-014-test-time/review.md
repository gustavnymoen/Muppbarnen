---
type: Review
title: "TECH-014 Test suite over its time budget: review"
description: "The code review of Test suite over its time budget: findings, decisions and result."
feature: TECH-014
---

# Code review of TECH-014

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** The change touches only test code and its documentation, and it does what the card asks: one shared admin sign-in, axe runs once per state, and two event-driven waits that avoid Playwright's retry backoff. The split and merged tests still check everything they did before. `goto` can't hang or pass too early on the pages it is used on.
**Security:** Passed. No site code, sign-in logic, routes or data change. The admin cookie is made with the made-up local password and saved in `playwright/.auth/`, which `.gitignore` covers. It is only written when `runsLocally`, and only local-only tests read it, since every caller of `adminSignIn` sits under `test.skip(!runsLocally)`. `/security-review` is not needed (card): no sign-in, admin, API, server action, query or personal data code changes.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `specs/TECH-014-test-time/verification.md` The R1 criterion "as built" said `specs/` while the card said `specs/TECH-014-*/`, and the diff also adds the task's line to `specs/features.md`, which the workflow requires. **Done:** the card's R1 criterion and the copy in `verification.md` now both name `specs/TECH-014-*/` and the task's line in `specs/features.md`.

## Suggestions

- `tests/helpers.ts` (`goto`) relies on React keeping not-yet-shown Suspense content in a hidden element, and on `[data-page]` coming before any form. A visible form before the shell, or a shell outside Suspense, would end the wait too early. **Done:** a comment on `goto` now names the assumption. It can't hang: `waitForFunction` is bounded by the test timeout.
- `tests/helpers.ts` (`pageAnimationsDone`) uses `allSettled` where `expectNoA11yViolations` used `Promise.all`. That is right: a cancelled animation (MUPP-022-R1) rejects `finished`. It also means an endless animation would block until the test timeout; the site has none. **Done:** left as it is.
- `specs/TECH-014-test-time/verification.md` The margin of 2 to 4 s under 165 s is recorded. Most of the remaining waiting is the 300 ms reveal per `goto`, so counting `goto` calls per test is a cheap first lever when the suite goes over again. **Done:** left as a note in `verification.md`.

## Outside the change

None.

[Specifications](../index.md)
