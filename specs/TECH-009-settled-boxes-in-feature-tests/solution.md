---
type: Solution
title: "TECH-009 Settled boxes in the feature tests: solution"
description: "How the box measurements in the feature tests were made reliable by reading every box with settledBox."
feature: TECH-009
card: "#47"
depends_on: [TECH-008]
---

# TECH-009 Settled boxes in the feature tests: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 47`.

## Data

None.

## Interface

None for visitors. In the tests: every `boundingBox()` in `tests/MUPP-002-start-page.spec.ts`, `tests/MUPP-004-birthday-card.spec.ts`, `tests/MUPP-010-compact-admin.spec.ts` and `tests/MUPP-012-parent-picker.spec.ts` now goes through `settledBox` from `tests/helpers.ts` (added by [TECH-008](../TECH-008-flaky-box-measurements/solution.md)). Only how a box is read changed; the assertions are the same.

## Decisions

- **Boxes that are compared are read together.** `field` and `list` in `MUPP-012` and `first` and `second` in `MUPP-004` are read with `Promise.all`, so both boxes are taken in the same moment. The two reads of the card in `MUPP-004` (`y` and `height`) became one `cardBox`.
- **No plain read is left.** The visually hidden heading in `MUPP-002` (`sr-only`, 1 × 1 px) counts as visible to `settledBox`, so it is read like the others.
- **No lint rule against a bare `boundingBox()`.** The rule in [Testing](../../wiki/system/testing.md) and the review are enough (decided on the card).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (how to measure boxes).

[Specifications](../index.md)
