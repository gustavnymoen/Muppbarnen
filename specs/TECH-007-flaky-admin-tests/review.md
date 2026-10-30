---
type: Review
title: "TECH-007 Flaky admin tests: review"
description: "The code review of Short name of the feature: findings, decisions and result."
feature: TECH-007
---

# Code review of TECH-007

**Result:** Passed
**Date:** 2026-10-29, review run 1
**Summary:** The `Home` failure was a real bug in `ListPicker` (`onPointerEnter` on a resting pointer overrode the keyboard); `onPointerMove` fixes it and the test is unchanged. The `MUPP-003-R5` wait is reasonable but not confirmed, as the failure was never reproduced locally.
**Security:** Passed. No sign-in, API, database or personal-data code is touched; `/security-review` not needed.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `verification.md` Definition of Done: boxes for CI and Live tests are open, and the `MUPP-003-R5` cause is only inferred. **Done:** noted in `verification.md`; the boxes are checked after CI and the deploy.

## Suggestions

- `app/components/ListPicker.tsx:206`: `scrollIntoView` under a resting pointer could fire a synthetic pointer move in long lists. **Done:** left as it is; if it shows up, ignore moves where the position has not changed.
- `tests/MUPP-003-admin-page.spec.ts:391`: if `MUPP-003-R5` fails in CI again, wait for `toHaveTitle`. **Done:** left as it is.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
