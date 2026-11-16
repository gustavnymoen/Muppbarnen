---
type: Solution
title: "MUPP-083 Admin wish lists: sizes and flipping between kids: solution"
description: "How the kid's wish list page in admin gets a read-only sizes button in two places and arrows between the kids, and why."
feature: MUPP-083
card: "#290"
depends_on: [MUPP-010, MUPP-014, MUPP-045]
---

# MUPP-083 Admin wish lists: sizes and flipping between kids: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 290`.

## Data

None.

## Interface

- `app/admin/barn/[id]/KidPage.tsx`: the row of "Till barnen" gets `SizesButton` (`mode="corner"`) at its right end (R1). Under the page two `KidArrow`s, "Föregående barn" and "Nästa barn", are `IconLink`s with the chevron icons to `/admin/barn/<id>/onskelistor` of the neighbour (R3, R4).
- `lib/kid-neighbours.ts`: `neighbours(ids, id)` gives the previous and next id, circular, or null with one kid or a kid that is not in the list. `KidPage` calls it with `listChildren(parent.id)`, the same kids in the same order (oldest first) as the parent's page (R3).
- `app/admin/barn/[id]/WishlistSection.tsx`: `ItemForm` (used by "Ny önskning" and "Ändra") has `SizesButton` at the bottom right, under the form and outside it (R2).
- `app/components/SizesButton.tsx`: takes `Pick<DeckKid, "name" | "sizes">`, so it works for an admin `Child` too.
- `app/components/Dialog.tsx`: `onCancel` stops the event from bubbling in the React tree (see Decisions).

## Decisions

- **Read-only sizes by reuse.** The user wanted to look at the sizes, not change them, so the start page's `SizesButton` and its dialog are reused; the sizes are still changed on the parent's page (MUPP-045).
- **The sizes dialog opens on top of the form card.** Both are modal `<dialog>`s; the form card keeps what is typed because only the sizes dialog is closed. The button sits outside the `<form>`, so it can never submit it.
- **Esc closed both cards, a bug found while building.** React's `onCancel` bubbles up the component tree, so Esc in the sizes dialog also ran the form card's `onCancel` and closed it. `Dialog` now calls `stopPropagation()` in its `onCancel`.
- **Arrows at the screen edge, always.** They are the deck's arrows (`IconButton`-sized, 44 px, vertically centred), but at `left-0`/`right-0` at every width, not `left-2` above 23 rem as in the deck: the wish rows reach so close to the edge that 8 px in covered the title or the buttons at 375 and 430 px. The browser test measures that no arrow overlaps the row at 320, 375 and 430 px. `position: fixed`, so they stay while the page scrolls; a modal card makes the page inert, so they cannot be reached then.
- **Only the parent's own kids, also for the master administrator,** since the parent's page lists only those; a kid that is not in the list (a master admin on another parent's kid) has no arrows.
- **No new browser test file.** The checks join the existing test that opens the kid's wish list page (MUPP-010), with a second kid; the rule is a unit test.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin (system)](../../wiki/system/admin.md), the manual [Admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
