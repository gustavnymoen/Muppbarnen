---
type: Review
title: "TECH-009 Settled boxes in the feature tests: review"
description: "The code review of Settled boxes in the feature tests: findings, decisions and result."
feature: TECH-009
---

# Code review of TECH-009

**Result:** Passed
**Date:** 2026-10-30, review run 1
**Summary:** Every box read in the feature tests goes through `settledBox`, compared boxes are read together, and the diff changes only how boxes are read, not what is asserted. Two small points, both fixed.
**Security:** Passed. Tests only, with no sign-in, route, query or personal data. `/security-review`: not needed (tests only).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/MUPP-002-start-page.spec.ts:13` The comment on the plain read of the hidden heading gave a false reason: `settledBox` requires a visible element, but the `sr-only` heading is 1 × 1 px and counts as visible. **Done:** checked (the test passes), and the read now uses `settledBox`; no plain read is left.
- `specs/TECH-009-settled-boxes-in-feature-tests/verification.md` The R3 row gave only one of the two failing runs of `MUPP-010-R4` (9 of 20 and 6 of 20). **Done:** the row gives both.

## Suggestions

- `tests/MUPP-002-start-page.spec.ts` (`before` and `after` of the header), `tests/MUPP-010-compact-admin.spec.ts` (`previousRight`) and `tests/MUPP-012-parent-picker.spec.ts` (`box` and `now`, separated by a resize) are read one after the other on purpose: the test compares a box before and after something happens. **Done:** left as it is.

## Outside the change

- `MUPP-010-R4` (the thumbnail after "Spara bild") flaked under load and has no box read; the cause is not found. It belongs on the board as its own technical task.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
