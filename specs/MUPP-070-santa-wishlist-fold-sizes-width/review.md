---
type: Review
title: "MUPP-070 Sizes dialog narrower, Secret Santa wish list folds out: review"
description: "The code review of the narrower sizes dialog and the folding Secret Santa wish list: findings, decisions and result."
feature: MUPP-070
---

# Code review of MUPP-070

**Result:** Passed
**Date:** 2026-11-13, review run 1
**Summary:** `WishRow` is shared with the own wish list through one optional `actions` prop, and the match's list is untouched. R1–R5 are met and tested; no must-fix finding.
**Security:** Passed. No route, action, query, cookie or personal-data change; the actions are the same `removeWish` and `saveWish`. `/security-review`: not needed (the card's test plan says so).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/design.spec.ts` (MUPP-070-R1 test): "other dialogs keep their width" is not tested. **Done:** recorded in `verification.md` as a code-review check (`narrow` is opt-in and only `SizesButton` sets it).
- `tests/MUPP-070-santa-wishlist-fold.spec.ts`: "the chevron points up" is only checked through `aria-expanded`. **Done:** recorded in `verification.md` as a code-review check (`WishRow` shows `ChevronUpIcon` when open, as before).

## Suggestions

- `ConfirmAction.tsx`, `FormCard.tsx`: both got a `big` prop (the inverse of `compact`). **Done:** left as it is; a shared size prop on `IconButton` is for when a third place needs it.
- `OwnWishList.tsx`: `WishCard` fills `unlimited`, `claimedBy` and `claimedAt` with dummy values, as the match's page does. **Done:** left as it is, same pattern.

## Outside the change

- `specs/features.md` lists MUPP-070 with area Shared, like its neighbours; the board has the real areas. Not a backlog item.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
