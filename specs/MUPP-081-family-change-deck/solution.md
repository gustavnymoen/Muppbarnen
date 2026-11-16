---
type: Solution
title: "MUPP-081 Family change: the deck starts at the next event: solution"
description: "How the start page deck starts again at the next event when the visitor changes the choice of families, and why."
feature: MUPP-081
card: "#284"
depends_on: [MUPP-080, MUPP-004]
---

# MUPP-081 Family change: the deck starts at the next event: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 284`.

## Data

None.

## Interface

`app/page.tsx` gives `<BirthdayDeck>` a `key` that is the visitor's choice (`JSON.stringify(view.kind === "chosen" && view.choice)`: `"all"`, a list of ids or `false`). No change to `BirthdayDeck` itself and no new text.

## Decisions

- **A key, not an effect.** `BirthdayDeck` keeps its position (`index`) and the open list in state. When the choice changes, the server renders a new list of cards in the same place in the tree, so React kept the state and the position pointed into the wrong list. A different `key` makes React discard the component and mount a new one, so the deck starts at the first upcoming card with nothing open. It needs no code in the component and no effect that resets state.
- The key is only the choice, so the deck is not reset by anything else (a refresh, a claimed gift).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu (system)](../../wiki/system/start-page.md), which links back here.

[Specifications](../index.md)
