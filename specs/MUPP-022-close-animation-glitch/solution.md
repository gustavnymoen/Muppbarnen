---
type: Solution
title: "MUPP-022 Close animation glitch and focus ring on phone: solution"
description: "How the closing motion of a kid's view shrinks the whole view with transform and opacity, and how the focus ring is kept off a tile after a close with a finger or mouse."
feature: MUPP-022
card: "#76"
depends_on: [MUPP-016, MUPP-013]
---

# MUPP-022 Close animation glitch and focus ring on phone: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 76`.

## Data

None.

## Interface

- `app/components/transition.ts`: `shrinkTo` no longer animates `clip-path`. It scales and moves the whole copy from the closed view's box to the button's box (`translate` + `scale` from `transform-origin: top left`, measured when the motion starts) while `opacity` goes from 1 to 0, 200 ms. A shared `play` runs both `shrinkTo` and `sinkAway` and removes the copy on `finish`, on `cancel` and, as a last resort, 300 ms after the motion should have ended.
- `app/components/BirthdayDeck.tsx`: remembers if the last thing that happened was a key (`byKeyboard`, set in `onKeyDown`, cleared in `onPointerDownCapture`). After a close the focus goes to the button or tile as before, but if it was not a key, the element gets `data-quiet-focus` until it loses the focus.
- `app/globals.css`: `[data-quiet-focus]:focus-visible { outline: none }`.

## Decisions

- **Replaced by MUPP-032.** The ring special case (`byKeyboard`, `data-quiet-focus`) was replaced by one site-wide rule ([MUPP-032](../MUPP-032-quiet-focus-after-tap/solution.md)); the rest of this page still holds.

- **Cause of the motion fault.** `clip-path` on a copy of the whole card showed a shrinking cut-out of the big view, not the view itself shrunk (the picture was not whole), and `clip-path` is repainted on the main thread on every frame, which stutters on a phone. `transform` and `opacity` run on the compositor. The opening motion still uses `clip-path` (not reported, and it reveals a view that grows, which reads right); it can be changed the same way if it turns out to stutter.
- **Scaled non-uniformly.** The copy is scaled to the exact box of the button (different scale in x and y), so it lands on the button; the content is distorted a little for 200 ms while it fades, which is hardly visible.
- **Cause of the ring.** It is the site's own focus ring (`:focus-visible`, 3 px) on the tile that gets the focus when the view closes (MUPP-013), cut off at the top and right by the tile list's `overflow-y-auto`. iOS Safari shows it after a touch where Chrome does not, so it can only be seen on a phone. The fix is on the site's side: the ring is only for the keyboard (WCAG 2.4.7 still holds, the focus is moved and the ring shows for keys). Chromium shows no ring after a click, so the test checks the attribute that hides it as well as the computed outline.
- **The copy always goes.** It is removed on finish, cancel or a timeout, and a new open or close drops it first.
- **Not tried on a phone:** no WebKit is installed here; the result is checked on the phone after the merge (see `verification.md`).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), `DESIGN.md`; builds on [MUPP-016](../MUPP-016-wishlist-open-transition/solution.md).
- **Changed later by [MUPP-029](../MUPP-029-single-kid-close-motion/solution.md):** on a card with one kid the list now grows out of the button (`growScale`) and shrinks back into it (`shrinkTo`); `sinkAway` and `.wish-slide` are gone.

[Specifications](../index.md)
