---
type: Solution
title: "TECH-018 Test suite at its time budget again: solution"
description: "How the browser tests were cut from 203 s to about 178 s: no wait after a wrong password on the test server, Secret Santa tests signed in by cookie, boxes read in the page, tests merged by journey."
feature: TECH-018
card: "#146"
depends_on: [TECH-014, TECH-015, MUPP-039, MUPP-040]
---

# TECH-018 Test suite at its time budget again: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 146`.

## Data

None.

## Interface

None for visitors. Code for the test server and the tests:

- **`wrongWait()` in `lib/login-block.ts`** gives the wait after a wrong password: 1000 ms, or 0 when the environment variable `SKIP_LOGIN_WAIT` is `1` **and** `TURSO_DATABASE_URL` is a `file:` address. `checkLogin` (site and admin passwords) and `checkSantaSignIn` (Secret Santa) use it as the default of their `wait` parameter, so the unit tests that pass `0` are unchanged. `scripts/test-server.mjs` sets `SKIP_LOGIN_WAIT=1`; nothing else does, and a deployed site has a Turso address, so it ignores the variable.
- **`tests/santa.ts`** holds what the Secret Santa tests share: `santaSignIn(page, personId)` (the signed cookie, set directly), `openSignInForm`, `pickName` and `sendPhone` (the form, for the tests of the sign-in itself). `personOfMember` in `tests/family-db.ts` gives the person id the cookie holds.
- **`settledBox`** in `tests/helpers.ts` reads the box twice in the page, 50 ms apart, in one round trip.
- **`playwright.config.ts`:** traces are recorded only with `TRACE=1`; CI sets it.

Merged tests (the requirement IDs in the names are the same; browser tests 121 → 111):

- **MUPP-039:** R5 and R6 are one test (sign in once, then the cookie, "Byt person", a changed id and a removed person); the "other writings" test signs in three times on one entrance without reloading.
- **MUPP-040:** R1 and R2 are one test (add, then edit and delete the same wish); R3's two checks are one test (two families, then a wish id of someone else); every test is signed in by cookie.
- **MUPP-005:** the rows and the claiming are one test on one list.
- **MUPP-014:** the card with several kids and Christmas Eve are one test.
- **MUPP-037:** the card with several kids and the Christmas card are one test.
- **MUPP-026:** both checks on `/design` are one test.
- **MUPP-010:** the folded Hantera page and the unfolding of its cards are one test.
- **MUPP-004:** the empty deck and the birthday on Christmas Eve are one test.
- **MUPP-001 (design.spec.ts):** `/design` on a phone and on a desktop are one test, resized.
- **MUPP-003-R1 and TECH-005-R3:** the sixth wrong password: six tries one after the other on one page instead of six pages at once.

## Decisions

- **Where the time went** (a step profile of the suite before, see `verification.md`): 182 page loads cost about 33 s of waiting for the page to show (`goto`), 115 waits for animations to end about 21 s, 143 waits before axe about 16 s, 307 box reads about 21 s, and each test's browser context and page about 0.2 s. The animations and the 300 ms reveal are what the site does; fewer loads, fewer tests and cheaper reads are what can be cut.
- **The wait is skipped by the test server, and only there (R2).** Two things must both be true: the variable is set and the database is a local file. A forgotten variable on Vercel therefore does nothing. The unit tests show the rule (`wrongWait`) and that, without the setting, a wrong try is answered only after one second (fake timer; the database is real). The two browser tests that measured the second (`>= 900 ms` in MUPP-003 and MUPP-009) lost that line; the same requirement is checked by the unit test, named with the same requirement IDs.
- **The skip was widened to the site and admin passwords (decided with the user, 2026-11-09).** The card first said only Secret Santa. That gave about 4 s; the sixth-wrong-password tests and the wrong-password checks of MUPP-003 and MUPP-009 gave about 4 s more, so the same rule now serves all three sign-ins.
- **Signed in by cookie, not by the form, in the tests that are not about signing in.** A form sign-in costs a page load, two clicks and the server's work (about 0.8 s). The cookie is the one the site sets, signed with the test server's made-up key. MUPP-039 still signs in through the form, since that is what it tests.
- **`settledBox` reads in the page, but 50 ms apart.** A version that compared two reads two frames apart was faster (about 4 s) but failed once in MUPP-016-R3 R4 (a staggered entrance stood still for two frames before moving), so the 50 ms of the old version stays; only the round trips went (one `evaluate` instead of two `boundingBox` calls and the poll's retries).
- **Traces are opt-in (`TRACE=1`).** Recording a trace on every test cost about 4 s; they are only read after a failure, so CI still records them and locally they are asked for.
- **Not done:** more than one worker and a database per worker, lowering `expect.timeout`, reduced motion for the tests that are not about motion (the card's scope and TECH-015), and merging the two per-width tests of `design.spec.ts` for MUPP-014 (3.0 s each, together over the 5 s budget for a test).
- **The goal of 170 s was not reached** (about 178 s, six runs) and was relaxed to 180 s with the user. What the card could do without the things above is done; see `verification.md` for the numbers and the open decision.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (what keeps the suite fast), [Site password](../../wiki/system/site-password.md) and [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md) (the wait on the test server).

[Specifications](../index.md)
