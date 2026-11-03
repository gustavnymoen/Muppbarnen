---
type: Solution
title: "MUPP-028 Wish list close button on the line: solution"
description: "How the button that folds up an open wish list sits on the bottom line of the list box, and Paxa got a fixed row above it: interface and decisions and why."
feature: MUPP-028
card: "#92"
depends_on: [MUPP-005, MUPP-013, MUPP-016]
---

# MUPP-028 Wish list close button on the line: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 92`.

## Data

None.

## Interface

`OpenList` in `app/components/WishList.tsx` is now two boxes:

- The region ("Önskelista", the element with the list's id) is the bordered box. It is `relative`, has `pb-5` at the bottom and `mb-2` below it.
- Inside it, a box with `tabIndex={0}`, `role="group"` and the name "Önskningar" holds the rows and the notice, and is the one that scrolls (keyboard scrolling as before). It ends 20 px above the bottom line, so a row can never pass under the button (R1).
- The fold-up button is an `IconButton` with `compact round` (32 px circle), placed `absolute bottom-0 left-1/2` and moved half its size left and down, so its centre is on the line. A `before:` pseudo-element 7 px outside the padding box makes the target 44 × 44 px (R2). It shows `ChevronUpIcon` ("Fäll ihop önskelistan") on a card with one kid and the new `CrossIcon` ("Stäng önskelistan") otherwise; the id `…-knapp` is unchanged, so focus handling in `BirthdayDeck` is untouched.
- "Paxa (n)" is a centred row between the scrolling box and the bottom line, outside the scrolling, only when something is marked (R3). It takes its height from the rows' box, so it is seen at once and covers nothing.

`IconButton` (`app/components/Button.tsx`) has a `round` prop; the corner radius is now set in `buttonClass` and `iconClass` instead of the shared `base`.

## Decisions

- **The region stays the bordered box, and holds the button.** The button must sit outside the scrolling area, but the tests and screen readers find it inside the "Önskelista" region, so the scrolling moved one level in instead of moving the button out of the region.
- **Rows end above the button rather than scrolling under it.** The acceptance criterion is that no row text is ever covered, at any scroll position; padding below the scrolling box gives that without measuring anything.
- **The target from a pseudo-element.** A 44 px button with a 32 px drawn circle inside would need an extra element; `before:` with a negative inset keeps one element. The inset is counted from inside the 1 px border, hence 7 px and not 6.
- **`round` as a prop, not `rounded-full` as a class.** As in MUPP-027: Tailwind does not promise which of two conflicting classes wins.
- **Paxa does not scroll.** It was first the last row of the list, but then a visitor who marked a wish at the top of a long list did not see it; a sticky button would cover rows, so it got a fixed row of its own, and the rows get less room while something is marked.
- **`mb-2` on the list box:** half the button and its focus ring (3 px offset + 3 px) reach 22 px below the line; cards with several kids have only 16 px of padding, and the card clips its content.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), `DESIGN.md`, [manual](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
