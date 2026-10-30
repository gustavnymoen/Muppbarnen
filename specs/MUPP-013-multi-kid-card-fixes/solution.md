---
type: Solution
title: "MUPP-013 Multi-kid birthday card fixes: solution"
description: "How Multi-kid birthday card fixes is built: data, interface and decisions and why."
feature: MUPP-013
card: "#39"
depends_on: []
---

# MUPP-013 Multi-kid birthday card fixes: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 39`.

## Data

None.

## Interface

As built:

- R1, R2: the list of kids on the card with several kids fills the card's height, each kid centred in an equal part; the divider is 60 % wide in the muted colour at 45 % (`app/globals.css`, `BirthdayDeck.tsx`).
- R3: a small component shrinks a name until it fits on one line, down to 12 px, then cuts it with an ellipsis (the full name stays for screen readers). Used for the kids on the two-kid card and the tiles of the Christmas card.
- R4: `NextMark` uses `--color-child-sun` instead of the kid's colour.
- R5: while a list is open, `WishList.tsx` shows a small sticky "Stäng" button (`Button`, secondary) centred at the bottom of the list instead of the wish button. It has the same id as the wish button, so the existing focus handling in `BirthdayDeck.tsx` puts the focus on it when the list opens and back on the wish button when it closes. On a card with one kid the Stäng button is an arrow up ("Fäll ihop önskelistan", `IconButton`) since MUPP-005-R6; on several kids and Christmas Eve it stays "Stäng". The "Dölj" state of `WishButton` (the `open` prop) is removed.

## Decisions

- The values for R1, R2 and R4 were tried together on a phone in the running site (2026-10-29), as in TECH-006. R1 only shows on phones taller than about 700 px; at 375 × 667 the card is already full (MUPP-004-R4).
- R5 first had both "Dölj" and a corner "Stäng"; two buttons doing the same was too much, so the wish button is swapped for "Stäng" (decided 2026-10-29). The MUPP-004 tests that checked `aria-expanded` on the wish button now check that "Stäng" is shown and has the focus.
- R4 and R5 were added to the card after the first draft: the "next" mark is one component on every card, and an open list locks the deck (MUPP-004-R9), so closing it must be quick.
- MUPP-005 also builds out `WishList`; whichever lands second is rebased on the other.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md) (system), [Startsidan och menyn](../../wiki/manual/startsidan.md) (manual).

[Specifications](../index.md)
