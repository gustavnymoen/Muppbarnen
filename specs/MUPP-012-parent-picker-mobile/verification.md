---
type: Verification
title: "MUPP-012 Parent picker in mobile mode: verification"
description: How each requirement of Parent picker in mobile mode was checked, the test suite before and after, and the requirements as built.
feature: MUPP-012
---

# Verification of MUPP-012

How each requirement was checked. All checks are local so far; the live checks are added after the deploy.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-012-R1 | Browser test `MUPP-012-R1 R2 R3 …` in `tests/MUPP-012-parent-picker.spec.ts` at 375 px (the list against the field, as wide, the selected option marked, Escape and click outside close without a change, an option picked with the pointer); test `MUPP-012-R1 R2 on a wide screen …` (under the field at 1280 px, scrolling when there are many options, drawn in body, closed by clicking the field, above the field when there is no room below); look in `tests/design.spec.ts` (`MUPP-012-R1 R2 …`) | local | Pass | 2026-10-29 |
| MUPP-012-R2 | Browser test `MUPP-012-R1 R2 R3 …` (button attributes, Arrow keys, Home, End, typing, Enter, Space, Tab, Escape, focus back on the field); axe with the list open and closed; look of focus in `tests/design.spec.ts`. Screen-reader reading: not checked | local | Pass (screen reader not checked) | 2026-10-29 |
| MUPP-012-R3 | Browser test `MUPP-012-R1 R2 R3 …` (default is the signed-in parent, the picked parent is saved and shown in the edit form); `tests/MUPP-003-admin-page.spec.ts` changed from `selectOption` to `pickOption` (new child with a parent, move to another parent) and still passes | local | Pass | 2026-10-29 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned: the logic is in the interface and tested in the browser | n/a | n/a | 2026-10-29 |
| Browser tests | `tests/MUPP-012-parent-picker.spec.ts` (2 tests), `tests/design.spec.ts` (1 test), `tests/MUPP-003-admin-page.spec.ts` changed to the new control; `pickOption` added to `tests/helpers.ts` | local | Pass | 2026-10-29 |
| Smoke test | Not applicable: the manage page needs sign-in and is not in the read-only smoke test | n/a | n/a | 2026-10-29 |
| Accessibility | axe with the list open (375 px and 1280 px) and the page with it closed; the keyboard and screen-reader items of the checklist on the live site: not checked yet | local | Pass (axe) | 2026-10-29 |
| Security | Not needed per the card: the control only picks among options the server sent, and the server still checks the parent id. Covered by the security points in the review | local | Pass | 2026-10-29 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-29 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-011) | 110 unit, 50 browser | 83.5 s | 3.9 s |
| After | 110 unit, 53 browser | 92.0 s | 4.5 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (10 %), and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations` (done), and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not checked yet)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none)

## Requirements as built

### MUPP-012-R1 The list opens under the field

When the field is activated, the site shows a list of the options directly under it, as wide as the field, in the site's look; if there is no room below, above it. The selected option is marked (bold with a check mark) and the field shows its text. Activating an option closes the list and puts the option in the field; activating outside the list or pressing Escape closes it without a change.

### MUPP-012-R2 The keyboard and screen readers work

The control follows the ARIA pattern for a select-only combobox: the field is a button with `aria-haspopup="listbox"`, `aria-expanded` and a label; the list has the role `listbox` with `option`s and `aria-selected`; Arrow keys, Home, End, Enter, Space, Escape, Tab and typing the first letters work; focus is visible and returns to the field on close.

### MUPP-012-R3 The form behaves as before

The chosen value is sent with the form under the same field name as before (`parentId`), the field keeps its label and its error message, and it is cleared the same way after a saved form, so no server action or other form changes. The default (the signed-in parent) is selected when the form opens.

## Notes

- The control is in `app/components/ListPicker.tsx`, used by `Field` in `Form.tsx`, rather than inside `Form.tsx` itself.
- Focus moves into the list while it is open (the listbox has `aria-activedescendant`), instead of staying on the button; the list is focusable (`tabIndex=0`) because axe requires a scrollable region to be.
- Not checked: a real screen reader and a real phone.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
