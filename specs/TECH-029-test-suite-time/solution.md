---
type: Solution
title: "TECH-029 Test suite time: solution"
description: "How the browser tests were brought inside their time budget by removing repeated work, and the rules that keep new tests cheap."
feature: TECH-029
card: "#270"
depends_on: [TECH-019, TECH-018]
---

# TECH-029 Test suite time: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 270`.

## Data

None.

## Interface

Nothing a visitor sees. For the developer: the browser tests and their helpers, `CLAUDE.md` and `wiki/system/testing.md`.

## The review (R1)

The suite was 185 browser tests and 364.3 s of test time (`main` at `7ec9062`). A profile by file and by test, and a step measurement of the helpers, showed that the time is not in a few slow tests but in what every test repeats. The findings, and what was done with each:

| Finding | Cost | Done |
|---|---|---|
| **axe was slow.** `@axe-core/playwright` opens an extra page for every check (`analyze()` calls `newPage()`). 188 checks at 130–270 ms; axe itself, run in the page, takes 30–60 ms | about 16 s | `expectNoA11yViolations` runs `axe.run` in the page (the `axe-core` package, injected once per page), with the same rules (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) and the same exclusion of the toast. `@axe-core/playwright` is replaced by `axe-core` in `package.json` |
| **Signing in as a parent loaded `/admin` and clicked the parent** in the list, in 45 tests, and 11 of them left to another page at once | about 11 s | The choice of parent is part of the signed cookie (`createAdminSession(secret, parentId, expires)`), so `adminSignIn` sets it with the parent's id (`parentIdOf` in `tests/family-db.ts`) and, with a `path`, opens that page directly. The page's own choice is still tested in MUPP-003 |
| **The same behaviour on two cards that share the code.** The open and close motion (`transition.ts`) and the focus rule of MUPP-032 were run in full on the card with several kids and again on the Christmas card (MUPP-016, MUPP-022) | about 8 s | MUPP-016-R3 R4 is one test (full run on the first card, one open and close on the Christmas card, one page load); MUPP-016-R5 the same; MUPP-022-R2 runs on the first card only and MUPP-022-R1 stops after its first part on the Christmas card. The Christmas card keeps a test of its own for what is its own (its tile, `Öppna Vera`) |
| **Tests of one state that were two tests**, each with its own set-up and sign-in: MUPP-072 (a form save and a deletion, both on the wish list), MUPP-042-R1 and R3 (a group that is only preparing), MUPP-051-R2 and R7 (the Secret Santa tab of one group) | about 3 s | Merged into one test each, named after every requirement it checks |
| **A check made twice.** MUPP-017-R4 repeated "Tillbaka does what Stäng does" (focus, marks gone), which MUPP-015 checks; MUPP-003-R8 added a wish through the form just to have a row to measure (the form is tested in MUPP-045) | about 1.5 s | The repeat in MUPP-017-R4 is removed; the wish is made in the database |
| **MUPP-072 held every action 1.5 s** to look at the busy state, which shows after 300 ms | about 1 s | 1 s |

The seconds are estimates from the difference between whole-suite runs (364.3, 340.5, 333.2 and 322.9 s), not measured per change. Total: 364.3 s before, 322.9 s after, 185 and 179 tests. Every requirement that had a test still has one named after it.

**Not done, and why:**

- **Merging the many small tests** (a test of 0.3–1 s): a merge only saves what the tests share (the sign-in and the page load, about 0.5 s). Most small tests have different data or a different signed-in person, so a merge saves nothing or little. Left as they are.
- **The look checks of `design.spec.ts` against the feature tests.** Read for the Secret Santa status, the member grid, the admin and the claim dialogs: they check sizes, colours and fit, and the feature tests the behaviour; the overlap that exists (a state opened twice) is in the same order of seconds as the cost of moving a check between files, so it was not moved.
- **The 300 ms reveal after every page load** (React's Suspense throttle, about 33 s over the suite) is how the site streams its pages; changing it would change what the site does.
- **Parallel workers** (step two on the card): they do not shorten the total time of the tests that `npm run test:time` and the CI limit measure (that is the sum of the tests' own times), they need a database each (TECH-027), and the review was enough. Not needed now.

## Decisions

- **axe in the page, not through `@axe-core/playwright`.** The result is the same data (`violations`), checked against the same rules; only the extra page of the wrapper is gone. The package is replaced, not added to: `axe-core` was already installed as its dependency.
- **The parent in the cookie.** The cookie is HMAC-signed with the made-up test key (`ADMIN_SESSION_SECRET` of the test server), the same as `santaSignIn` does for Secret Santa. A parent who does not exist still makes a valid cookie, which the page refuses (MUPP-003 checks that).
- **The budget is 350 s** (raised from 330 s by the user after the work; see verification.md, Notes). The suite is at 322.9 s.
- **One card gets the whole test, the other the part that is its own.** The tests say so in a comment, so the next reader does not add the repeat back.
- **The rules for new tests** are in `CLAUDE.md` (Tests) and `wiki/system/testing.md` (Browser tests, "Be sparing"): a rule is a unit test plus one browser test, a new check joins an existing journey, set-up is shared, a thing is checked once, a feature records the seconds its tests added, and a feature that would go over the budget merges or removes tests first. No limit is raised in the same pull request.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md); builds on [TECH-018](../TECH-018-test-suite-room-again/solution.md) and [TECH-019](../TECH-019-test-suite-budget/solution.md).

[Specifications](../index.md)
