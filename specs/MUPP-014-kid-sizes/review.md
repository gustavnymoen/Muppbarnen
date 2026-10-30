---
type: Review
title: "MUPP-014 Expose kids sizes on kids card: review"
description: "The code review of MUPP-014: findings, decisions and result."
feature: MUPP-014
---

# Code review of MUPP-014

**Result:** Passed
**Date:** 2026-10-30, review run 1
**Summary:** The sizes reach the deck as trimmed text without the birthdate or the day, the three button modes sit where the card says, and one shared `Dialog` replaces the copied `<dialog>` markup. No must-fix findings.
**Security:** Passed. No new route or server action (so no `guardWrite()`); the sizes are read after `requireSiteSession()`, as the wishes are, and rendered as React text. `/security-review`: run, no findings at confidence 8 or above.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-014-kid-sizes/verification.md` was still the template during the review. **Done:** filled in.

## Suggestions

- `app/components/Dialog.tsx` `{...props}` came after the two stopping handlers, so a caller's own `onKeyDown` would replace them. **Done:** `{...props}` now comes first, with a comment.
- `lib/deck.ts` Sizes are trimmed again in `buildDeck`. **Done:** left as it is; the unit test covers it and R1 says trimmed text.
- `app/components/BirthdayDeck.tsx` `SOLO_AVATAR` is another height formula next to `TWIN_AVATAR`. **Done:** left as it is; it has a comment saying why, and the no-scroll checks at 320 × 568 and 375 × 667 cover it.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
