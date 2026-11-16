---
type: Solution
title: "MUPP-073 Families: solution"
description: "How families are built: data, interface and decisions and why."
feature: MUPP-073
card: "#255"
depends_on: [MUPP-048]
---

# MUPP-073 Families: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 255`.

## Data

Migration `db/migrations/016_families.sql`:

- `family (id, name, description)` with `description` at most 30 characters and a unique index on `lower(trim(name))`.
- `parent_family (parent_id, family_id)`, many-to-many; deleting a parent removes its rows.
- `ss_event.family_id` referencing `family`. It is nullable in the table (SQLite cannot add a `NOT NULL` column that references another table without rebuilding it), and every row is filled: the migration creates one default family "Familj" and puts all parents and all Secret Santa in it, and two triggers give a parent or Secret Santa inserted without a family the first one. The code always sets a family and checks it.

## Interface

- `lib/families.ts`: the rules (`saveFamily`, `removeFamily`, `familiesFor`, `checkFamilyIds`, `setParentFamilies`). `saveParent` and `saveEvent` take the family choice; `saveEvent` gets it from `chooseFamily` in `lib/santa.ts`.
- Hantera (`app/admin/hantera/page.tsx`): a "Familjer" card with a slim row per family (description, then "N förälder(föräldrar), N Secret Santa" on its own line), and "Välj de familjer föräldern tillhör." with one checkbox per family in the parent form (`CheckGroup` in `app/components/Form.tsx`, fields `family-<id>`).
- Secret Santa form (`app/admin/SantaTab.tsx`): the field "Familj" appears only when the admin can choose between more than one; the card says "Familj: …" in the same case.
- Wording: the word "grupp" is replaced by "Secret Santa" in everything admins and visitors read (forms, errors, mails, the "Så funkar det" text, the manuals), so a family and a Secret Santa are not mixed up. The address `?grupp=` and the code keep their names.

## Decisions

- **No NULL, a default family.** The migration puts everything in one family instead of leaving NULL, so no code has to handle a row without a family, and the site looks the same until the master admin splits it up.
- **Triggers for the default.** Existing tests and scripts insert parents and Secret Santa straight into the database; the triggers keep them valid without changing every helper.
- **A family is not a security boundary.** Everyone has the same site password; families only sort what is shown (MUPP-080).
- **Ordinary admins choose only among their own families**, checked on the server (`chooseFamily`), and are asked only when there is more than one.
- The master admin's checkbox group is its own component because the generic `Field` knows one error per field name.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Administration (system)](../../wiki/system/admin.md), the manual [Administration](../../wiki/manual/admin.md).

[Specifications](../index.md)
