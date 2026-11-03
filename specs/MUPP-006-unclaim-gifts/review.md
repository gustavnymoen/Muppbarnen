---
type: Review
title: "MUPP-006 Unclaim gifts: review"
description: "The code review of Unclaim gifts: findings, decisions and result."
feature: MUPP-006
---

# Code review of MUPP-006

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** An undo arrow on claimed rows, an `UnclaimDialog` on the shared `Dialog`, and a server action `unclaimWish` that removes one claim with a single parameterised `UPDATE`. It does what R1–R5 ask, the action's checks come in the right order, and the unit test shows a wish can be claimed again; only gaps in the test records were found.
**Security:** Passed. `unclaimWish` in `app/actions.ts` calls `hasSiteSession()`, then `guardWrite()`, then `unclaimWish` in `lib/family.ts`, which checks the id with `parseId` before touching the database and runs `UPDATE … WHERE id = ? AND claimed_by IS NOT NULL AND unlimited = 0`. Errors say what to do without SQL or names from the code; no new cookie, route or script. Anyone may remove any claim on purpose (the card's scope). `/security-review`: run on 2026-11-03, no findings (SQL injection, authentication, authorisation, data exposure and XSS checked; titles and names render as React text).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `tests/MUPP-006-unclaim-gifts.spec.ts` The card's test plan asked for a bad id "through the action" as a browser test, but only the no-session case was one. **Done:** the card's test plan now says a bad id is tested in the unit test of `unclaimWish` (the action passes the id straight through, and a browser cannot send a bad one without forging the request); `verification.md` says so too.
- `lib/family.test.ts` The R5 unit test checked only that some error came back, not that it says what to do. **Done:** it checks the exact text "Det gick inte att ta bort paxningen. Ladda om sidan och försök igen."

## Suggestions

- `app/components/WishList.tsx` `UnclaimDialog` follows the layout of `ConfirmAction` (alertdialog, alert line, Avbryt first). **Done:** left as it is: `ConfirmAction` is built on a form action and its own trash button, so sharing would be a larger change; extract a shared confirmation dialog if a third one appears.
- `app/components/WishList.tsx` The shared `done(message, dialog)` step for claiming and unclaiming avoids duplicating the closing and focus code; only claiming clears the marks. **Done:** nothing to change.
- `tests/MUPP-006-unclaim-gifts.spec.ts` The 44 px check of the undo button was also in `tests/design.spec.ts`. **Done:** removed from the behaviour test; sizes stay in the design test.

## Outside the change

- One confirmation dialog for `ConfirmAction` and `UnclaimDialog` (a callback and an icon). Not added to the board: only worth it if another confirmation dialog is added.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
