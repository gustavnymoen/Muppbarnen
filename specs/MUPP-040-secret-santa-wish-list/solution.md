---
type: Solution
title: "MUPP-040 Secret Santa: own wish list: solution"
description: "How the Secret Santa wish list is built: the table per membership, the shared form and limits, the owner check on the server, and the decisions and why."
feature: MUPP-040
card: "#138"
depends_on: [MUPP-038, MUPP-039]
---

# MUPP-040 Secret Santa: own wish list: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 138`.

## Data

Migration `db/migrations/006_secret_santa_wishes.sql` adds `ss_wish` (`id`, `member_id` → `ss_member` with `ON DELETE CASCADE`, `title` 1–60, `description` up to 100, `size` up to 40, `url` up to 500). The list belongs to the **membership** (`ss_member.id`), not the person, so a person in two families has two lists (R3) and a list never needs claiming. `lib/santa.ts` deletes the wishes explicitly in `removeMember` and `removeFamily`, for the same reason as the memberships (see [MUPP-038](../MUPP-038-secret-santa-families/solution.md)).

## Interface

- **Own page** (`app/secret-santa/min-sida/page.tsx`): under "Hej <name>!" one card per family, "Din önskelista i <family>" (`WishLists.tsx`): slim rows with pencil and trash can, "Ny önskning" and a fold with the form. The row folds out the details and the edit form, as in the kids' admin.
- **Shared with the kids' lists** (`app/components/WishParts.tsx`): `WishFields` (the four fields with the limits) and `WishDetails` (size, description, link as text or a link only for http/https). `WishlistSection` uses them too. The server side shares `parseWish` and the limits `MAX_*` in `lib/form-input.ts`, used by `lib/family.ts` and `lib/santa-wishes.ts`. Also reused: `Form`, `Field`, `SlimCard`, `ConfirmAction`, `Fold*`, `Card`.
- **Server actions** (`app/secret-santa/wish-actions.ts`): `saveWish` and `removeWish`. Each does `requireSiteSession()` and `guardWrite()`, reads the person from the signed cookie, and hands the person's id to `lib/santa-wishes.ts`.
- **Texts (Swedish):** "Din önskelista i …", "Inga önskningar ännu.", "Ny önskning", the confirmation "… tas bort från din önskelista i …", and the kids' field errors.

## Decisions

- **Who you are is never taken from the form.** `saveWish` and `removeWish` get the person id from `currentSantaPerson()`. A new wish names the family in the form, but the server only accepts it if that person has a membership in that family; an edit or delete names the wish, and the server only accepts it if the wish is in a membership of that person. Anything else gives "Du kan inte göra det här." (R3).
- **Reuse instead of copy:** the fields and limits are extracted, not duplicated, so a change to the kids' limits changes these too. The kids' form still adds its own "Obegränsad" checkbox; the Secret Santa form has none, and nothing here can be claimed.
- **Nothing reads the list yet.** No page other than the owner's own page selects from `ss_wish`; the draw's reader comes in MUPP-042 (R4). `listOwn` filters on the person.
- **Everything hangs off `ss_member.id`**, so groups owned by any parent (MUPP-048) need no change here.
- **Compact icon buttons stay 32 px** as in the kids' admin ([MUPP-010](../MUPP-010-compact-admin/solution.md)); the look test says so.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa wish list](../../wiki/system/secret-santa-wish-list.md), [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
