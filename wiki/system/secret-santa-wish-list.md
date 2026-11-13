---
type: Guide
title: Secret Santa wish list
description: "How a Secret Santa member's own wish list works: one list per member, the form and limits shared with the kids' lists, and the owner check on the server."
resource: lib/santa-wishes.ts
feature: MUPP-040
tags: [secret-santa, wishes, security]
---

# Secret Santa wish list

A signed-in member ([Secret Santa entrance](secret-santa-entrance.md)) keeps a list of wishes in the event they signed in to, on `/secret-santa/min-sida/onskelista`, opened from the card "Min önskelista" on their own page `/secret-santa/min-sida`. The list is open only while the event is preparing or started ([event status](secret-santa-status.md)).

## Parts

| Part | What it does |
|---|---|
| `db/migrations/006_secret_santa_wishes.sql` | The table `ss_wish`, one row per wish, with `ON DELETE CASCADE` to `ss_member` (rebuilt by migration `007`, [MUPP-048](../../specs/MUPP-048-santa-events/solution.md), with the same ids). |
| `lib/santa-wishes.ts` | `listOwn`, `saveWish`, `removeWish`. Each takes the member id from the cookie. |
| `app/secret-santa/wish-actions.ts` | The two server actions: `openSiteAction()` (site sign-in and `guardWrite()`), the member from the cookie. |
| `app/secret-santa/min-sida/OwnWishList.tsx` | The member's card: each wish is a `WishRow` (the row of the kids' lists) that folds out to the details and, through its `actions` slot, the pencil and the bin (44 px), and the add form ([MUPP-070](../../specs/MUPP-070-santa-wishlist-fold-sizes-width/solution.md)). |
| `app/components/WishParts.tsx`, `lib/form-input.ts` | The fields, the details and the checks (`parseWish`, `MAX_*`) shared with the kids' lists. |

## Rules

- **One list per member.** A person in two events is two members with a list each and no list is shared. Nothing is claimed ("paxat") and there is no "unlimited".
- **Owner only, checked on the server.** The member comes from the signed cookie, never from the form. A new wish goes into the member's own list; an edit or delete is accepted only for a wish in it. Otherwise "Du kan inte göra det här.".
- **Same limits as the kids' wishes:** title 1–60 (required), description 100, size 40, link up to 500 and only `http://` or `https://`. Texts are printed as text and the link is a link only if it is a web address.
- **Only in the right status** ([MUPP-051](../../specs/MUPP-051-santa-status/solution.md)). `saveWish` and `removeWish` refuse with "Önskelistan är stängd just nu." while the event is inactive; the wishes stay in the database and come back when it is activated again.
- **Nothing public.** No page but the owner's own reads `ss_wish`; reading by the person who drew you is MUPP-042.
- **Removal.** A wish goes with its member or event; the code deletes it explicitly in `lib/santa.ts`.

Specification: [MUPP-040](../../specs/MUPP-040-secret-santa-wish-list/solution.md), [MUPP-070](../../specs/MUPP-070-santa-wishlist-fold-sizes-width/solution.md).

[System documentation](index.md)
