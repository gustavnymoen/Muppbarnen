---
type: Solution
title: "MUPP-021 Browse forward with a list open: solution"
description: "Why browsing forward with a list open pushed the deck sideways, and the one-line fix."
feature: MUPP-021
card: "#73"
depends_on: [MUPP-017]
---

# MUPP-021 Browse forward with a list open: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 73`.

## Data

None.

## Interface

`app/components/BirthdayDeck.tsx`: the effect on `openList` focuses with `focus({ preventScroll: true })`.

Cause: the deck's grid is `overflow: hidden`, which a browser still scrolls programmatically. `go()` changes the card and moves the focus in the same render, while the next card is still translated 94 % to the right (it slides in over 250 ms). The browser scrolled the grid to reveal the focused element, and it stayed scrolled: the shown card ended up off to the left, the next one dimmed to the right. Backwards the card comes from the left, where `scrollLeft` can't go below 0, so only forward broke.

## Decisions

- `preventScroll` rather than moving the focus after the animation: the focus must move at once for screen readers and the keyboard, and the deck never needs to scroll for focus (all cards are laid out in the same grid cell and moved with `transform`).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), which MUPP-017 extended.

[Specifications](../index.md)
