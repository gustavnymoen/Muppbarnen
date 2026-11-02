---
type: Review
title: "MUPP-017 Browse kids with the wish list open: review"
description: "The code review of Browse kids with the wish list open: findings, decisions and result."
feature: MUPP-017
---

# Code review of MUPP-017

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** `locked` is replaced cleanly: `go()` covers browsing with no list, with a list on a card with several kids and with a list on a card with one kid; `canGo` is the only guard on the buttons, swipe still checks `openList`, and focus goes through the one `refocus` ref. The old lock text, announcements and tests are gone.
**Security:** Passed. No route, server action, query, sign-in or personal data is touched. `/security-review`: not needed, for the same reason.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-004-birthday-card/solution.md` still described the lock and its texts. **Done:** updated with a pointer to MUPP-017.
- The arrow-key guard was tested only in the claim dialog. **Done:** the R3 test also checks the sizes dialog.
- Going back from the first card with a list open (wrap to the last) was not tested. **Done:** added to the R1 test.

## Suggestions

- `BirthdayDeck.tsx` (the focus effect): `focus({ preventScroll: true })` would stop the browser scrolling the deck's clipped surface when a list is opened while a card still slides. **Done:** left as it is; the tests now wait for the card to settle, and changing how focus scrolls the list into view is out of this card's scope.
- `go`: the `openCard!` assertions are safe (guarded by `canGo` and `openList`). **Done:** left as it is.
- A leftover comment about the "unlocked deck" in `MUPP-015-back-button.spec.ts`. **Done:** fixed.

## Outside the change

- The `verification.md` and `flow.mmd` of MUPP-004, MUPP-013 and MUPP-015 still talk about the locked deck; they record what was built then. Not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
