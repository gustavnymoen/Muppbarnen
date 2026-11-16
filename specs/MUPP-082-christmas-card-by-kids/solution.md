---
type: Solution
title: "MUPP-082 Cards by number of kids: solution"
description: "How a card chooses its layout by the number of kids, on Christmas Eve and on birthdays, and why."
feature: MUPP-082
card: "#285"
depends_on: [MUPP-013, MUPP-080]
---

# MUPP-082 Cards by number of kids: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 285`.

## Data

None.

## Interface

Only `DeckCardView` in `app/components/BirthdayDeck.tsx` changes. For every card (Christmas Eve and birthdays alike) the number of kids picks the layout:

- 1 kid: the single card, as before (R1).
- 2 kids: the list as for twins (picture, name, age if the card has one, wish and sizes buttons, a short line between): the birthday card already had it, now Christmas Eve too (R2).
- 3 kids (`rows`): one column of rows; each row is the button "Öppna <name>" with a 56 px picture to the left and the name, a `FitName`, centred in the rest (R3).
- 4 or more kids (`tiles`): small tiles two by two, as Christmas Eve had them; now birthday cards too (R4).

Rows and tiles are the same button and the same `onOpen`; only its classes differ, so opening a kid, the open kid view and browsing are unchanged.

## Decisions

- **Rows, not a squeezed twin layout, for three kids.** Three twin parts do not fit a 375 × 667 phone card; the user chose wide rows over a compressed twin layout from two mock-ups with demo data.
- **No difference between the cards.** The user decided that a birthday card with three or more kids (many kids on one date is rare) follows the same rules as Christmas Eve, so the code has no `christmas &&` in the choice. The age is then only in the kid view that a row or tile opens. The card first covered Christmas Eve only and was widened while it was built.
- **One button for rows and tiles**, with `rows ? … : …` classes, instead of a new component: they share the id, the label and the handler.
- **Two kids reuse the twin branch** of the list, no new code.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page (system)](../../wiki/system/start-page.md), the manual [Startsidan](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
