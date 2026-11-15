---
type: Solution
title: "TECH-028 Date-proof browser tests: solution"
description: "How the local test server and the browser tests share one fixed date, so the order of the cards no longer depends on the season."
feature: TECH-028
card: "#263"
depends_on: [TECH-018]
---

# TECH-028 Date-proof browser tests: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 263`.

## Data

None.

## Interface

- `lib/deck.ts`: `clockNow()` is the default `now` of `swedishToday`. It gives the date in `TEST_TODAY` (ÅÅÅÅ-MM-DD, at noon UTC) only when the database is a local file, like `wrongWait` in `lib/login-block.ts`, so a deployed site always follows the clock.
- `scripts/test-server.mjs` and `playwright.config.ts` set `TEST_TODAY` to `2026-06-01` (unless it is already set). Another date is possible, but the tests are written for a date outside December: with `TEST_TODAY` on 2026-12-20 29 tests failed and on 2026-12-26 three, because the Christmas Eve card is part of the deck and the tests count on it being far away.
- `tests/helpers.ts`: `testToday()` is the same date for the tests' own date maths (`dateIn`, `birthdateIn` and the tests that used `swedishToday()`); `tests/family-db.ts` files its draws under that year.

## Decisions

- **A fixed date instead of choosing "safe" days.** Tests used birthdays 10, 20 and 40 days ahead, which after 14 November runs into Christmas Eve, and no choice of days works in the last days of December. One date for the server and the tests removes the whole class of problem. `2026-06-01` has no Christmas Eve, Midsummer or year change within 40 days either way.
- **Only the date is fixed**, not the time: hour-long locks and delays (MUPP-071, MUPP-043) use `Date.now()` and are unaffected.
- **Same guard as the login wait:** the fixed date works only with a local database file, so setting `TEST_TODAY` on the live site does nothing.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md).

[Specifications](../index.md)
