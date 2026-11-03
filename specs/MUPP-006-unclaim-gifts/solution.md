---
type: Solution
title: "MUPP-006 Unclaim gifts: solution"
description: "How Unclaim gifts is built: an undo button on claimed rows, a confirmation dialog and a server action that removes one claim."
feature: MUPP-006
card: "#12"
depends_on: [MUPP-005]
---

# MUPP-006 Unclaim gifts: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 12`.

## Data

None. Removing a claim sets `claimed_by` and `claimed_at` on `wishlist_item` back to `NULL`, the state the row had before MUPP-005 claimed it.

## Interface

- `WishRow` in `app/components/WishList.tsx`: a claimed row that is not unlimited (`canUnclaim` in `lib/wishes.ts`) gets a frameless `IconButton` with `UndoIcon` (an arrow going round backwards, in the claimed colour) in the column where unclaimed rows have their checkbox and unlimited rows their (i). Its name is "Ta bort paxningen på {title}".
- `UnclaimDialog` in the same file: a `Dialog` with `role="alertdialog"`, the title "Ta bort paxningen", "{title} är paxad av {name}.", "Är du säker? Ta bara bort paxningen på presenter du själv har paxat." and the buttons "Avbryt" and "Ta bort". `OpenList` keeps the wish being unclaimed in state and opens the dialog; `<dialog>` returns focus to the undo button when it closes without a change.
- After a confirmed removal the dialog closes, the status line under the list says "Paxningen på {title} är borttagen." (or "Paxningen på {title} var redan borttagen. Listan är uppdaterad."), and focus goes to the button that folds or closes the list, since the undo button is gone. This is the same `done` step as after a claim.
- Server action `unclaimWish(id)` in `app/actions.ts`: `hasSiteSession()`, then `guardWrite()`, then `unclaimWish` in `lib/family.ts`, then `revalidatePath("/")`. Errors: "Du är utloggad. Ladda om sidan och logga in igen." (only reachable without `proxy.ts`, which refuses a server action without a site cookie with 401 first; the dialog then says "Något gick fel. Ladda om sidan och försök igen."), the guard's messages, and "Det gick inte att ta bort paxningen. Ladda om sidan och försök igen." for a bad id.
- `unclaimWish(rawId)` in `lib/family.ts`: one parameterised `UPDATE … WHERE id = ? AND claimed_by IS NOT NULL AND unlimited = 0`; `ok` says whether a row changed.

## Decisions

- **One at a time, with an undo arrow (decided with the user, 2026-11-03).** The first version of the card let visitors mark several claimed rows and remove them together, which needed a rule against mixing claimed and unclaimed rows and a second button in the sticky part of the list. Removing many claims at once is unlikely, so the card was simplified to one button per row. Two proposals were tried in the running site at 320 px: the undo arrow on the row, and a text button "Ta bort paxning" in the unfolded row. The arrow won: every row has one control in the same column, and the dialog explains what it does. A trash can was rejected (reads as deleting the wish), and so was a cross (the list's own cross means "Stäng önskelistan").
- **"Ta bort" on the confirm button.** "Avbryt" and "Ta bort paxning" did not fit side by side in the dialog at 320 px (about 254 px inside its padding), so the button says "Ta bort"; the title and the text above it say what is removed.
- **Focus starts on "Avbryt"**, like `ConfirmAction`, so Enter does not remove a claim by mistake.
- **No separate message for a wish that is gone.** If someone else removed the claim, or the wish was deleted, the action changes nothing and the list is refreshed; one message ("var redan borttagen") covers both, since the refreshed list shows which it was.
- **The result type is named (`UnclaimResult`).** `lib/route-checks.test.ts` reads the action's body from the first `{`, so an inline object type in the signature hid the checks from it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Builds on [MUPP-005](../MUPP-005-kid-card-and-claiming/solution.md).
- Documentation: [Start page](../../wiki/system/start-page.md), [Startsidan](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
