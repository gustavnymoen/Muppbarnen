---
type: Solution
title: "MUPP-016 Wish list open transition: solution"
description: "How the wish list slides up on a card with one kid, and how a kid's view grows from and shrinks back to its button on the cards with several kids and on Christmas Eve."
feature: MUPP-016
card: "#57"
depends_on: [MUPP-005, MUPP-013, MUPP-015]
---

# MUPP-016 Wish list open transition: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 57`.

## Data

None.

## Interface

- **Single-kid list, open (R1):** `.wish-slide` in `app/globals.css`, set on the open list only when `solo` (`WishList.tsx`): a CSS animation from `translateY(1.5rem)` and opacity 0, 250 ms, `backwards` fill so nothing is held after it ends. It replaces `reveal`/`.wish-list`. Disabled with reduced motion.
- **Kid's view, open (R3):** `BirthdayDeck.open` measures the pressed button or tile (`originOf`) before the state changes; a layout effect then runs `growFrom` on the card (`id="karta-<card key>"`), a Web Animations `clip-path` from the button's box to `inset(0)`, 300 ms.
- **Closing, both kinds (R2, R4):** the real view is closed at once, as before (focus, the deck and the announcement are unchanged). `close()` first makes a *ghost* (`makeGhost`): a copy of the closing element, `inert`, `aria-hidden`, without ids, fixed over the page where it was. After the commit, the layout effect animates it: `shrinkTo` (the whole copy scaled and moved to the button, measured then, fading out, 200 ms; changed from clip-path in [MUPP-022](../MUPP-022-close-animation-glitch/solution.md)) on cards with several kids and Christmas Eve, `sinkAway` (down 1.5 rem and fade, 200 ms) on a single-kid card. The ghost is removed when it ends.
- `app/components/transition.ts` holds all of this; `BirthdayDeck.tsx` calls it from `open`, `close` and one `useLayoutEffect` (which also moves the focus, as the old effect did).
- Reduced motion (R5): `growFrom` and `makeGhost` do nothing when `prefers-reduced-motion: reduce` matches, so there is no ghost and no animation.

## Decisions

- **A ghost instead of delaying the unmount.** Waiting for the exit animation before closing would keep the old view mounted next to the new one, with the same ids (`…-knapp`) and two focus targets, and every press during the motion would meet a half closed state. With a ghost the state is always the final one (R6 holds by construction) and the motion is only decoration that can be dropped at any moment: a new open or close removes the previous ghost (`dropGhost`).
- **The origin is measured, not saved (R4).** The button is gone while the view is open, so the target of the shrink is measured after the commit that brings it back; the ghost is positioned in page coordinates, so scrolling or a new window size between open and close does not matter.
- **`clip-path` for the grow (the shrink was changed by MUPP-022).** The card's own content is shown through a window that grows from the button's box, so it looks as if the card unfolds from the button, and nothing changes layout while it runs. It is the compositor-friendly alternative to animating width and height.
- **Single-kid open is plain CSS.** It needs no measuring, so it is a keyframe animation; only the multi-kid views need JavaScript. The multi-kid list inside the grown view does not slide as well (`solo` only), so there is one movement at a time.
- **A press during the closing motion works as usual.** The real list is already closed, so "Önskelista" is back at once; pressing it removes the ghost and opens. Two quick presses on a single-kid card are not guarded: the second lands on the fold-up arrow (the same place), as before this card. The card text says so.
- **Not tried:** the look of the motion was tuned from the numbers only (distance, 200/300 ms, the site's one easing); it has not been looked at on a phone yet, see `verification.md`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Design](../../wiki/system/design.md), `DESIGN.md`, [Start page manual](../../wiki/manual/startsidan.md).
- **Changed later by [MUPP-029](../MUPP-029-single-kid-close-motion/solution.md):** on a card with one kid the list now grows out of the button (`growScale`) and shrinks back into it (`shrinkTo`); `sinkAway` and `.wish-slide` are gone.

[Specifications](../index.md)
