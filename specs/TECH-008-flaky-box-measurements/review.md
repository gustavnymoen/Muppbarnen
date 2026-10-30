---
type: Review
title: "TECH-008 Flaky box measurements: review"
description: "The code review of Flaky box measurements: findings, decisions and result."
feature: TECH-008
---

# Code review of TECH-008

**Result:** Passed
**Date:** 2026-10-30, review run 1
**Summary:** A tests and documentation only change: the new `settledBox` helper replaces every bare `boundingBox()!` in `tests/design.spec.ts`, as R1 asks, and R2 is rightly not needed. No must-fix findings.
**Security:** Passed. No sign-in, API route, server action, database or personal-data code is touched, and the test data is made up. `/security-review`: not needed, since no site code changed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/helpers.ts` The reviewer feared that `box`, assigned only inside the `expect.poll` callback, is narrowed to `never` by TypeScript. **Done:** not the case, `npm run typecheck` passes and the callers use `box.width` and `box.height`.
- `specs/features.md`, `verification.md` The card was listed as done and the review as passed before the review had run. **Done:** this report is the review; the Definition of Done boxes that depend on CI and the deploy stay open until the pull request is merged.

## Suggestions

- `tests/design.spec.ts` (the wide-screen `sizes` read) `sizes` was read twice, once for the width and once for the height. **Done:** read once into `wideBox`.
- `tests/helpers.ts` The 50 ms interval had no comment. **Done:** a comment says why two equal reads are enough.

## Outside the change

- Bare `boundingBox()!` reads remain in `MUPP-002-start-page.spec.ts`, `MUPP-004-birthday-card.spec.ts`, `MUPP-010-compact-admin.spec.ts` and `MUPP-012-parent-picker.spec.ts`. **Done:** added to the board as TECH-009 ([#47](https://github.com/gustavnymoen/Muppbarnen/issues/47)); the rule in `wiki/system/testing.md` says it applies to `tests/design.spec.ts`.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
