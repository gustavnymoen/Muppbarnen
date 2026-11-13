---
type: Review
title: "MUPP-071 Secret Santa: nag the match for a list: review"
description: "The code review of the nag button: findings, decisions and result."
feature: MUPP-071
---

# Code review of MUPP-071

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** R1 to R4 are met; no must-fix findings. Three should-fix points and two suggestions were handled in this change.
**Security:** Passed. The server action checks the site cookie, `guardWrite()` and the signed-in member, takes no argument and finds the receiver in the draw; all SQL is parameterised; the mail names only the group. `/security-review` was run on the change: no findings.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/MUPP-071-santa-nag-list.spec.ts` The job call was written out twice. **Done:** one `runJob` helper.
- `lib/santa-nag.test.ts` The test named start and stop but only stopped the draw. **Done:** renamed; start goes through the same `clearListChanges`, tested in `santa-changes.test.ts`.
- `tests/design.spec.ts` "Greyed out" for the locked state was only checked as "icon kept". **Done:** left as it is; the look is waiting for the user's choice (see verification.md) and the words, not the colour, carry the state.

## Suggestions

- `lib/santa-nag.ts` A restored request may belong to a list that got a wish meanwhile. **Done:** one-line comment; the next run drops it.
- `app/api/santa-mails/route.ts` The comment listed three things without commas. **Done:** fixed.

## Outside the change

None.

[Specifications](../index.md)
