---
type: Review
title: "MUPP-066 Chat scroll with the keyboard up: review"
description: "The code review of the touch handling in the chat card with the phone keyboard up: findings, decisions and result."
feature: MUPP-066
---

# Code review of MUPP-066

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** R1 and R2 are met; the listener is non-passive, cancels only with the keyboard up and is removed with the others. One should-fix (the keyboard test written twice) was fixed.
**Security:** Passed: client-only DOM events. `/security-review`: not needed.

## Must fix

None.

## Should fix

- `ChatButton.tsx` The keyboard test was written twice. **Done:** one `keyboardUp()` in the effect. The spec folder was missing at review time: **Done:** created.

## Suggestions

- In a short conversation a drag in the list is not cancelled; the blur still lowers the keyboard. **Done:** noted in `solution.md`.

## Outside the change

- The real iPhone check is not done (see [verification.md](verification.md)).
