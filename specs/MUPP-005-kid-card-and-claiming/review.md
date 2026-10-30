---
type: Review
title: "MUPP-005 Kid card and claiming gifts: review"
description: "The code review of Kid card and claiming gifts: findings, decisions and result."
feature: MUPP-005
---

# Code review of MUPP-005

**Result:** Passed
**Date:** 2026-10-30, review run 1
**Summary:** R1–R8 are built as the card says and `solution.md` matches the code. The atomic claim, the order of checks in the server action and the validation are correct. No must-fix findings.
**Security:** Passed on the points of the guide: the site cookie is checked first, then `guardWrite()`; name and ids are checked on the server; every query is parameterised; texts are rendered as React text; only `http:` and `https:` become links, with `rel="noopener noreferrer"`; errors are generic; no new cookie; the added data is what any visitor with the site password may see. `/security-review`: run on the branch; no finding at confidence 8 or above.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/WishList.tsx` an unused `claimButton` ref was left on the Paxa button. **Done:** deleted.
- `tests/design.spec.ts` the new design test copied the date code of the shared helper. **Done:** uses `birthdateIn` from `tests/helpers.ts`. (An older local copy in another test was not touched.)
- `app/components/WishList.tsx` the call to the server action had no catch, so a network failure would reach the error boundary. **Done:** a catch shows "Något gick fel. Försök igen." in the dialog.

## Suggestions

- `autoFocus` on the name field did nothing, since the dialog is rendered closed; focus lands there because it is the first focusable element when `showModal()` runs. **Done:** the attribute is removed and the comment says why.
- The Avbryt button cast the ref to close the dialog. **Done:** it closes the dialog it is in (`closest("dialog")`).
- Cancelling keeps the typed name in the field, because the dialog stays mounted. **Left as it is:** friendly, and nothing sensitive.

## Outside the change

- `tests/design.spec.ts` still has an older local `birthdateIn` copy in another test; it could use the shared helper. Not added to the board (tiny).
- `npm run test:local` uses fixed port 3100, so it cannot run while another checkout's test server is up. Not added.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
