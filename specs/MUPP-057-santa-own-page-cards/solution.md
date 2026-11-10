---
type: Solution
title: "MUPP-057 Secret Santa own page cards: solution"
description: "How the two cards on a participant's own Secret Santa page are made equal, aligned and separated by a divider, and the decisions and why."
feature: MUPP-057
card: "#175"
depends_on: [MUPP-051, MUPP-013]
---

# MUPP-057 Secret Santa own page cards: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 175`.

## Data

None.

## Interface

- **R1** `app/secret-santa/min-sida/page.tsx`: the list of cards is a grid (`grid auto-rows-fr gap-6`), so every row is as high as the tallest one, and both cards fill their row (`h-full`: the link card, its link and the grey card). Widths are equal since each card fills the one column.
- **R2, R3** Both cards keep `flex items-center gap-3` with the same padding (1 rem), so the symbol (18 px) sits at the same distance from the left edge, and the symbol and the text block are centred in the height of the card. The text stays left-aligned, as decided with the user.
- **R4** Each row is a `li.divider-short`, the style of the multi-kid birthday card (MUPP-013). `app/globals.css` got two custom properties on it, `--divider-pad` and `--divider-top`, so that the line can sit halfway down the gap (`-0.75rem`, half of the 1.5 rem gap) instead of in padding above the item (the defaults are the old values, so the birthday card is unchanged). It is a `::before`, so it is not in the page and a screen reader does not read it. The first item has no line, so a single card has none.
- **R5** Texts, heading levels, link, press effect and the grey dashed look are unchanged.

## Decisions

- **`!p-0` on the link card.** `Card` has `p-4` and the page passed `p-0`; the order of the generated styles let `p-4` win, so the link had 1 rem of padding inside a card with 1 rem of padding and its symbol sat 16 px further in than the grey card's. This was what made the cards look skewed. `!p-0` makes the link (which should be the whole card, for the press target) the only padding.
- **A gap of 1.5 rem** (it was 0.75 rem) so that the line has room and reads as a divider and not as a stray edge.
- **Reused, not copied:** the divider is the existing `divider-short`; only its position became a variable.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa status](../../wiki/system/secret-santa-status.md), [Design](../../DESIGN.md), the manual [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
