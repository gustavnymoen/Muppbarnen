---
type: Solution
title: "MUPP-027 Info button without a frame: solution"
description: "How the info button in a wish row is drawn without a frame: interface and decisions and why."
feature: MUPP-027
card: "#87"
depends_on: [MUPP-019]
---

# MUPP-027 Info button without a frame: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 87`.

## Data

None.

## Interface

`IconButton` (`app/components/Button.tsx`) has a `frameless` prop; `InfoBubble` in `app/components/WishList.tsx` sets it. A frameless button is `framelessClass`: 44 px tall and wide, round, text colour, and `edge` as background on `hover` and `active`. It leaves out the shared `base` (and so `press`), so there is no border, shadow or movement. The global `:focus-visible` ring is unchanged, and the icon is the same.

## Decisions

- **A prop, not a class override:** Tailwind does not guarantee which of two conflicting classes wins, so the frame classes are swapped, not overridden.
- **Tint on `active` too:** a press on a touch screen shows the tint without depending on motion, so reduced motion needs no special case.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Design system](../../wiki/system/design.md), `DESIGN.md`.

[Specifications](../index.md)
