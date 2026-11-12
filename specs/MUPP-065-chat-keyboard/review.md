---
type: Review
title: "MUPP-065 Chat field above the keyboard: review"
description: "The code review of the chat card fitting the visible part of the screen with the keyboard up: findings, decisions and result."
feature: MUPP-065
---

# Code review of MUPP-065

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** R1 to R3 are met; the listeners and the four inline properties are removed when the card closes. One should-fix (pinch-zoom counted as a keyboard) was fixed.
**Security:** Passed: client-only layout code, no sign-in, route, action, query, cookie or personal data. `/security-review`: not needed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/secret-santa/min-sida/ChatButton.tsx` The keyboard test also fired when the user pinch-zooms (the visible height shrinks with the zoom). **Done:** the height is multiplied by `view.scale`; the test fakes `scale` and checks a zoom of 2 changes nothing.

## Suggestions

- The four properties are set and removed from two separate lists. **Done:** left as it is, four names in one small effect.
- The test asserts 75 % of 667 px, which follows the card's class. **Done:** accepted, it is R3.

## Outside the change

- `Dialog` is not keyboard-aware for other forms; out of scope on the card (MUPP-045 scrolls fields into view).
- The check on a real iPhone is not done (see [verification.md](verification.md)).
