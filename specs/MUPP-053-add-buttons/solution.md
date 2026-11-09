---
type: Solution
title: "MUPP-053 Plus buttons for adding: solution"
description: "How adding is shown: a round plus button for a row in a list or frame, a centred text button for a new top-level object, framed lists of parents and kids, Ny grupp, and a swap icon."
feature: MUPP-053
card: "#157"
depends_on: [MUPP-045, MUPP-038, MUPP-040]
---

# MUPP-053 Plus buttons for adding: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 157`.

## Data

None. No migration and no server action changed.

## Interface

- **`FormCard`** (`app/components/FormCard.tsx`) gets the prop `add`: the button is a round `IconButton` (44 × 44 px, `round`, not `compact`) with `PlusIcon` and the accessible name from `label`. The icon and text variants are as before.
- **`AddRow`** (same file): the row at the bottom of a frame that holds the add button, centred (`flex flex-wrap justify-center`). Used for the wish lists (`WishlistSection`, `WishLists`), the persons of a group (next to "Lägg till känd person", which stays a text button), the parents and the kids on the manage page, and "Ny grupp".
- **Manage page** (`app/admin/hantera/page.tsx`): "Föräldrar" and "Barn" are each a `Card` (a framed section like the wish lists) with the plus at the bottom.
- **`SantaTab`**: heading "Grupper", empty text "Inga grupper ännu.", the text button "Ny grupp" centred under the groups, the field "Gruppens namn".
- **`/admin`** (`app/admin/page.tsx`): "Inloggad som <förälder>" and a round `IconButton` with the new `SwapIcon` (`type="submit"` in the same form as before) named "Byt förälder", on one row (no wrapping).
- **`DESIGN.md`** has the rules in "Add buttons".
- Names are unchanged ("Ny önskning, Födelsedag", "Ny person i Familjen Ek", "Nytt barn", "Ny förälder"), so the screen reader hears the same as before and the old tests that find buttons by name still work; the visible text is gone (the `title` shows the name as a tooltip).

## Decisions

- **44 px, not 32 px.** The card asks for a touch target of at least 44 px for the plus, and the other add buttons were 44 px high, so the plus is the standard icon button size, not the compact 32 px of the pencil and the trash can (those sit in a row of many buttons; the plus stands alone).
- **One component, two modifiers.** `add` is a prop of `FormCard` rather than a new component: the card, the focus return and the motion are the same as for every form card, only the button differs. The old `text` on the icon variant is kept for "Storlekar".
- **Centred, not left-aligned.** Both were tried on a phone in the running site (a screenshot of each in the Secret Santa tab and the manage page); the centred plus matches the centred "Ny grupp" and does not look like a leftover row. The choice is in `DESIGN.md`.
- **No "Töm listan" button** (decided by the user when looking at the running site; first tried as a small text button "Töm"): its trash can in the list header looked like the trash can of a row, and items are removed one at a time. Removed: the button, the server action `clearList` (`app/admin/actions.ts`), `family.clearList` (`lib/family.ts`), their unit tests (including `MUPP-031-R5 Töm listan …`) and the step of `MUPP-003` that emptied a list; `ConfirmAction` is back to its trash can only. The older specs (MUPP-003, MUPP-031) still describe the button as it was built.
- **Frames with `Card`**, the component the wish lists already use, instead of a new frame style.
- **Look checks in `tests/design.spec.ts`**, in the tests of their page and state (admin start at 360 px, manage page, Secret Santa tab, the participant's page); behaviour per requirement in `tests/MUPP-053-add-buttons.spec.ts`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md), [Admin page](../../wiki/system/admin.md), [Admin manual](../../wiki/manual/admin.md), [Secret Santa manual](../../wiki/manual/secret-santa.md), [DESIGN.md](../../DESIGN.md).

[Specifications](../index.md)
