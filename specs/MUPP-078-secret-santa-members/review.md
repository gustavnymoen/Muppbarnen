---
type: Review
title: "MUPP-078 Secret Santa members: partner and top buttons: review"
description: "The code review of MUPP-078: findings, decisions and result."
feature: MUPP-078
---

# Code review of MUPP-078

**Result:** Passed
**Date:** 2026-11-15, review run 1
**Summary:** R1 is built correctly: `addMember` and `saveMember` share the partner rules through `partnerProblem` and `parsePartnerId`, and the unit and browser tests cover each criterion. R2 is a plausible fix in the shared `Dialog` that is not confirmed on a device. No must-fix findings.
**Security:** Passed on the points checked by reading: `addMember` goes through `openAdminAction()` first (sign-in, admin cookie, `guardWrite`), `manageableEvent` still checks ownership, `partnerId` is checked on the server (an id, in the same group, not the person themself) and a bad value gives the generic "Välj en av de andra i gruppen." with nothing saved, the lookup uses `?` parameters, and no route, cookie or secret is added. `/security-review`: not run in this session (the card asks for it because `addMember` takes a new input); to be run by the user before the pull request.

## Must fix

None.

## Should fix

- `app/components/Dialog.tsx` `resetPageScroll` added a `visualViewport` resize listener on every close that only went away after a resize, so on desktop they could pile up and fire when the keyboard opened for the next card. **Done:** one shared function (`toTop`, never added twice) and `open()` removes it.
- `verification.md` and this report were missing. **Done:** both are in the folder; the iPhone check is recorded as not done.

## Suggestions

- `lib/santa.ts` `partnerProblem` reads `raw` in two places to tell "no choice" from "not an id"; `parsePartnerId` could return a third value. **Done:** left as it is; it is small and tested.
- The R2 test does not reproduce the iOS keyboard, only the scroll position after close. **Done:** `verification.md` says the cause is not reproduced and the fix is not confirmed on a device.
- `text(formData, "partnerId") ?? ""` depends on what `text` returns for a missing field. **Done:** the comment explains it.

## Outside the change

- The R2 criterion for a child's edit card or another form card has no browser test of its own; they use the same `Dialog` and its existing tests (`tests/MUPP-045-form-cards.spec.ts`) pass. Not added to the board.
- Three browser tests fail on `main` without this change (MUPP-017-R1, MUPP-021-R1, the wish list test of MUPP-013-R5); not added to the board yet.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
