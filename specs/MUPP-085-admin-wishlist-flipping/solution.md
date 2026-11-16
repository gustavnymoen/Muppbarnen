---
type: Solution
title: "MUPP-085 Admin wish lists: arrows, slide and button places: solution"
description: "How the kid's wish list page in admin flips between the kids with a slide, where the arrows and the buttons sit, and why."
feature: MUPP-085
card: "#295"
depends_on: [MUPP-083, MUPP-047, MUPP-077]
---

# MUPP-085 Admin wish lists: arrows, slide and button places: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 295`.

## Data

None.

## Interface

- `app/admin/barn/[id]/KidPage.tsx`: server component. It renders the lists of **all the parent's kids** (`listChildren(parent.id)`, oldest first) in one go, each as a panel (picture, name `h1`, the lists from `content(kid)`), and hands them to `KidFlipper`. A kid that is not in the parent's list (the master administrator on another parent's kid) is rendered alone, so it has no arrows. The checks (`canManage`, not found) are unchanged and come first, so a kid of another parent is never rendered (R2). The page has the back arrow in the header (`back={<BackLink href="/admin" />}`) and no "Till barnen" or sizes button (R4, R5).
- `app/admin/barn/[id]/KidFlipper.tsx`: client component, the kid shown is its state. "Föregående barn" and "Nästa barn" (`IconButton`s) and a sideways swipe call `go(±1)`, which does `history.pushState` to the kid's page and shows the kid at once, so no request is made. The old kid slides out and the new one slides in (CSS `slide-in` and `slide-out`, 250 ms, in `app/globals.css`; the old panel is taken out of the flow while it leaves); with `prefers-reduced-motion` there is no leaving panel at all. Focus goes to the kid's name (`h1 > span`, `tabIndex -1`). Back and Forward (`popstate`) show the kid of the address. `neighbours()` (`lib/kid-neighbours.ts`, unchanged) gives the previous and next kid, round the end.
- `app/components/BackLink.tsx`: the arrow (`IconLink`, `ReturnIcon`, "Tillbaka") for the header's `back` place. Used by the wish list page, "Hantera" (`app/admin/hantera/page.tsx`), the not-found page and the four Secret Santa pages that had the same markup (R5).
- `app/components/Form.tsx`: new `aside` prop, rendered at the right end of the row of the submit button. `ItemForm` (`WishlistSection.tsx`) puts `SizesButton` (`mode="text"`) there (R3).
- `app/components/AddGiftDialog.tsx`: the step back uses `ReturnIcon` (R6).

## Decisions

- **Arrows: the start page's way (proposal A of R1).** Tried on a phone: A (side margins), B (right on the kid's row), C (name between the arrows). The user chose the deck's way: the arrows stand at the screen's edges in the middle of the screen (`fixed`, so they stay while the long lists scroll), and the content sits in a frame (`border`, `bg-card/40`) as wide as the page with `px-5`, so the arrows (44 px) stand half over the frame's edge and only the edges of the cards go under them, never a row (the card's own 16 px of air).
- **Everything in the page at once, one request.** The page's own server rendering fetches all kids' lists (a few kids, two small queries each). The alternative, a request per flip, would make the slide wait. After a save the admin actions revalidate `/admin` (layout), which re-renders the current address, so all panels are fresh (R2); the flipper keeps its state across that.
- **The address is changed with `history.pushState`,** which Next.js syncs with its router. The kid is shown from the flipper's own state, not from `usePathname`, which lagged by a request.
- **Swipe:** pointer events with `touch-action: pan-y`, so the page still scrolls up and down; it does not start on a button, link, field or label, and a form card makes the page inert, so it cannot be swiped then.
- **No sizes page exists any more** (the sizes are a card on the parent's page since MUPP-045), so "the sizes page" in R5 needs no change; `KidPage` is only used by the wish list page.
- **`BackLink` also on the Secret Santa pages:** the same four lines were there; one component says what "back" looks like.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin (system)](../../wiki/system/admin.md), the manual [Admin](../../wiki/manual/admin.md), [DESIGN.md](../../DESIGN.md).

[Specifications](../index.md)
