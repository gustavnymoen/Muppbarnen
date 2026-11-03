---
type: Solution
title: "TECH-015 Test suite at its time budget: solution"
description: "How the browser tests got room under their time budget: pages that are loaded once and measured at every width, and tests of one journey merged."
feature: TECH-015
card: "#111"
depends_on: [TECH-014, MUPP-003, MUPP-010, MUPP-015, MUPP-017, MUPP-021, MUPP-006, MUPP-007]
---

# TECH-015 Test suite at its time budget: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 111`.

## Data

None.

## Interface

None for visitors: only test code and documentation change.

Merged tests (the requirement IDs in the names are the same, the number of tests goes from 114 to 100):

- **MUPP-003-R8 widths:** the three tests "every admin page works at 320 / 430 / 1280 px" are one test. Each of the four pages is opened once and measured at the three widths by resizing the window.
- **MUPP-010-R6:** "five kids fit on a phone" and "the unfolded panels and kid pages have no sideways scroll" open each page once and resize between widths.
- **MUPP-003-R1 R2:** the refused-cookie test and the signed-cookie test are one.
- **MUPP-003-R8 keyboard:** the two keyboard journeys are one: the kid's wish list page that the first one ends on is where the second goes on.
- **MUPP-006:** R1 R2 R5 (one list: undo buttons, the dialog, no site session) and R3 R4 (confirming, the reload, a claim someone else removed).
- **MUPP-007:** R3 (the usual dialog, Avbryt only) goes first in the R1 R2 test.
- **MUPP-015:** the birthday card and the Christmas card journeys are one test on one page.
- **MUPP-017-R4:** 320 and 375 px are one test that resizes the window.
- **MUPP-021-R1:** a card with one kid, then one with several kids, in one run through the deck.

## Decisions

- **Where the time goes** (a step profile of 178.0 s, 114 tests, 2026-11-03, saved with the numbers in `verification.md`): `goto` waits about 300 ms for React to show the streamed page, so every page load costs 0.3–0.8 s: 41 of them in MUPP-003 alone (about 30 s over the suite). The 300 ms open and close animations are the next block (about 20 s). Both are real waiting that the site does; only fewer page loads and fewer seeds win time back.
- **Load once, resize, instead of load per width.** Layout checks that differ only by width read computed layout, so resizing the open page gives the same answer as loading it at that width. A test that needs the width at load time (a script that reads `innerWidth`) keeps its own load.
- **Merged tests stay under 5 s.** The per-test budget (R3) rules out merging the slow tests. MUPP-016-R3 R4 (4 s each) and MUPP-014 (4.4 s per size) stay as they are. A merge of the two MUPP-022-R1 tests was tried and dropped: the merged test took 6.0 s, because the view has to be closed again before the next card, so it was slower than the two tests (5.1 s).
- **Every requirement keeps a test named after it.** `npx playwright test --list` before (114 tests) and after (100): the same 124 requirement IDs in the names, none missing.
- **Not done:** lowering `expect.timeout`, parallel workers, or reduced motion for tests that are not about motion, since each changes what the tests check or needs a database per worker (card: out of scope).
- **axe in MUPP-010-R6** now runs once per page, at the last width, where it ran at both widths before. Layout at the other width is still checked for sideways scroll.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (combine by journey, resize instead of reload).

[Specifications](../index.md)
