---
type: Solution
title: "MUPP-010 Compact admin: solution"
description: How the compact admin is built - one fold group, one icon button, slim cards and the removal of a kid's picture - and the decisions behind it.
feature: MUPP-010
card: "#30"
depends_on: [MUPP-001, MUPP-003]
---

# MUPP-010 Compact admin: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 30`.

## Data

None. A kid's picture is still only the generated file name in `child.picture`; removing it sets the column to `''`. The original file name is not kept, so a row says "Bild" (no migration).

## Interface

- **`app/components/Fold.tsx`** (client): the one place for folding (R3). `FoldGroup` holds which panel is open (`openId`), so at most one is. `FoldToggle` (an icon button) and `FoldButton` (a text button) open and close the panel with the same id and carry `aria-expanded` and `aria-controls`; `FoldPanel` shows its children only while open, folds on Esc (not when Esc is meant for a dialog inside it) and gives focus back to the button that opened it. `Form` folds the panel when it has saved (`keepOpen` for the sizes, where "Sparat." is read out). A page puts one `FoldGroup` around everything that should fold each other: the whole page.
- **`app/components/SlimCard.tsx`**: the slim card (R1): an `<article>` with a row (thumbnail, heading, optional small note, icon buttons) and the folding panels below it. A folded card is about 50 px high.
- **`app/components/Button.tsx`**: `IconButton` got `compact` (32 × 32 px, R2; the default stays 44 × 44 px for the menu) and every icon button has a `title` with its accessible name as the tooltip; `IconLink` is the same look for a link (the list icon). `app/components/icons.tsx` has the icons (pencil, trash can, picture, checklist, measuring tape), drawn inline and hidden from screen readers.
- **`ConfirmAction`** is now a trash can icon button ("Ta bort Otis"); the dialog is as before. `Disclosure` (a `<details>`) is deleted: `Fold.tsx` replaced it.
- **`Heading`** has `small`, used in the admin (R6).
- **Pages:** `/admin/hantera` has the headings "Föräldrar" and "Barn" with a stack of slim cards each, and "Ny förälder" / "Nytt barn" buttons. A card has the icons checklist (kids), pencil, picture (kids) and trash can. The pencil opens the information (a 56 px picture beside the birthdate and parent) and the form; the picture icon opens a panel with, when there is a picture, a row (thumbnail, "Bild", trash can "Ta bort bilden för Otis") above the file field. `/admin` shows each kid as a slim card with two icon links: a measuring tape "Storlekar för Otis" (to the kid's page with `?oppna=storlekar`, which opens the sizes card through `FoldGroup`'s `initialOpen`) and a checklist "Önskelistor för Otis" (the sizes are no longer shown on the card: they are on the kid's page, R5). `/admin/barn/[id]` has the sizes as a slim card of their own (pencil "Ändra storlekar"), then "Födelsedag" and "Jul" as separate cards whose items are slim rows (pencil unfolds details and form), "Ny önskning" and "Töm listan" (trash can).
- **Server action `removeChildPicture`** (`app/admin/actions.ts`): site check, admin check, `guardWrite()`, then `family.clearChildPicture`; the file is removed from the store only after the database is updated. Messages: "Du kan inte göra det här." for anyone but the master admin or an unknown kid.
- **`lib/family.ts`**: `clearChildPicture(actor, id)` uses `childForPicture` (master admin only, id validated by `parseId`), clears the column and gives back the old name.
- **Texts** (Swedish): "Ändra X", "Ta bort X", "Bild för X", "Önskelistor för X", "Ändra storlekar", "Ta bort bilden för X", the confirmation "Ta bort bilden för X?" with "X:s bild tas bort och X visas med sin initial i stället. Det går inte att ångra."
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **One fold group per page, not per list.** The card says at most one is open "in a list", but a phone shows one page at a time and two open forms push each other off the screen, so the whole page is one group. It is also simpler: one context, no nesting.
- **A panel's content exists only while it is open.** A form starts fresh each time and a closed card costs nothing in the DOM; the empty panel `<div>` stays so `aria-controls` always points at something.
- **A trash can in `ConfirmAction` for every use.** Every confirmation in the admin removes something, so the trigger is always the trash can; `label` still names the dialog's confirm button ("Ta bort", "Töm listan").
- **Icon buttons are 32 × 32 px with 8 px between them** (the owner's decision; WCAG 2.2 AA asks for 24 px). This changes MUPP-001-R4 for these buttons only. The test of MUPP-003-R8 measures buttons with a `title` against 32 px and the rest against 44 px.
- **The sizes chips left the parent's page.** A folded card shows only thumbnail, name and icons (R1), so the chips would have been hidden anyway; the sizes are on the kid's page in their own card.
- **No new kid-removal path for the file.** The file is removed with the same `removePicture` that already handles replace and kid removal; a failure to remove it is logged and does not undo the database change (an orphan file is harmless, a kid still pointing at a missing file is not).

- **Two links on the parent's page, as the owner asked after trying it:** sizes and wish lists are what a parent edits, so each has its own icon; the sizes link opens the sizes card with a `?oppna=storlekar` search parameter (only that value is read, anything else is ignored).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md), [Design system](../../wiki/system/design.md), the manual [Administrationssidan](../../wiki/manual/admin.md); builds on [MUPP-003](../MUPP-003-admin-page/solution.md).

[Specifications](../index.md)
