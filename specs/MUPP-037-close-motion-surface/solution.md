---
type: Solution
title: "MUPP-037 Clean close motion of the wish list: solution"
description: "How the copy that folds into the Önskelista button loses its content first, so that only a plain surface is scaled: interface and decisions and why."
feature: MUPP-037
card: "#129"
depends_on: [MUPP-022, MUPP-025, MUPP-029]
---

# MUPP-037 Clean close motion of the wish list: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 129`.

## Data

None.

## Interface

No texts change. In `app/components/transition.ts`, `play()` also animates every direct child of the copy (the list's scroll box, "Paxa" and the cross on a single-kid card; the kid's name, picture and list on the other cards) from opacity 1 to 0 in 100 ms (`CONTENT_FADE_MS`), linear, kept at 0. The copy itself moves and fades as before (300 ms, fully visible for the first 40 %), so what is scaled into the button is the surface: its colour, edge and shadow.

## Decisions

- **Content fades, the surface folds.** The copy used to be the whole list, scaled non-uniformly, so rows, checkboxes and buttons were squashed into view and the list could be made out. Fading only the content keeps the cause (a copy of the real element, MUPP-022) and fixes the symptom with one loop; nothing else in the close changed.
- **A against B, chosen on a phone.** Two versions were tried in the iOS simulator and on the desktop: A (content fades in 100 ms, then the surface folds) and B (a blank surface from the start). They looked almost the same and both were fine; the user chose A, which keeps a short hint of the list before it folds.
- **Applies to all three card types** because `makeGhost` and `play` are shared.
- **The surface of the single-kid list is faint** (`bg-page/40` with a border), so on that card the folding is mostly the edge and the fading. Not changed here.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Builds on [MUPP-022](../MUPP-022-close-animation-glitch/solution.md), [MUPP-025](../MUPP-025-ios-close-animation/solution.md) and [MUPP-029](../MUPP-029-single-kid-close-motion/solution.md).
- Documentation: [Start page](../../wiki/system/start-page.md), `DESIGN.md`.

[Specifications](../index.md)
