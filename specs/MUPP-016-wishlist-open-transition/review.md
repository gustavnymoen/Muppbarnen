---
type: Review
title: "MUPP-016 Wish list open transition: review"
description: "The code review of the wish list open transition: findings, decisions and result."
feature: MUPP-016
---

# Code review of MUPP-016

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The change meets R1–R6: the origin is measured when the motion starts, the closing copy is inert, has no ids and is removed on reopen, and the old roll-down is gone. Two should-fix points were fixed.
**Security:** Passed. No route, action, query, sign-in or personal data is touched. `/security-review`: not needed, as the card says (only components and CSS).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/transition.ts` (`makeGhost`): closing within 300 ms of opening left the grow animation running on the real card under the ghost. **Done:** `makeGhost` cancels the running Web Animations on the element first; the R6 test checks that no clip animation is left after an Esc right after opening.
- `app/globals.css`: a stale comment about the roll-down was left above the new one. **Done:** deleted.

## Suggestions

- `BirthdayDeck.tsx` (`useLayoutEffect`): `focus()` could scroll the page after `shrinkTo` measured the button. **Done:** left as it is; the card is never partly off-screen (the page does not scroll).
- `transition.ts` (`makeGhost`): the copy is sized from the box of the element and ignores a scale from the deck stack. **Done:** left as it is; it is only used on the top card, which has no scale.
- `transition.ts`: the ghost is removed only in `onfinish`. **Done:** left as it is; a cancelled animation leaves an inert copy until the next open or close removes it.

## Outside the change

- None added to the board; the mid-motion case is covered by the R6 test now.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
