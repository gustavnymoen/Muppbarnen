---
type: Review
title: "MUPP-045 Form cards with focus and Enter: review"
description: "The code review of Form cards with focus and Enter: findings, decisions and result."
feature: MUPP-045
---

# Code review of MUPP-045

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** Every dialog and form goes through one `Dialog.tsx` (the only `showModal()`), nothing of `Fold.tsx` or the sizes page is left, and the pure logic is in `lib/form-card.ts`. No must-fix finding.
**Security:** Passed. `saveSizes` still checks the site and admin sessions, `guardWrite()` and `canManage` on the server; the sizes card only gets the signed-in parent's own kids; the confirmation and the announcement are rendered as text; the card content is unmounted when it closes. `/security-review`: not needed, no server action, route, query, cookie or data was changed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-045-form-cards/verification.md`, `review.md`: still open when reviewed. **Done:** filled in.
- `app/components/Dialog.tsx:112-114`: the fade of the confirmation uses a second timer. **Done:** left: a CSS delay would need the same state to restart the fade on a second save; one clear covers both timers.

## Suggestions

- `Dialog.tsx` the hidden announcement keeps its text ("Otis sparades") until the card is opened again. **Done:** left, on purpose: it is the title the page lists anyway, and a screen reader needs it to stay until read.
- `Dialog.tsx` `open()` does nothing if called in the same event as `close()`. **Done:** left, unlikely.
- `Form.tsx` the `enterKeyHint` layout effect runs every render. **Done:** left; it is cheap and the fields change with the state.

## Outside the change

- `transition.ts:97` the safety timer in `play()` is never cleared (harmless). Not added.
- Several tests are over the 5 s budget now (cards wait for the 300 ms grow): a technical task is proposed in the hand-over, not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
