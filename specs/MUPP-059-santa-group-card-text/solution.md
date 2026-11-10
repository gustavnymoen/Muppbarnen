---
type: Solution
title: "MUPP-059 Santa group card text and bigger own page cards: solution"
description: "How the closed group card shows Admin: <name> on its own line and how the cards on the participant's own page are taller with larger text, and the decisions and why."
feature: MUPP-059
card: "#183"
depends_on: [MUPP-056, MUPP-057]
---

# MUPP-059 Santa group card text and bigger own page cards: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 183`.

## Data

None.

## Interface

- **R1** `app/admin/SantaTab.tsx` (`EventCard`): the note of a card is now two parts: status and number of participants ("Inaktiv, 0 deltagare"), and, for a group the visitor does not administer, a `span.block` "Admin: <name>" so it is a line of its own and is never cut in the middle. `note` in `SlimCard` and `EventFold` became a `ReactNode` (it was a string). The group of the visitor's own has no admin line.
- **R2** `app/secret-santa/min-sida/page.tsx`: both cards share `CARD_LOOK` (at least 11 rem high, 1.5 rem padding, symbol over text, both centred, symbol 40 px) and `CARD_TITLE` (30 px). The titles are two lines with a fixed break, "Min / önskelista", "Min matchning: / <name>" and, in the grey card, "Min matchnings / önskelista" (`Lines`: the first part, a space and the second in a `span.block`, so the accessible name is still "Min önskelista"). A long name wraps on its own.

## Decisions

- **Sizes tried as proposals in the running site** on 375 and 320 px with a copy of the database: A (8 rem, text-2xl), B (11 rem, text-3xl) and, with the break and bigger symbol, C (symbol on its own line) and D (symbol to the left). The user chose B's size with C's layout, all centred.
- **A fixed line break instead of letting the text wrap**, so the break sits where the user wants it at every width.
- **`note` as a ReactNode** instead of a new prop for the admin line: one place decides the look of the note.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin](../../wiki/system/admin.md), [Secret Santa match](../../wiki/system/secret-santa-match.md), [Design](../../DESIGN.md), the manuals [Admin](../../wiki/manual/admin.md) and [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
