---
type: Solution
title: "TECH-008 Flaky box measurements: solution"
description: "How the box measurements in the design tests were made reliable with one helper that reads a box only when it has settled."
feature: TECH-008
card: "#46"
depends_on: [TECH-006, TECH-007]
---

# TECH-008 Flaky box measurements: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 46`.

## Data

None.

## Interface

None for visitors. In the tests: `settledBox(locator)` in `tests/helpers.ts` returns an element's bounding box once it is visible and two reads in a row give the same box. Every `boundingBox()` in `tests/design.spec.ts` uses it.

## Decisions

- **The `null` in `TECH-006-R4` is a test problem.** Under CPU load (12 busy processes on 10 cores) it failed 2 of 20 runs at the last measurement, the manage page's `row` right after `animationsDone(row)`: the row is found, the page then re-renders it, and `boundingBox()` returns `null` for the detached element. The page is not wrong.
- **The 43.99 px in `MUPP-003-R8` did not reproduce** (20 of 20 under the same load). A height a hair under 44 for a button of fixed size points to a read during an enter animation (a scale transform); this is inferred from the CI report, not observed. If it is a layout bug it will show up again with `settledBox` in place, since the box is then stable and still short.
- **One helper instead of a wait before each read.** `animationsDone` only covers animations and not a re-render, and the `!` after `boundingBox()` hid the `null`. Two equal reads in a row cover the animation, the re-render and a layout that moves; a `null` or a moving box is read again until the test's timeout.
- **`--repeat-each` needs a fresh login block.** `MUPP-003-R8` types a wrong password on purpose and five wrong passwords block the address (`lib/login-block.ts`), so after five runs on one test server every run fails at the sign-in. The runs for this card were made in batches of four, emptying `login_attempts` and `login_blocks` of the test database between them.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (how to measure boxes).

[Specifications](../index.md)
