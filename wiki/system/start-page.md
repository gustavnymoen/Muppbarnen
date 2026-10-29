---
type: Guide
title: Start page and menu
description: "How the start page, the shared header and the hamburger menu are built, and and the birthday deck of cards."
resource: app/page.tsx
feature: MUPP-002
tags: [start-page, navigation, accessibility]
---

# Start page and menu

## Parts

| Part | Where | What |
|---|---|---|
| Header | `app/components/SiteHeader.tsx` | Only the menu button, without a border (TECH-006: the site's name is no longer shown as a heading). It is inside `Page`, outside the scrolling `PageContent`, so it stays in place. `<Page home>` keeps the name as a visually hidden `h1`, so the page has a heading for screen readers; other pages have their own `h1`. |
| Menu | `app/components/SiteMenu.tsx` | A hamburger on every screen size. The button "Meny" has `aria-expanded`; the list is a `nav` with "Start" and "Admin", both links; "Admin" (to `/admin`, [Admin page](admin.md)) is last and in the muted text colour, and nothing else on the page points to it. |
| Deck | `app/components/BirthdayDeck.tsx`, `lib/deck.ts` | The birthday deck (MUPP-004): one card per date with kids' birthdays plus Christmas Eve, nearest first. `lib/deck.ts` builds the cards on the server and sends only month, age and order, never the day of birth. |
| Wish list | `app/components/WishList.tsx` | The folded "Önskelista" row on a kid's card that unfolds to the headlines and scrolls inside the card. |

## How it behaves

- The menu closes with Escape, a choice, a click outside it, or Tab out of it. Escape and a choice return focus to the menu button.
- The deck is a carousel: the selected card is in the middle, with the previous and next seen dimmed at the sides. It is browsed by swiping, the buttons "Föregående kort" and "Nästa kort", or the arrow keys, and wraps around. With reduced motion the cards change without moving.
- Every card is the same size (up to 40 rem high) and centred; the browse buttons sit at the sides of the card. The header is centred, with the month and, on the first card, the mark "✦ Nästa födelsedag ✦" under it.
- A card with one kid shows the picture, name, age and the wish list (folded: one tall "Önskelista – Visa mer" button in the kid's colour); a birthday card with several kids shows a miniature per kid, one above the other (a large picture of 104 px, name, age and a 11 rem wish list button), with a short thin line between the kids, and the Christmas card shows its kids as tiles, two by two (picture above the name); the button or row opens that kid as an ordinary card with the list unfolded. Christmas Eve holds all kids, without age, on a green night background drawn in SVG behind the content (`ChristmasBackdrop.tsx`: a garland of lights, stars, snow and fir trees).
- **Locked while a list is open:** an unfolded list disables the buttons, swipe and arrow keys and says so in text and to screen readers. Escape or the list button closes it.
- A kid who is not born yet (birthdate after today, MUPP-011) has no age: the birthday card shows "Beräknad {månad}", and from the birthdate on the kid is an ordinary one whose next birthday is the first (age at least 1). The Christmas card lists the kid like any other.
- With no kids the start page shows one card, "Inga barn har lagts till än.".
- "Today" is the date in Sweden (`Europe/Stockholm`). A birthday on 29 February is on 28 February in years without one.
- The cards at the sides are `aria-hidden` and `inert`; a live region tells the screen reader which card it is on.

## Tests

`tests/MUPP-002-start-page.spec.ts` (menu, keyboard, 320 px, axe), `tests/MUPP-004-birthday-card.spec.ts` (the deck), `lib/deck.test.ts` (order, grouping, privacy) and the look in `tests/design.spec.ts` ([Testing](testing.md)).

Built by [MUPP-002](../../specs/MUPP-002-start-page/solution.md), [MUPP-004](../../specs/MUPP-004-birthday-card/solution.md) and [MUPP-011](../../specs/MUPP-011-future-birthdate/solution.md); the Swedish version is [Startsidan och menyn](../manual/startsidan.md).

[System documentation](index.md)
