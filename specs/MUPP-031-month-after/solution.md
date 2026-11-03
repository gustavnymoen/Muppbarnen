---
type: Solution
title: "MUPP-031 Wish list stays a month after the occasion: solution"
description: "How a birthday or Christmas Eve card keeps its list for 30 days, how items are archived and dated, and how the admin archive copies an item back."
feature: MUPP-031
card: "#66"
depends_on: [MUPP-003, MUPP-004, MUPP-005, MUPP-011]
---

# MUPP-031 Wish list stays a month after the occasion: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 66`.

## Data

Migration `db/migrations/004_added_at.sql` adds `added_at` (ÅÅÅÅ-MM-DD, Swedish time) to `wishlist_item`, and sets it to the day the migration runs for the items already there (`date('now')`, UTC: run between midnight and 01/02 Swedish time it is the day before, which only matters on the very day a month after ends). Nothing else changes (`db/db-setup.test.ts` runs 003 and 004 on a copy in memory). A new column can't default to today in SQLite, so the default is `''` and the server always sets it in `addItem` (new items and copies).

Kids get no added date: "Född" is decided by the dates only (the user's decision on R6, below).

## Interface

- **The rule** (`lib/deck.ts`, pure): `occasionOn(month, day, date, firstYear)` gives the occasion a date belongs to: the one 1–30 days before (`DAYS_AFTER`), else the next (the day itself counts as next), never one before `firstYear`. `occasionOf(kid, kind, date)` applies it to a kid's birthday (the birth is the first occasion) or Christmas Eve (24 December). `isArchived(kid, kind, addedAt, today)` is true when the item's occasion is before today's. 29 February is the 28th in other years, through `occurrenceIn` as before.
- **The deck** (`buildDeck`): a kid's birthday card is the occasion of today, keyed by its full date (one card per kid), with `after: true` when it was 1–30 days ago and the age `occasion year − birth year` (0 for the birth). The Christmas Eve card is `after` from 25 December to 23 January. Cards are sorted by days from today, so the cards in the month after come first, the most recent nearest; `next` is the first card that is not `after`, and `BirthdayDeck` opens on it. The age line says "Fyllde X år" on an `after` card and "Född" for age 0.
- **The data** (`lib/family.ts`): `listDeckInput(today)` and `listWishlists(child, today)` leave archived items out; `listWishlists` also returns `archive`, one `ArchiveGroup` per occasion ("Födelsedag 2025", "Julafton 2026"), newest first, with `claimedBy`. `findItem` reads an item with its list's occasion and the kid's birthdate; `claimWishes` (counted as `missing`), `unclaimWish`, `saveItem` (edit), `removeItem` refuse an archived item; `clearList` deletes only the items `listWishlists` shows; `copyArchivedItem` adds an unclaimed copy, added today, of an archived item the parent may manage. Each takes `today` (default `swedishToday()`) so the tests can choose the day.
- **The admin page:** `ArchiveSection` under the two lists on `/admin/barn/[id]/onskelistor`, only when there are archived items: a card "Arkiv" (`h2`) with a folded `SlimCard` per group (`h3`, `FoldToggle` "Visa {group}" with an arrow that turns up when open) and the items as `SlimCard` rows (`h4`, "Paxad av {name}" or "Obegränsad", no dates). Each row's only button is `CopyItem`: a compact "+" (`PlusIcon`, 32 px like the other row buttons) named "Lägg till {title} igen", opening a `Dialog` "Lägg till ”{title}” igen" / "Vilken lista ska önskningen läggas i?" with the submit buttons "Födelsedag" and "Julafton" (`name="occasion"`) and "Avbryt". The dialog closes when the copy is saved, and the browser gives the focus back to "+". `Heading` and `SlimCard` accept level 4.
- **The server action** `copyArchivedItem` in `app/admin/actions.ts`: site cookie, admin cookie, `guardWrite()`, then `family.copyArchivedItem`; errors are "Du kan inte göra det här.".

## Decisions

- **"Född" by the dates only (R6, decided with the user).** A first draft stored when a kid was added, to show "Född" only for a kid added before its birth. The user chose dates only: before the birthdate "Beräknad", from it to day 30 "Född", then "Fyller 1 år", however the kid was added. This changes MUPP-011-R3 for kids born in the last 30 days; the card says so.
- **Archived by date, not by a flag.** Whether an item is archived follows from its `added_at`, the kid's birthdate and today, so nothing has to run on day 31 and nothing is moved. The cost is that the rule runs in JavaScript over the kid's items instead of in SQL; with a handful of items per kid that is nothing.
- **An archived item counts as missing when claimed.** The claim dialog already tells the visitor that something was no longer there and reloads the list.
- **The copy dialog closes in the action**, not in an effect on the state: the "saved" answer is the same object every time, so an effect would only see the first copy.
- **Unclaiming an archived item is refused** as well, although MUPP-006 is out of scope: an archived item can't be changed at all.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Admin page](../../wiki/system/admin.md), [Startsidan](../../wiki/manual/startsidan.md), [Admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
