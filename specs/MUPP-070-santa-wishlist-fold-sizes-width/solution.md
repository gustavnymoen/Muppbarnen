---
type: Solution
title: "MUPP-070 Sizes dialog narrower, Secret Santa wish list folds out: solution"
description: "How the narrower sizes dialog and the folding own wish list in Secret Santa are built: the shared wish row with an actions slot, and the chosen placement."
feature: MUPP-070
card: "#238"
depends_on: [MUPP-014, MUPP-040, MUPP-064]
---

# MUPP-070 Sizes dialog narrower, Secret Santa wish list folds out: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 238`.

## Data

None.

## Interface

- **Sizes dialog** (`SizesButton.tsx`, `Dialog.tsx`): `Dialog` has a `narrow` prop that makes it `w-[min(92vw,19.5rem)]` instead of `w-[min(92vw,28rem)]` (R1); no other dialog sets it. "Stäng" sits in a `flex justify-center` row (R2).
- **Own wish list** (`OwnWishList.tsx`): each wish is a `WishRow` (the row of the kids' lists and of "Min matchning"), in a `divide-y` list like the match's. The row got one new prop, `actions`: what it shows below the details when folded out (R3). `OwnWishList` passes the pencil (`FormCard`) and the bin (`ConfirmAction`), which get a `big` prop that makes them 44 px instead of 32 px (R4). The pencil still opens the edit form card and the bin still asks first, as in MUPP-040.
- The folded row has no heading any more (it is a button), so tests find a row with `wishRow(page, title)` and fold it out with `foldOut(page, title)` (`tests/santa.ts`).

## Decisions

- **Placement of the pencil and the bin (R5).** Three proposals were tried on a 375 px phone in the running site: (A) at the bottom right of the folded-out row, (B) at the top right, between the title and the details, (C) at the bottom left. The user chose **C** and asked for no dividing line above the buttons: the two 44 px buttons are at the bottom left of the folded-out row, under the details, with 8 px between them. It sets no new pattern for `DESIGN.md`: the buttons are the same icon buttons as before.
- **Shared row, not a copy:** the actions slot is the only change to `WishRow`; the match's list passes none and is unchanged.
- **Centring the close button:** a wrapper row, not `mx-auto` on the button, so that the button keeps its own width.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa wish list](../../wiki/system/secret-santa-wish-list.md), [Secret Santa manual](../../wiki/manual/secret-santa.md), [Start page manual](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
