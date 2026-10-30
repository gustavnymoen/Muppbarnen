---
type: Solution
title: "MUPP-005 Kid card and claiming gifts: solution"
description: "How the wish rows, their details, marking and claiming (paxa) are built, and the arrow and Stäng buttons of the open wish list."
feature: MUPP-005
card: "#11"
depends_on: [MUPP-003, MUPP-004]
---

# MUPP-005 Kid card and claiming gifts: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 11`.

## Data

No migration. `wishlist_item` already had `claimed_by` and `claimed_at` (MUPP-003). Claiming sets `claimed_by` to the trimmed name and `claimed_at` to today's date in Sweden (`ÅÅÅÅ-MM-DD`). `Wish` in `lib/deck.ts` now carries `description`, `size`, `url`, `unlimited`, `claimedBy` and `claimedAt`, so the start page sends the details of every wish to the browser (the same text any visitor with the site password can see).

## Interface

- `lib/wishes.ts` (pure, unit tested): `sortWishes` (claimed last, stable), `canClaim` (not claimed and not unlimited) and `webLink` (only `http:` and `https:`). `buildDeck` sorts every list with `sortWishes`, so the browser gets the order.
- `lib/family.ts`: `listDeckInput` reads the details; `claimWishes(ids, name)` checks the name (`parseText`, 1–60 characters after trimming), checks the ids (a list of 1–50 positive whole numbers, repeated ids count once) and claims each wish with `UPDATE wishlist_item SET claimed_by = ?, claimed_at = ? WHERE id = ? AND claimed_by IS NULL AND unlimited = 0`. A change count of 0 means the wish was taken, unlimited or missing; its title (or a count of missing ones) is returned, and the others in the request are still claimed.
- `app/actions.ts`: the server action `claimWishes(ids, name)`. First `hasSiteSession()`, then `guardWrite()`, then `family.claimWishes`, then `revalidatePath("/")` so the rows show the new state. No new cookie.
- `app/components/WishList.tsx` (a client component): `OpenList` holds the marks and exists only while the list is open, so folding the list or closing the kid card clears them (R3). `WishRow` is a headline button (`aria-expanded`, `aria-controls`) with the marks "Paxad" and "Kan köpas flera gånger" under the headline, a 44 px checkbox named after the wish on rows that can be claimed, and the details when unfolded. `ClaimDialog` is a `<dialog>` opened with `showModal()` (as `ConfirmAction`): focus in the name field, the marked gifts listed, the text from the card, an error line (`role="alert"`) and the buttons "Avbryt" and "Paxa". "Paxa (n)" sits in the same sticky bar as the arrow or Stäng button.
- Texts are rendered as React text, never as HTML. The link opens in a new tab with `rel="noopener noreferrer"`.
- R6–R8 (the arrow buttons and Stäng on the open list) were built first, see [MUPP-013 solution](../MUPP-013-multi-kid-card-fixes/solution.md): the wish button says only "Önskelista" with an arrow down; the sticky bottom button is an arrow up ("Fäll ihop önskelistan") on a card with one kid and "Stäng" on a card with several kids and on Christmas Eve; it has the focus when the list opens.

Error texts the visitor sees: "Skriv ditt namn.", "Högst 60 tecken.", "Markera de presenter du vill paxa.", "Du är utloggad. Ladda om sidan och logga in igen.", the guard's messages, and "Det gick inte att paxa …: någon annan hann före. Listan är uppdaterad." No SQL or internals.

## Decisions

- **One `UPDATE` per wish, no transaction.** The condition in the `WHERE` clause makes each claim atomic: the database lets only one of two competing updates change the row, and the loser sees 0 changes. A transaction around all of them would make one taken gift stop the others, which the card does not want.
- **A plain result object, not form state.** The dialog is in a client component that calls the action directly in a transition; a failure for the name keeps the dialog open, a failure for gifts closes it and shows a status line under the list.
- **The race is not unit tested.** Two parallel claims through the single test connection gave an unreliable test database; the guarantee is the `WHERE` clause plus the test of a second claim of a claimed wish, and the browser test lets another visitor claim a wish while the page is open.
- **Sorting on the server** (in `buildDeck`), so the browser needs no rule of its own and the order is unit tested with the rest of the deck.
- **Date as text.** The claim date is stored and shown as `ÅÅÅÅ-MM-DD`; MUPP-006 (removing a claim) can change the presentation later.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md) (system), [Startsidan och menyn](../../wiki/manual/startsidan.md) (manual).

[Specifications](../index.md)
