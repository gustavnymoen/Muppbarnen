---
type: Solution
title: "MUPP-038 Secret Santa: families and members: solution"
description: "How Secret Santa families, people, memberships and partners are built: the tables, the Secret Santa tab on the admin page, the master-admin-only rules and decisions and why."
feature: MUPP-038
card: "#135"
depends_on: [MUPP-003, MUPP-010]
---

# MUPP-038 Secret Santa: families and members: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 135`.

## Data

Migration `db/migrations/005_secret_santa.sql` adds three tables:

- `ss_family` (`id`, `name` 1–60 characters).
- `ss_person` (`id`, `name` 1–60, `phone` unique and `07` plus eight digits, `email` 3–254): one row per human, however many families they are in, so editing the details in one family changes them everywhere (R3).
- `ss_member` (`id`, `family_id`, `person_id`, `partner_member_id`, unique per family and person): the **membership**, one person in one family. The partner is another membership, so it is stored per family (R5).

**Prepared for the wish lists (MUPP-040) and the draw (MUPP-041):** both belong to the membership (`ss_member.id`) and get their own tables later, with `ON DELETE CASCADE` to `ss_member`, so removing a member (R3) or a family (R2) removes them too. This card has nothing to remove yet, and deletes memberships explicitly in `lib/santa.ts` rather than relying on the cascade, since a transaction on a local database file does not always keep foreign keys on (the same reason as in `removeChild`).

## Interface

- **Tabs** (`app/components/Tabs.tsx`, client): the ARIA tab pattern, `tablist` with `tab` buttons and one `tabpanel` each, arrow keys, Home and End, roving `tabindex`. All panels are in the page, only the selected one shows, so a half-filled form survives a tab switch. Used on `/admin` with "Barn" (what the admin page showed before, including "Hantera") and "Secret Santa".
- **`app/admin/page.tsx`:** the master admin gets the tabs; every other parent gets the kids as before, no tab, and nothing from the Secret Santa tables is read for them (R1, R6).
- **`app/admin/SantaTab.tsx`:** one slim card per family (name, "n medlemmar", pencil "Byt namn på …", trash can with a question), under it a slim row per member (name, "Partner: …", pencil "Ändra Anna i Familjen Ek", trash can), and the buttons "Ny person" and "Lägg till känd person" (only when someone is known who is not already in the family). The member form has name, phone ("Skriv numret som 07XXXXXXXX"), email and "Partner" (the other members and "Ingen"). Built from the existing `SlimCard`, `Fold*`, `Form`, `Field`, `ConfirmAction` and `ListPicker`. `Field` also takes `type` `tel` and `email`.
- **Server actions** (`app/admin/santa-actions.ts`): `saveFamily`, `removeFamily`, `addNewMember`, `joinFamily`, `saveMember`, `removeMember`. Each does `requireSiteSession()`, `requireAdminSession()` and `guardWrite()` first, then `lib/santa.ts` checks the master admin right and the input.
- **Texts (Swedish):** "Skriv numret som 07XXXXXXXX", "Skriv en e-postadress, till exempel namn@exempel.se", "Numret används redan av en annan person.", "Välj en av de andra i familjen.", "Personen är redan med i familjen.", confirmation texts that say what is removed.

## Decisions

- **One person row, many memberships** instead of copying a person into each family: the details live once (R3), "add a known person" is one insert (R4), and the later cards (sign-in by phone, wish list, draw) each hang off the membership.
- **Phone is required and unique.** The card asks for a valid phone and email; MUPP-039 signs in with the phone, so two people must not share one. A new person with a number that already exists is refused with "Numret används redan av en annan person." (pick them under "Lägg till känd person" instead). Email is required too, since mail (TECH-017) needs it; it is not unique.
- **The partner link is kept true in one place.** `setPartner` first clears the old pairs of both people (and whoever pointed at either), then sets both directions, in the same transaction as the edit. The partner must be another membership in the same family; the member themself, another family's member and a made-up id are refused.
- **Orphan people are deleted in code** (`dropPeopleWithoutFamily`) when the last membership goes, by removing a member or a whole family (R2, R3).
- **Master admin only is checked in `lib/santa.ts`,** the same way as `lib/family.ts`: every function takes the actor read from the database and returns "Du kan inte göra det här." for anyone else; `listFamilies` returns nothing for them. The page also does not call it for others.
- **Tabs as a client component with every panel rendered,** not separate pages or a query string: the choice lasts across saves (the page is re-rendered by `revalidatePath`) and the tab is not a link anyone can try. The access control is on the server either way.
- **No partner when adding.** The partner is chosen when editing, where the other members are known; a new member starts without one.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md), [Administrationssidan](../../wiki/manual/admin.md).

[Specifications](../index.md)
