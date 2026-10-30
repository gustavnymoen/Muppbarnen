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
| Wish list | `app/components/WishList.tsx`, `lib/wishes.ts`, `app/actions.ts` | The "Önskelista" button on a kid's card; the list unfolds to the wishes (rows, see below) and scrolls inside the card, and the button is swapped for a sticky button at the bottom: an arrow up ("Fäll ihop önskelistan") on a card with one kid (MUPP-005-R6), a small "Stäng" on a card with several kids and on Christmas Eve (MUPP-013-R5, MUPP-005-R7, R8). |
| Sizes | `app/components/SizesButton.tsx`, `app/components/Dialog.tsx` | A child's sizes (MUPP-014): the "Storlekar" button on a card with one kid (folded list), an icon button named "Storlekar för {name}" beside the wish button on a card with several kids, and an icon button "Storlekar" in the top right corner of every open kid view (it replaces the text button). It opens a modal dialog "Storlekar för {name}" with a row per saved size (Kläder, Skor, Huvud, Handskar) or "Inga storlekar inlagda än."; the button exists even when no sizes are saved. The sizes come from `listDeckInput` through `buildDeck` (`DeckKid.sizes`, trimmed) and are plain text. `Dialog` is the shared `<dialog>` look; it keeps Esc and key presses inside from reaching the deck, so Esc closes only the dialog. |
| Fit name | `app/components/FitName.tsx` | A kid's name on one line (MUPP-013-R3): shrinks the text one pixel at a time down to 12 px, then cuts it with "…"; the full name stays in the text for screen readers. Used on the two-kid card and the Christmas tiles. |

## How it behaves

- The menu closes with Escape, a choice, a click outside it, or Tab out of it. Escape and a choice return focus to the menu button.
- The deck is a carousel: the selected card is in the middle, with the previous and next seen dimmed at the sides. It is browsed by swiping, the buttons "Föregående kort" and "Nästa kort", or the arrow keys, and wraps around. With reduced motion the cards change without moving.
- Every card is the same size (up to 40 rem high) and centred; the browse buttons sit at the sides of the card. The header is centred, with the month and, on the first card, the mark "✦ Nästa födelsedag ✦" under it.
- A card with one kid shows the picture, name, age and the wish list (folded: one tall "Önskelista" button with an arrow down, in the kid's colour, no number of wishes); a birthday card with several kids shows a miniature per kid, one above the other (a large picture of 104 px, name, age and a 11 rem wish list button without a number), each kid in its own equal part of the card (R1) with a thin line between the kids, 60 % wide in the muted text colour (R2), and the Christmas card shows its kids as tiles, two by two (picture above the name); the button or row opens that kid as an ordinary card with the list unfolded. Christmas Eve holds all kids, without age, on a green night background drawn in SVG behind the content (`ChristmasBackdrop.tsx`: a garland of lights, stars, snow and fir trees).
- **Wish rows (MUPP-005):** each row shows the headline, "Paxad" if claimed and "Kan köpas flera gånger" if unlimited; claimed wishes come last (`sortWishes`, applied by `buildDeck`). The headline is a button that unfolds the description, "Storlek: …", the link (only `http:`/`https:`, `target="_blank"`, `rel="noopener noreferrer"`; `webLink`), and for a claimed row "Paxad av {name} {date}". All texts are plain text. A row that is neither claimed nor unlimited has a checkbox named after the wish; with at least one marked, "Paxa ({n})" appears next to the arrow or Stäng button, and opens a modal `<dialog>` (focus in the name field, the marked gifts listed). The marks live in the open list only, so folding it or closing the card clears them.
- **Claiming:** the server action `claimWishes` (`app/actions.ts`) calls `hasSiteSession()`, then `guardWrite()`, then `claimWishes` in `lib/family.ts`, which trims and checks the name (1–60 characters) and the ids and claims each wish with `UPDATE … WHERE claimed_by IS NULL AND unlimited = 0`, so a wish that is taken, unlimited or missing is never changed. The visitor is told which could not be claimed, and the page is refreshed (`revalidatePath`). Removing a claim is MUPP-006.
- **Locked while a list is open:** an unfolded list disables the buttons, swipe and arrow keys and says so in text and to screen readers. The wish button is swapped for a sticky button centred at the bottom of the list (an arrow up on a card with one kid, "Stäng" otherwise); it gets the focus when the list opens, and the wish button gets it back when the list closes. Escape closes it too.
- The mark on the next card ("✦ Nästa födelsedag ✦", "Nästa: Julafton") is always yellow (`--color-child-sun`), whatever the kid's colour (MUPP-013-R4).
- A kid who is not born yet (birthdate after today, MUPP-011) has no age: the birthday card shows "Beräknad {månad}", and from the birthdate on the kid is an ordinary one whose next birthday is the first (age at least 1). The Christmas card lists the kid like any other.
- With no kids the start page shows one card, "Inga barn har lagts till än.".
- "Today" is the date in Sweden (`Europe/Stockholm`). A birthday on 29 February is on 28 February in years without one.
- The cards at the sides are `aria-hidden` and `inert`; a live region tells the screen reader which card it is on.

## Tests

`tests/MUPP-002-start-page.spec.ts` (menu, keyboard, 320 px, axe), `tests/MUPP-004-birthday-card.spec.ts` (the deck), `tests/MUPP-005-kid-card-and-claiming.spec.ts` (rows, details, marking, the dialog, claiming), `tests/MUPP-014-kid-sizes.spec.ts` (the sizes buttons and dialog), `lib/deck.test.ts` (order, grouping, privacy), `lib/wishes.test.ts` and `lib/family.test.ts` (sorting, link check, the claim) and the look in `tests/design.spec.ts` ([Testing](testing.md)).

Built by [MUPP-002](../../specs/MUPP-002-start-page/solution.md), [MUPP-004](../../specs/MUPP-004-birthday-card/solution.md), [MUPP-005](../../specs/MUPP-005-kid-card-and-claiming/solution.md), [MUPP-011](../../specs/MUPP-011-future-birthdate/solution.md), [MUPP-013](../../specs/MUPP-013-multi-kid-card-fixes/solution.md) and [MUPP-014](../../specs/MUPP-014-kid-sizes/solution.md); the Swedish version is [Startsidan och menyn](../manual/startsidan.md).

[System documentation](index.md)
