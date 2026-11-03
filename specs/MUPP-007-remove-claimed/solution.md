---
type: Solution
title: "MUPP-007 Warning when removing claimed gifts: solution"
description: "How the removal dialog on the admin page warns who claimed a present, and what the admin lists now carry."
feature: MUPP-007
card: "#14"
depends_on: [MUPP-003, MUPP-005, MUPP-031]
---

# MUPP-007 Warning when removing claimed gifts: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 14`.

## Data

None. `listWishlists` (`lib/family.ts`) now also reads `claimed_at`, and every item in the two lists is an `AdminItem`: a `WishlistItem` with `claimedBy` and `claimedAt` (null when free). The archive groups use the same type.

## Interface

`ItemCard` in `app/admin/barn/[id]/WishlistSection.tsx` puts the warning first in the text of the existing `ConfirmAction` dialog: "Cykel är paxad av Moster Lisa 30 oktober. Hen kan redan ha köpt den. ”Cykel” tas bort från listan för Vera. Det går inte att ångra." (`claimWarning`, the date through `dayAndMonth` and `parseDate` from `lib/deck.ts`). The text is the dialog's `aria-describedby`, so it is read out with the dialog; focus still starts on "Avbryt". A free or unlimited item gives an empty warning and the usual text. No new route or server action: `removeItem` keeps its checks. Archived items have no remove button, so they never warn.

## Decisions

- **The warning is part of the text, not a new `ConfirmAction` prop.** The dialog already takes a text; one string keeps the component unchanged and the warning in the description for free.
- **No unit test for `claimWarning`.** It is a private three-line function in a component; the browser test reads the finished text, and the unit test covers that the admin lists carry who and when.
- **"Active" is "shown in the list".** `listWishlists` leaves archived items out, so any item with a remove button is active (MUPP-031).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md), [Admin](../../wiki/manual/admin.md).
