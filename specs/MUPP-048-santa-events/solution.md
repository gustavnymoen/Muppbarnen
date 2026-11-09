---
type: Solution
title: "MUPP-048 Secret Santa: events created by any parent: solution"
description: "How Secret Santa events (groups) are built: the migration from families, the owner rule, unique names, members that belong to one event, the cookie that names a member, and the entrance with its back button."
feature: MUPP-048
card: "#149"
depends_on: [MUPP-038, MUPP-039, MUPP-040, MUPP-047]
---

# MUPP-048 Secret Santa: events created by any parent: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 149`.

## Data

Migration `db/migrations/007_secret_santa_events.sql` replaces `ss_family`, `ss_person` and `ss_member` (MUPP-038) and rebuilds `ss_wish` (MUPP-040):

- **`ss_event`** (`id`, `owner_id` → `parent`, `name` 1–60): the former family, now with an owner. A unique index on `lower(trim(name))` backs the rule in code; a parent who owns an event cannot be deleted (`removeParent` says so first).
- **`ss_member`** (`id`, `event_id` → `ss_event` with `ON DELETE CASCADE`, `name`, `phone`, `email`, `partner_member_id`): one row per human *per event*, carrying their own details. `UNIQUE (event_id, phone)`. `ss_person` is gone.
- **`ss_wish`**: as before, hanging off `ss_member`.

The migration copies the rows into `tmp_` tables, drops the old tables, creates the new ones and copies back, with **the same ids for members and wishes**, so partner links and wish lists follow. Every existing family becomes an event owned by the master admin parent (lowest id; any parent if there is none); a person who was in two families becomes two members with the same details (each membership already had its own id). A family name that repeats an earlier one (ignoring case and spaces) gets ` (<id>)` after it, so that the new unique rule cannot stop the migration. No tables are renamed (a rename inside a transaction rewrites foreign keys in other tables in ways that are hard to see). Tested in `db/db-setup.test.ts` with made-up rows and foreign keys on, and run on a copy of the local database.

## Interface

- **Admin, "Secret Santa" tab** (`app/admin/SantaTab.tsx`, `santa-actions.ts`): shown to every parent; a parent sees their own events and the master admin sees all, with "administreras av <name>" on the others. "Ny grupp", rename, delete (with the question), "Ny person" and the member card with partner, as in MUPP-038. "Lägg till känd person" is gone, and so are the hints that details apply in several families. The name error is "Det finns redan en grupp med det namnet.", the phone/email errors "Numret används redan av en annan person i gruppen." and "E-postadressen används redan av en annan person i gruppen.", the partner error "Välj en av de andra i gruppen."
- **Entrance** (`app/secret-santa/page.tsx`): the steps are `?grupp=<event id>` and `&person=<member id>`. The names step has the shared back button (`IconLink` "Tillbaka") in the header: to `/secret-santa` with several events, to `/` with one; the text button "Byt familj" is gone. The sign-in step goes back to the names. `EscBack` (client) does the same on Esc for both steps (it replaces the handler that was in `SignInForm`).
- **Own page** (`app/secret-santa/min-sida`): one list, "Din önskelista i <event>" (`OwnWishList.tsx`; the list per family is gone, and so is the hidden `familyId` field).
- **Mails** (R6): none exist yet. MUPP-041 to MUPP-043 and TECH-017 must name the event ("Secret Santa: <gruppens namn>") and no member names; see Decisions.

## Decisions

- **Who may change what is one function:** `canManage` in `lib/santa.ts` (the master admin, or `owner_id` is the actor). `manageableEvent` and `manageableMember` look the row up first and answer "Du kan inte göra det här." for someone else's, so every action, also a forged one, is checked on the server. A missing row answers "Det finns inte längre." as before.
- **Unique names are compared in code** (`toLocaleLowerCase("sv")` on trimmed names, inside the write transaction) because SQLite only lowercases ASCII; the index is a second line of defence for ASCII.
- **E-mail uniqueness within an event is only checked in code**, not by an index: an event from before may already hold one address twice, and a unique index would stop the migration.
- **The cookie names a member**, not a person (a person no longer exists). Its signature text changed from `santa.<id>` to `santa-member.<id>`, so a cookie issued before this change fails the check instead of naming the member that happens to have the same number. Everyone who was signed in has to sign in once more.
- **Sign-in compares against the picked member only**, so the same phone number in two events never mixes the events up.
- **Mails:** nothing to build until the mail cards exist; the rule is recorded in their cards through this card's text.
- **The browser test suite** was over its budget before this change (TECH-019); the cost of the new tests is in `verification.md`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Secret Santa wish list](../../wiki/system/secret-santa-wish-list.md), [Admin page](../../wiki/system/admin.md), [Secret Santa](../../wiki/manual/secret-santa.md), [Admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
