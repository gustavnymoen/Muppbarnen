---
type: Solution
title: "MUPP-019 Wish row: info button, labels and order: solution"
description: "How the wish row's info button, labels, order and claimed colour are built: data, interface and decisions and why."
feature: MUPP-019
card: "#62"
depends_on: [MUPP-005]
---

# MUPP-019 Wish row: info button, labels and order: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 62`.

## Data

None.

## Interface

- **Order (R2):** `sortWishes` in `lib/wishes.ts` sorts by a group number: 0 claimable, 1 unlimited, 2 claimed (a claimed unlimited gift counts as claimed). The sort is stable, so the admin order holds inside a group.
- **Info button (R1):** `InfoBubble` in `app/components/WishList.tsx`, shown in the checkbox's place on an unlimited, unclaimed row. It is the shared `IconButton` (44 px, same column as the checkbox) with the new `InfoIcon`, named "Kan köpas flera gånger", `aria-expanded` and `aria-controls`. The explanation is a `role="status"` paragraph positioned absolutely over the row itself (the `li` is `relative`), starting right of the button, so no row moves and the button stays pressable. The sentence is no longer in the unfolded details.
- **Label (R3):** the details show `Beskrivning: {text}` in the same `<p>` as before, so line breaks stay (`whitespace-pre-line`).
- **Colour (R4):** the token `--color-claimed` (`#E3A15F`, in `globals.css` and `DESIGN.md`) on the "Paxad" mark and the "Paxad av …" line. The site has only a dark theme.

## Decisions

- **Bubble, not a tooltip:** a phone has no hover, and `title` is not read on touch, so the button toggles a visible bubble.
- **Hiding:** a second press, Esc and a `pointerdown` outside the button's box. Esc stops at the bubble's wrapper (`stopPropagation`) because the deck listens for Esc and would otherwise close the whole card. Esc works while focus is on the button, which is where it is after pressing it.
- **Over the row, not under it:** a bubble below the row is clipped by the list's own scroll box at the end of the list; over the row it always has room, and the bubble scrolls into view (`scrollIntoView({ block: "nearest" })`).
- **No movement:** no animation, so nothing to respect `prefers-reduced-motion` for.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [manual](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
