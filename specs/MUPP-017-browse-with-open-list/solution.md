---
type: Solution
title: "MUPP-017 Browse kids with the wish list open: solution"
description: "How the deck is browsed while a wish list is open, and how Tillbaka became a return icon."
feature: MUPP-017
card: "#59"
depends_on: [MUPP-004, MUPP-005, MUPP-013, MUPP-015]
---

# MUPP-017 Browse kids with the wish list open: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 59`.

## Data

None.

## Interface

- `app/components/BirthdayDeck.tsx`: the `locked` flag is gone. `go(delta)` is the one place that browses, with or without a list:
  - no list open: as before (next or previous card);
  - a list open on a card with several kids (also Christmas Eve): changes to the next or previous kid on the same card, wrapping, and opens that kid's list (R2);
  - a list open on a card with one kid: goes to the next or previous card; a card with one kid gets its list opened, a card with several kids is shown as the overview with the list closed (R1).
  The buttons are disabled only when there is nothing to go to (`canGo`: more than one card, or a list open on a card with several kids).
- Focus is handled in the one place that already did it: `open` and the overview case set `refocus`, and the effect on `openList` moves focus (the fold-up or Stäng button of the opened list, or the first kid's button on an overview card, so the arrow keys keep working).
- The marks are forgotten because the list of another kid is another component instance: `KidFace` has `key={kid.id}`, and another card is another `DeckCardView`.
- Swiping is still off with a list open (`onPointerDown` checks `openList`).
- The keyboard handler ignores arrow keys from inside a `<dialog>` (claim and sizes), so a text field's arrows do not browse. Escape still works as before.
- The screen reader hears "Kort n av N: …" when the card changes, and "{name}, önskelistan är öppen" when the kid changes within a card. The old "Kortleken är låst/upplåst" announcements and the text "Stäng önskelistan för att bläddra." are removed.
- `app/components/icons.tsx`: new `ReturnIcon` (a left arrow that turns back). The "Tillbaka" button is an `IconButton` with it, same place, same names ("Tillbaka till alla barn", "Tillbaka till Julafton"), same `onClose`.

## Decisions

- **No new state.** Browsing with a list open only chooses what `openList` holds next; closing, Escape and focus are unchanged.
- **The heading shares its row with the icons.** With a 44 px icon in each top corner the month fits between them (it shrinks below 23 rem like on the card with one kid), so the extra row of MUPP-015 (`pt-16`) is gone and the card gets the same top padding as other open kid views.
- **Overview card gets focus on its first kid's button**, since the list the focus was in disappears; otherwise focus would fall to the page and the arrow keys would stop working.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md) (system), [Startsidan och menyn](../../wiki/manual/startsidan.md) (manual).

[Specifications](../index.md)
