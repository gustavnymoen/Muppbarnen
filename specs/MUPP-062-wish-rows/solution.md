---
type: Solution
title: "MUPP-062 Wish rows on the Secret Santa match page: solution"
description: "How the match page reuses the children's wish row, read-only and roomier, and how the labels Beskrivning and Storlek became bold, and why."
feature: MUPP-062
card: "#192"
depends_on: [MUPP-005, MUPP-042]
---

# MUPP-062 Wish rows on the Secret Santa match page: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 192`.

## Data

None.

## Interface

- **`WishRow`** (`app/components/WishList.tsx`) is exported and takes two optional props. `claiming` (`marked`, `onMark`, `onUnclaim`) holds everything about claiming; without it the row has no checkbox and no undo arrow, so it is only read. `roomy` makes the row 56 px high (`min-h-14`, instead of 44 px); the title (16 px) and the unfolded details (14 px) keep the size of the children's row. `OpenList` passes `claiming`, so the children's lists are as before.
- **Bold labels (R1):** "Beskrivning:" and "Storlek:" are `<strong class="font-semibold">` in the expanded row, so they are bold on the children's lists and on the match page. The order, the texts and which lines show are as before (changed by [MUPP-064](../MUPP-064-wish-row-fold/solution.md): both lines always show, with "–" when empty).
- **Match page** (`app/secret-santa/min-sida/matchning/page.tsx`): the slim cards and `WishDetails` are replaced by a list of `WishRow roomy` with dividers, like the children's list. A Secret Santa wish has no claim data, so the page gives each wish `unlimited: false, claimedBy: null, claimedAt: null`, which the row shows as nothing ("Paxad" and "Kan köpas flera gånger" never appear, and without `claiming` there is no checkbox). "Inga önskningar ännu." is as before.
- **Untouched:** the member's own list and the admin lists still use `SlimCard` and `WishDetails`.

## Decisions

- **One row, not a copy:** `WishRow` was exported and made usable without claim parts, instead of writing a second row for the match page. The claim parts are gated on one prop, `claiming`.
- **Size (R3):** 56 px and 18 px (title) were first tried on a phone (375 px) in the running site; the user wanted the title unchanged and the unfolded text smaller, so only the height stays larger: 56 px against 44 px. The size is in `DESIGN.md`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa match and change mails](../../wiki/system/secret-santa-match.md), [Start page](../../wiki/system/start-page.md), [Secret Santa](../../wiki/manual/secret-santa.md), [Startsidan](../../wiki/manual/startsidan.md); changes [MUPP-042](../MUPP-042-secret-santa-your-person/solution.md) and [MUPP-005](../MUPP-005-kid-card-and-claiming/solution.md).

[Specifications](../index.md)
