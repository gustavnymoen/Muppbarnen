---
type: Solution
title: "MUPP-034 Cross on single-kid wish list: solution"
description: "How the fold-up button of an open wish list shows the same cross on every card."
feature: MUPP-034
card: "#115"
depends_on: [MUPP-028]
---

# MUPP-034 Cross on single-kid wish list: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 115`.

## Data

None.

## Interface

- `app/components/WishList.tsx`, `OpenList`: the button always renders `CrossIcon`. The `solo` prop stays, since it still decides the accessible name: "Fäll ihop önskelistan" on a card with one kid, "Stäng önskelistan" on the others.
- No change to the texts visitors see.

## Decisions

- **Only the icon changes, not the name.** The name says what happens (the list folds up on a single-kid card), the cross is only the look. It also keeps the ten or so tests that look for the name as they are.
- **`ChevronUpIcon` stays** in `app/components/icons.tsx`: the open/close button on the card (`WishRow` in `WishList.tsx`) still uses it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md). Changes the button from [MUPP-028](../MUPP-028-close-button-on-line/solution.md).

[Specifications](../index.md)
