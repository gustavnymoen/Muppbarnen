---
type: Solution
title: "MUPP-015 Back button on kids card: solution"
description: "How the Tillbaka button in the top left corner of an open kid view on a multi-kid card and the Christmas card is built."
feature: MUPP-015
card: "#50"
depends_on: [MUPP-013, MUPP-014]
---

# MUPP-015 Back button on kids card: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 50`.

## Data

None.

## Interface

- `app/components/BirthdayDeck.tsx`, `DeckCardView`: when a kid is open on a card with several kids (`hasBack`: `openKid` and more than one kid, which covers the birthday card with several kids and Christmas Eve), a secondary `Button` with `ChevronLeftIcon` and the text "Tillbaka" is placed `absolute left-3 top-3`, mirroring the sizes icon on the right. It is rendered before the sizes icon, so it is first in the tab order. Its accessible name is "Tillbaka till alla barn", or "Tillbaka till Julafton" on the Christmas card (the visible text is part of the name, WCAG 2.5.3).
- It calls the `onClose` that "Stäng" and Esc already use, so the list closes, the marks go, the deck unlocks, the announcement says so and focus goes to the kid's button. No new logic.
- With the button the card gets `pt-16`, so the heading sits on its own row under the two corner buttons.
- Text (Swedish): "Tillbaka", "Tillbaka till alla barn", "Tillbaka till Julafton".

## Decisions

- **Reuse `close`, do not copy it.** The button is only a second trigger of `close` in `BirthdayDeck`.
- **A row for the heading instead of a smaller heading.** At 320 px the card is 256 px wide; "Tillbaka" (about 100 px) and the 44 px icon leave no room for a centred month beside them. The first try, with the heading between the buttons, overlapped at 375 px too. Stacking costs about 32 px of list height, and the list scrolls inside the card. The `text-xl` month of MUPP-014 stays only for the card with one kid, where the icon is alone in the corner.
- **Shared corner code with MUPP-014: not extracted.** The two corner buttons share only the classes `absolute top-3 z-10`; a helper would hide more than it saves.
- **A Christmas card with one kid counts as a single-kid card.** It has nothing to go back to, so it gets no "Tillbaka" (the same rule as `hasBack`: more than one kid).
- **Both buttons stay** ("Tillbaka" and "Stäng"), as decided on the card.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md) (system), [Startsidan och menyn](../../wiki/manual/startsidan.md) (manual).

[Specifications](../index.md)
