---
type: Solution
title: "MUPP-029 Single-kid wish list close motion: solution"
description: "How the wish list on a card with one kid grows out of the Önskelista button and shrinks back into it: interface and decisions and why."
feature: MUPP-029
card: "#93"
depends_on: [MUPP-016, MUPP-022, MUPP-025, MUPP-028]
---

# MUPP-029 Single-kid wish list close motion: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 93`.

## Data

None.

## Interface

No texts change. In `app/components/transition.ts`:

- `growScale(list, from)` is new: it animates the open list (the "Önskelista" region) from the button's box to its own, with `transform` (translate and scale from the top left corner) and `opacity` 0 to 1, 300 ms, the site's easing. With reduced motion it does nothing.
- `shrinkTo(button)` is now used for the single-kid card too: the ghost copy of the closed list is moved and scaled onto the "Önskelista" button that came back. The transform for both directions comes from one helper, `onto(box, to)`.
- `sinkAway` (the 1.5 rem slide down) is removed, and so is `.wish-slide` in `app/globals.css` (the CSS slide up) and its class in `WishList.tsx`.

In `BirthdayDeck.tsx`, `open()` measures the pressed button (the kid's button or tile on a card with several kids, the "Önskelista" button on a card with one kid) before React removes it, and keeps a small function in the ref `growing` that the layout effect calls once the open view exists: `growFrom` for a kid's view, `growScale` for a single-kid list. `leaving` is now a plain flag, since every close shrinks to the button.

## Decisions

- **The same motion as the other cards, chosen on a phone.** The user tried two experiments on a phone, "grow and shrink towards the button" and "slide both ways", and chose the first; it shows where the list came from and where it went, which the old slide did not.
- **Transform and opacity only, also on opening (R2).** The other cards grow with `clip-path`, but a clip is repainted on the main thread and was the reason MUPP-022 moved the close to transform; the single-kid list is a box of its own, so it can be scaled as a whole both ways.
- **The scale is not uniform.** The button is as wide as the list, so the copy mostly gets lower; its text is squashed for a moment, as on the cards with several kids, but it is fading by then (`FADE_AFTER`). A uniform scale would not end on the button.
- **Browsing has nothing to grow from.** When the visitor browses to a single-kid card with the lists open (MUPP-017), `open()` is called with `pressed = false`: the button measured would be on a card at the side, and the card itself slides in, so the list arrives with it. The CSS slide used to play here too.
- **The transform origin is set in the keyframes,** not on the element, so nothing is left on the real list when the animation ends (on the copy it is a style, as before; the copy is removed).
- **Impeccable critique** (run in one context, not as two sub-agents): the detector found nothing in `WishList.tsx` and `BirthdayDeck.tsx`; frozen frames at 25 ms of the opening and 150 ms of the closing at 375 px show the list leaving and landing on the button. The rest of the card (the picture's size, "Storlekar") still changes at once when the list opens; that is outside this card.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Replaces MUPP-016-R1 and R2 ([MUPP-016](../MUPP-016-wishlist-open-transition/verification.md)).
- Documentation: [Start page](../../wiki/system/start-page.md), [Design](../../wiki/system/design.md), `DESIGN.md`, [manual](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
