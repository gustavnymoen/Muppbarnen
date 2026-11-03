---
type: Solution
title: "TECH-014 Test suite over its time budget: solution"
description: "How the browser tests were brought back under their time budget: the admin cookie reused, axe once per state, and waits that don't sit in Playwright's retry backoff."
feature: TECH-014
card: "#98"
depends_on: [MUPP-003, MUPP-016, MUPP-022]
---

# TECH-014 Test suite over its time budget: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 98`.

## Data

None.

## Interface

None for visitors: only test code changes.

- `tests/global-setup.ts`: against the local test server it also signs in on `/admin` through the form once, without a parent, and saves the cookies in `playwright/.auth/admin.json` (`adminSessionFile` in `tests/site-session.ts`, ignored by Git).
- `tests/helpers.ts`:
  - `adminSignIn(page, parent?)` adds the saved cookie instead of filling in the password, then chooses the parent on the page as before.
  - `goto(page, path)` opens a page and waits until its content is shown.
  - `pageAnimationsDone(page)` waits for every animation on the page. `expectNoA11yViolations` uses it too.
- Every `page.goto` in the tests is `goto(page, …)`, also on the password page. The exceptions are the smoke tests, which are unchanged, and the WebKit test.
- MUPP-016-R3 R4 runs axe once on the closed state instead of once per closer.
- MUPP-016 and MUPP-022 call `pageAnimationsDone` before checking that the closing copy is gone.
- The MUPP-003 cookie test, which took 5.2 s, is split in two: `MUPP-003-R1 a changed, expired or foreign cookie is refused` and `MUPP-003-R1 R2 a signed cookie is accepted, and a removed parent drops the choice`.
- The two MUPP-022-R1 tests per card (the copy shrinks and is removed; a cut-short copy doesn't stay) are one test per card.

## Decisions

- **The cost was waiting, not work.** A step-by-step profile of the suite (a small reporter that logged every step over 250 ms) showed the same durations over and over: about 790, 300 and 80 ms. They match Playwright's retry backoff. An `expect`, or an action whose element isn't ready, is checked at once and then again after 20, 50, 100, 100 and 500 ms, so at 0, 20, 70, 170, 270 and 770 ms (playwright-core 1.64.1). Something ready after 300 ms is seen at 770 ms. In one run, 77 steps waited 700 ms or more, 63 s in all.
- **Two causes, two waits.**
  - **Animations:** the closing copy is removed when its 300 ms animation ends. `pageAnimationsDone` waits for the animations' own `finished` promises, so the `expect` after it passes at once.
  - **Streamed pages:** every page renders its content inside `<Suspense fallback={null}>`, and React shows the streamed content about 300 ms after the page has loaded. `goto` waits with `page.waitForFunction`, which checks on every animation frame instead of backing off, until `[data-page]` (the `Page` shell of every page) is visible, or, on the password page, which has no shell, its form.
  
  Neither is a fixed wait: both wait for what the page actually does. Both levers were added to the card with the user after measuring.
- **The admin cookie is shared without a parent.** Each test makes its own parents (`clearFamily` before every test), so their ids differ and can't be in a saved cookie. `adminSignIn` still chooses the parent on the page. The cookie isn't tied to an address, so the per-test `x-real-ip` (`testIp`) still applies to wrong passwords and writes. Reusing the cookie alone saved little: the sign-in form costs one request.
- **Considered and dropped:** lowering `expect.timeout` under 2.5 s, which makes Playwright drop its 500 ms backoff step. It would speed up every wait, but it would also make slow runs fail.
- **Splitting and merging:** the MUPP-003 cookie test (5.2 s) is split in two. The two MUPP-022-R1 tests per card, which opened the same view in the same state, are merged into one per card. That gives 104 tests (from 105), with the same 101 requirement IDs in their names.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (the admin password, waiting without the backoff).

[Specifications](../index.md)
