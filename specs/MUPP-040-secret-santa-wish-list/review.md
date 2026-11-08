---
type: Review
title: "MUPP-040 Secret Santa: own wish list: review"
description: "The code review of Secret Santa: own wish list: findings, decisions and result."
feature: MUPP-040
---

# Code review of MUPP-040

**Result:** Passed
**Date:** 2026-11-08, review run 1 (one must-fix, fixed; the fix was checked by `lib/route-checks.test.ts`, the unit tests and lint, not by a second reviewer run)
**Summary:** The owner check, input checks, `guardWrite()` and output as text hold, and the kids' form and limits are reused instead of copied. One must-fix was found and fixed.
**Security:** Passed on the points in `wiki/system/code-review.md`: both actions call `requireSiteSession()` then `guardWrite()`; the person comes from the signed cookie, never the form; a new wish needs a membership of that person in the posted family, an edit or delete needs a wish in a membership of that person; input is checked on the server (`parseWish`, `parseId`) and by CHECK constraints in the migration; SQL is fixed text with bound values; texts are printed as text and a link is an `href` only for http/https; `ss_wish` is read only for the owner's own page. `/security-review`: run, no finding at confidence 8 or higher.

How the review works: `wiki/system/code-review.md`.

## Must fix

- `app/secret-santa/wish-actions.ts` `saveWish` and `removeWish` were arrow functions with the checks in a helper, so `lib/route-checks.test.ts` read the wrong block (and skipped `removeWish`). **Done:** both are `async function` declarations that start with `requireSiteSession()` and `guardWrite()`; the test passes.

## Should fix

- `lib/santa-wishes.ts` / `wish-actions.ts` the missing `wishId` was handled in two places (`null` and `undefined`). **Done:** the action turns `null` into `undefined`, the library checks `undefined` or `""` as the kids' code does. Splitting `saveWish` into add and update was left: it mirrors `family.saveItem`.

## Suggestions

- The unlimited checkbox stays in the kids' form only; the shared parts are the four fields. **Done:** left as it is.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
