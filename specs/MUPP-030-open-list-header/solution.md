---
type: Solution
title: "MUPP-030 Open wish list gets the room: solution"
description: "How an open kid view gives the wish list the room: the date on the corner buttons' row, a small picture with the name, no chip and no age."
feature: MUPP-030
card: "#97"
depends_on: [MUPP-014, MUPP-015, MUPP-020, MUPP-029]
---

# MUPP-030 Open wish list gets the room: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 97`.

## Data

None.

## Interface

No texts change; two are left out in an open kid view. All of it is in `app/components/BirthdayDeck.tsx`:

- `DeckCardView`: with a kid open (`openKid`) the card's top padding is `pt-3`, the same as the corner buttons' `top-3`, and the header is one row, `h-11` (the buttons' 44 px) with `px-9`, so the date (`h2`) is centred vertically with the buttons and kept clear of them sideways (the buttons end 56 px in, the row's text starts at 24 + 36 px) (R3). `nextMark` is `null` with a kid open (R1).
- `KidFace`: with the list open it renders a row instead of the column: a 40 px `Avatar` and the name `h3` (`min-w-0`) holding a `FitName` in `text-2xl`, centred together with `justify-center` (R2). The age line and the "Storlekar" text button belong to the closed column only (R1; the sizes icon is in the corner since MUPP-014).
- The closed cards take the same branches as before, so they are unchanged (R4).

## Decisions

- **`FitName` instead of wrapping.** It already keeps names on one line on the cards with several kids and Christmas Eve (MUPP-013-R3); in a flex row the `h3` needs `min-w-0` so that it can be narrower than the name, which is what makes `FitName` shrink it. A very long name at 320 px ends near the 12 px floor of `FitName`; the requirement chose shrinking over wrapping.
- **`text-2xl` for the name.** Next to a 40 px picture the old `text-3xl` was taller than the picture; 24 px sits beside it and is still larger than the date.
- **The date row is set by padding, not by moving the buttons.** The corner buttons stay absolutely placed as in MUPP-014 and MUPP-015; only the header's height and padding match them, so nothing about the buttons' tab order or tests changes.
- **The motion is untouched.** MUPP-029's `growScale` and `shrinkTo` animate the list box only; the header above it changes at once, as the 72 px picture did before.
- **Impeccable critique** (run in one context): the detector found nothing in `BirthdayDeck.tsx`; screenshots of the three open views at 320 × 568 and 375 × 667 show the date between the buttons and the list taking most of the card. No must-fix; the small long name at 320 px is noted above.
- **The chip test is in MUPP-004.** The design test's single-kid card is not the nearest one: made the nearest, its closed card is crowded at 320 px (the chip pushes "Storlekar" onto the wish button), which is TECH-013's closed-card crowding and out of scope here. MUPP-004's one-kid test already has the nearest single-kid card open and closed at 375 px, so R1's chip check is two assertions there.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), `DESIGN.md`, [Startsidan](../../wiki/manual/startsidan.md).
- Settles TECH-013 item 1 (the heading of the open kid view).

[Specifications](../index.md)
