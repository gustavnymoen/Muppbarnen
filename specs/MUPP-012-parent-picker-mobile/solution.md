---
type: Solution
title: "MUPP-012 Parent picker in mobile mode: solution"
description: How the parent picker is the site's own accessible list instead of the browser's select, and the decisions behind it.
feature: MUPP-012
card: "#33"
depends_on: [MUPP-003, MUPP-010]
---

# MUPP-012 Parent picker in mobile mode: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 33`.

## Data

None. The value is still the parent's id, sent under the field's name (`parentId`); the server action and its check of the id are unchanged.

## Interface

- **`app/components/ListPicker.tsx`:** the control. A button (`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, named by the field's label and its own text) and, while open, a `ul` with `role="listbox"` and `li` options with `aria-selected`. The value is sent in a hidden input with the field's name (R3). Keyboard (R2): on the button Arrow Down/Up, Enter and Space open it at the selected option, Home and End open it at the first or last, a letter opens it at the next option that starts with it; in the list the arrows, Home and End move, a letter (or several, within half a second) jumps, Enter and Space choose, Escape closes, Tab chooses and moves on. Focus moves to the list when it opens and back to the button when it closes.
- **`app/components/Form.tsx`:** the `select` type of `Field` renders `ListPicker` instead of `<select>`; the label gets an id so the button can use it. Error message and hint are linked with `aria-describedby` as before.
- The picker is in a file of its own, not in `Form.tsx`, to keep `Form.tsx` about forms; `Field` is still the only place that uses it.
- Looks (R1): the button is the same `control` class as the other fields, with a chevron; the list is card-coloured with an edge and the card shadow, rows of at least 44 px, the active row in the edge colour, the selected row bold with a check mark in the brand colour. No new tokens.
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **Own list, not the native one.** The browser's pop-up cannot be styled and, in the desktop browser's mobile mode, opens in the corner. A list the site draws is the same everywhere. On a real phone it is less "native" (no wheel), which is acceptable for a few parents.
- **Rendered in `document.body`, placed with `position: fixed`.** The folded panels (`Fold.tsx`) clip their content while they animate, so a list inside would be cut. The position is set in a layout effect straight on the element (no state, no flicker) from the field's rectangle, and again on scroll and resize. It opens below the field, or above when there is more room there; it gets a maximum height of 16 rem and scrolls.
- **Focus in the list, `aria-activedescendant`.** A button may not have `aria-activedescendant`, so focus moves into the listbox, which may. The list is `tabIndex=0` because axe requires a scrollable region to be reachable by keyboard. Closing on blur handles a click outside and a switch of window without a document listener; blur to the button itself is ignored so clicking the field closes it.
- **Escape stops at the list.** React events bubble through portals to the panel, whose Escape handler would fold the whole form; the list stops it.
- **Tab chooses.** It focuses the button and lets the browser move on from there, since the list lives at the end of `body` and Tab from there would leave the form.
- **Reset after saving.** React resets the form after a saved action; the picker listens for the form's `reset` event and goes back to its first value, as the native select did.
- **No dependency.** About 200 lines; a library (Headless UI, Radix) would be a new package for one field.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md), [Admin page](../../wiki/system/admin.md), [Admin manual](../../wiki/manual/admin.md).

[Specifications](../index.md)
