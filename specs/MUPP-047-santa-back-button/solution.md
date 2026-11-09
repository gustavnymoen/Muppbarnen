---
type: Solution
title: "MUPP-047 Back button on the Secret Santa sign-in: solution"
description: "How the back button, the shorter welcome line and the button text on the Secret Santa sign-in step are built, and the decisions and why."
feature: MUPP-047
card: "#148"
depends_on: [MUPP-015, MUPP-039]
---

# MUPP-047 Back button on the Secret Santa sign-in: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 148`.

## Data

None.

## Interface

- **R1** `Page` and `SiteHeader` take an optional `back` slot, shown at the left of the header row, opposite the menu button. The sign-in step puts an `IconLink` (label "Tillbaka", `ReturnIcon`, the same icon as the kid card's Tillbaka from MUPP-015) there, linking to `/secret-santa?familj=<id>`. The text button "Det är inte jag" is gone. `SignInForm` also listens for Esc and goes to the same address, unless the open menu has used the key (it calls `preventDefault`).
- **R2** The line reads "Hej <name>, ange ditt telefonnummer eller e-post för att komma vidare".
- **R3** The submit button reads "Fortsätt".

## Decisions

- **A link, not a button.** Going back is a navigation in the address (`?familj=`), so it is a link; the typed value disappears because the form unmounts. `IconLink` already looks like the `IconButton` used on the kid card, so no new component.
- **In the header row, not over the content.** The header already has the menu button on the right and keeps its place when the content scrolls; putting Tillbaka there cannot cover the heading.
- **Esc by a window listener in `SignInForm`**, the one client component on the step. `SiteMenu` calls `preventDefault` on the Esc that closes it and the listener skips handled keys, so an open menu keeps its own Esc.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Secret Santa manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
