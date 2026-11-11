---
type: Review
title: "MUPP-062 Wish rows on the Secret Santa match page: review"
description: "The code review of the wish rows on the match page and the bold labels: findings, decisions and result."
feature: MUPP-062
---

# Code review of MUPP-062

**Result:** Passed
**Date:** 2026-11-11, review run 1
**Summary:** The match page reuses the children's `WishRow` (usable without claiming, with a `roomy` option) instead of a copy; the labels are bold and each requirement has a test. The own list and the admin lists are untouched. No must-fix findings.
**Security:** The security points passed: no route, action, query or data change; the match data is read as before and `webLink` still filters the address (tested with a `javascript:` address). `/security-review` not needed (no route, action, query or data change).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/WishList.tsx` The description paragraph was formatted differently from the size line. **Done:** wrapped in `( … )` like the size line.
- `app/secret-santa/min-sida/matchning/page.tsx` An extra blank line at the end of the file, left by the removed `WishCard`. **Done:** removed.
- `tests/MUPP-042-santa-your-person.spec.ts` The wrapping of a long title on the match page is not tested there. **Done:** recorded in `verification.md` that it comes from the shared row, which the children's list tests check.

## Suggestions

- `claiming?` plus `roomy` keeps the claim parts out of the read-only row without a second component; if a third variant appears, make the claim part a slot. **Done:** left as it is.
- A long title keeps the small text in a roomy row. **Done:** left as the children's list does, and written in `verification.md`.

## Outside the change

- `WishDetails` (own list and admin lists) still shows its labels without bold; the card puts them out of scope, and the own list may get the same rows in a later card. Not added to the board.
- The browser suite is over its time budget with and without this change (TECH-019).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
