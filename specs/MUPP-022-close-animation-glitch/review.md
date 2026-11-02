---
type: Review
title: "MUPP-022 Close animation glitch and focus ring on phone: review"
description: "The code review of the close animation fix: findings, decisions and result."
feature: MUPP-022
---

# Code review of MUPP-022

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The fix matches R1 and R2: the shrink is transform and opacity only, the copy is always removed, and the focus ring is hidden only after a close with a finger or mouse. Two should-fix points were fixed.
**Security:** Passed. No route, action, query or personal data is touched. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `wiki/system/start-page.md` (Wish list row): a garbled sentence about the ghost and the focus ring. **Done:** split into two sentences.
- `BirthdayDeck.tsx` (`data-quiet-focus`): it was removed only on blur, so a key pressed on a tile focused by a finger left the ring hidden. **Done:** `onKeyDown` removes it; the R2 test presses a key and checks that it is gone.

## Suggestions

- `BirthdayDeck.tsx` (`byKeyboard`): assistive technology that activates without key or pointer counts as a pointer. **Done:** a comment names the limit; left as it is.
- `blur` listener `{ once: true }` on an element React owns, and `setTimeout` in `play` never cleared: harmless (no leak, a stale timeout cannot remove a newer copy). **Done:** left as it is.
- The R1 test does not check the end box of the copy; `MUPP-016-R3 R4` does (`shrunkTo`). **Done:** left, stated in `verification.md`.
- The pointer part of the R2 test passes in Chromium without the fix (no ring after a click there); the attribute checks are what would fail. **Done:** stated in the test and in `verification.md`.

## Outside the change

- Opening still animates `clip-path` and could stutter the same way on a phone (in `solution.md`); a card only if the user sees it. Not added.
- The suite is at 162 s of 180 s: a TECH card to speed up the tests is worth considering before the next feature. Not added; for the user to decide.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
