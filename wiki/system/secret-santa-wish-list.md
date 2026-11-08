---
type: Guide
title: Secret Santa wish list
description: "How a Secret Santa member's own wish list works: one list per family membership, the form and limits shared with the kids' lists, and the owner check on the server."
resource: lib/santa-wishes.ts
feature: MUPP-040
tags: [secret-santa, wishes, security]
---

# Secret Santa wish list

A signed-in member ([Secret Santa entrance](secret-santa-entrance.md)) keeps a list of wishes in each family they are in, on their own page `/secret-santa/min-sida`.

## Parts

| Part | What it does |
|---|---|
| `db/migrations/006_secret_santa_wishes.sql` | The table `ss_wish`, one row per wish, with `ON DELETE CASCADE` to `ss_member`. |
| `lib/santa-wishes.ts` | `listOwn`, `saveWish`, `removeWish`. Each takes the person id from the cookie. |
| `app/secret-santa/wish-actions.ts` | The two server actions: site sign-in, `guardWrite()`, the person from the cookie. |
| `app/secret-santa/min-sida/WishLists.tsx` | One card per family with slim rows and the form. |
| `app/components/WishParts.tsx`, `lib/form-input.ts` | The fields, the details and the checks (`parseWish`, `MAX_*`) shared with the kids' lists. |

## Rules

- **One list per membership.** A person in two families has two lists and no list is shared. Nothing is claimed ("paxat") and there is no "unlimited".
- **Owner only, checked on the server.** The person comes from the signed cookie, never from the form. A new wish is accepted only for a family the person is in; an edit or delete only for a wish in one of their own lists. Otherwise "Du kan inte göra det här.".
- **Same limits as the kids' wishes:** title 1–60 (required), description 100, size 40, link up to 500 and only `http://` or `https://`. Texts are printed as text and the link is a link only if it is a web address.
- **Nothing public.** No page but the owner's own reads `ss_wish`; reading by the person who drew you is MUPP-042.
- **Removal.** A wish goes with its member or family; the code deletes it explicitly in `lib/santa.ts`.

Specification: [MUPP-040](../../specs/MUPP-040-secret-santa-wish-list/solution.md).

[System documentation](index.md)
