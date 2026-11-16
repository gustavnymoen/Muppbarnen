---
type: Solution
title: "MUPP-077 Add gifts not on the wish list: solution"
description: "How a visitor adds a gift that is not on a child's wish list, saved as claimed and marked, and how it is shown, undone and removed."
feature: MUPP-077
card: "#259"
depends_on: [MUPP-005, MUPP-006, MUPP-031]
---

# MUPP-077 Add gifts not on the wish list: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 259`.

## Data

Migration `db/migrations/014_added_by.sql` adds `wishlist_item.added_by TEXT`: the name a visitor typed when adding the gift, NULL for a row a parent added. The name is also stored in `claimed_by` (with `claimed_at` = today), so claiming, sorting and the archive work as before. `AdminItem` and `Wish` carry `addedBy`.

## Interface

- **`app/components/AddGiftDialog.tsx`:** a form card with two steps in one `<form>`. Step 1 is `WishFields` (the same fields and limits as the admin form, no "can be bought several times") and "Nästa"; step 2 is "Ange ditt namn", a back arrow and "Lägg till". Both steps stay in the form (step 1 is only `hidden`), so what was typed is kept when going back. "Nästa" checks the gift with `parseWish` in the browser (the same function the server uses); errors are shown on the fields through `FormStateContext` (exported from `Form.tsx`). The result of the server may send the visitor back to step 1 if a gift field is wrong.
- **`OpenList` (`WishList.tsx`):** a muted "Lägg till egen present" row (a plain button, 44 px high, with `PlusIcon` in the icon column, named "Lägg till egen present som inte står i listan") last in the scrolling area, after a line; it looks like a row of the list and not like one more button, also in an empty list; it opens the dialog. `WishList` gets `kidId` and `occasion` from `BirthdayDeck`.
- **Row:** "Tillagd av {name}" in `--color-claimed` instead of "Paxad"; unfolded "Tillagd av {name} {date}". Instead of the undo arrow it has an orange bin (`TrashIcon`), named "Ta bort presenten {title}".
- **`UnclaimDialog`:** on a visitor's row it is titled "Ta bort presenten", says who added it, and has "Avbryt" (focused first) and "Ta bort", which deletes the row; a parent's row keeps the dialog about the claim.
- **Admin and archive:** `WishlistSection` shows "Tillagd av {name}" as the row's note and the warning is "{title} är tillagd av {name}. Hen kan redan ha köpt den."; `ArchiveGroupCard` shows "Tillagd av {name}".
- **Server actions** (`app/actions.ts`): `addGift` and `removeAddedGift`, both `hasSiteSession()`, then `guardWrite()`, then the rules in `lib/family.ts`.

## Decisions

- **One window, two steps:** the keyboard stays up on a phone, and the name comes last, when the visitor knows what they add.
- **`addItem` does the limit check inside its transaction:** the count and the insert cannot be separated by another request. Archived gifts do not count, since a list continues after each occasion. `MAX_ADDED_GIFTS` is 20.
- **An unknown child and a wrong occasion give the same answer**, so ids are not revealed.
- **`removeAddedGift` only deletes rows with `added_by`:** a parent's row is refused on the server, not only hidden in the dialog.
- **An added gift has no claim to remove:** someone who adds a gift has bought it, so there is nothing for another visitor to take over. The undo arrow deletes the gift, and `unclaimWish` leaves a row with `added_by` alone. This also means `claimed_by` always equals `added_by` on such a row.
- **No sign-in per person, on purpose:** anyone with the site password can remove an added gift, as anyone can remove any claim (MUPP-006).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Admin page](../../wiki/system/admin.md), [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
