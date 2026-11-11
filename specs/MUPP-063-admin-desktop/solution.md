---
type: Solution
title: "MUPP-063 Admin page layout on desktop: solution"
description: "How the Barn tab of the admin page became one column of at most 42 rem with names kept on one line, so it reads cleanly on a desktop."
feature: MUPP-063
card: "#193"
depends_on: [MUPP-010, MUPP-053]
---

# MUPP-063 Admin page layout on desktop: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 193`.

## Data

None.

## Interface

- **Barn tab** (`app/admin/page.tsx`, `ParentHome`): the kids and the "Hantera" section sit in one `max-w-2xl` (672 px) column, and the kids are a plain list (`space-y-2`) instead of a grid of two or three columns from 640 px (R2, R3). It has the same width and the same left edge as the Secret Santa tab (`SantaTab`, already `max-w-2xl`) and `/admin/hantera` (already `max-w-2xl`). The phone layout is as before: one column.
- **Names on one line** (`SlimCard`, `ChildCard`): `SlimCard` got the prop `nowrap`, which puts the title in a `truncate` span, so a name is cut with an ellipsis and never split inside the word (R1). `ChildCard` sets it; the other slim cards keep their wrapping, so groups and parents are unchanged.
- **Looked at, left as it is:** the Secret Santa tab and `/admin/hantera` were already at most 672 px; the wish list page of a kid (`/admin/barn/[id]/onskelistor`) uses the whole width of the page frame (72 rem) with a centred plus button, which reads fine and is not part of the card's requirements.

## Decisions

- **One column, not a wider grid:** the cause of "Wild/a" was three narrow cards in a row, each with two buttons with text beside the name. One column makes every card as wide as the others and gives the name the room; it is also what the manage page does.
- **Ellipsis only where the card asks for it:** `nowrap` is a prop, not the new default, since a wrapped name is right for a group or a parent with a note under it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Administration](../../wiki/system/admin.md), [Design system](../../DESIGN.md).

[Specifications](../index.md)
