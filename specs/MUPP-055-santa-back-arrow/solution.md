---
type: Solution
title: "MUPP-055 Back arrow on the Secret Santa own page: solution"
description: "How the back arrow or cross on the Secret Santa own page replaces 'Byt person', and the decisions and why."
feature: MUPP-055
card: "#170"
depends_on: [MUPP-039, MUPP-047, MUPP-048]
---

# MUPP-055 Back arrow on the Secret Santa own page: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 170`.

## Data

None.

## Interface

- **R1** `app/secret-santa/min-sida/page.tsx` puts an icon in the `back` slot of `Page` (the same slot as the entrance's Tillbaka) and no longer has the button "Byt person". With more than one group (`entranceEvents()`) it is an `IconButton` "Tillbaka" with `ReturnIcon`; with one group it is an `IconLink` "Stäng" with `CrossIcon` to `/`.
- **R2** The arrow is a `type="submit"` button in a `<form action={leave}>`. `leave` in `app/secret-santa/actions.ts` is unchanged: `requireSiteSession()`, `guardWrite()`, remove the cookie, redirect to `/secret-santa`. The cross is a link and changes nothing.

## Decisions

- **Arrow only when there is something to choose.** With one group, signing out would only lead back to the same names, and the entrance would let someone pick another person's name; the cross keeps the sign-in so the menu's "Secret Santa" goes straight to the own page.
- **The number of groups is read with the existing `entranceEvents()`**, the list the entrance uses, so both pages agree on what "one group" means.
- **A form button, not a link,** because it removes the cookie: a link would be a write by GET (R2).
- **No Esc shortcut** on the own page: the card does not ask for it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Secret Santa manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
