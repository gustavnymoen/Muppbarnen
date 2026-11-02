---
type: Solution
title: "MUPP-020 Birthday day on the cards: solution"
description: "How the day and the month are shown in the heading of a birthday card while the birthdate and the birth year stay on the server."
feature: MUPP-020
card: "#65"
depends_on: [MUPP-004, MUPP-011]
---

# MUPP-020 Birthday day on the cards: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 65`.

## Data

None. The birthdate is stored as before.

## Interface

- **`lib/deck.ts`:** `DeckCard` has `day` (null on the Christmas card) next to `month`. `buildDeck` takes it from the next occurrence, so a 29 February birthday has `day: 28` in a year without a 29th (R3). `dayAndMonth(day, month)` writes it as "17 mars". `DeckKid` is unchanged: age and `expected`, no day (R1, R4).
- **`app/components/BirthdayDeck.tsx`:** the heading, the screen reader label ("Alma och Vera, 17 mars") and the single kid's "Beräknad 17 mars" use `dayAndMonth`. The miniatures on a card with several kids show only "Beräknad" for an expected kid, since the date is in the heading (R1, R2). In an open kid view, with icons in both top corners, the heading is `text-xl` (`text-base` under 23 rem) so a long date such as "29 september" stays clear of them; on a closed card it is `text-3xl` (`text-2xl` under 23 rem) so "22 november" stays on one line on a 320 px phone.
- **Rule:** `specs/rules.md` states what the browser gets (day and month of the card, age, never the birthdate or the birth year); MUPP-004-R6, `wiki/system/start-page.md` and `wiki/manual/startsidan.md` match it (R4, R5).

## Decisions

- **The card holds the date, the kids do not.** A card is made per date, so all its kids share it; one `day` and `month` on the card means the date is sent once and cannot differ between kids.
- **The date is built on the server, as before.** The browser only formats `day` and `month`, so the birth year is never in the page, and the unit test checks the keys of the card and the kid.
- **Card keys stay the card's place in the deck**, not the date, so nothing else is derived from the date.
- **The heading is lower case** ("17 mars"), as Swedish writes dates, instead of the old capitalised month.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Startsidan](../../wiki/manual/startsidan.md), [Rules](../rules.md); builds on [MUPP-004](../MUPP-004-birthday-card/solution.md) and [MUPP-011](../MUPP-011-future-birthdate/solution.md).

[Specifications](../index.md)
