---
type: Verification
title: "MUPP-053 Plus buttons for adding: verification"
description: How each requirement of Plus buttons for adding was checked, the test suite before and after, and the requirements as built.
feature: MUPP-053
---

# Verification of MUPP-053

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-053-R1 | Tests `MUPP-053-R1 R2 R4 …` and `MUPP-053-R1 R3 …` in `tests/MUPP-053-add-buttons.spec.ts` (name, no text, same form opens, axe); 44 px and round in `tests/design.spec.ts` (`MUPP-003-R8 … MUPP-053-R1`, `MUPP-038-R1 … MUPP-053-R1 R3`, `MUPP-040-R1 R2 MUPP-053-R1`) | local | Pass | 2026-11-09 |
| MUPP-053-R2 | Test `TECH-006-R4 MUPP-053-R2 R4` in `tests/design.spec.ts` (frame, 44 px plus centred inside it under the last row); the two placements were tried in the running site on a phone with a screenshot of each, centred chosen (`DESIGN.md`) | local | Pass | 2026-11-09 |
| MUPP-053-R3 | Test `MUPP-053-R1 R3 …` (heading, button text, no "Familjer"/"Ny familj"); centred and 44 px in `tests/design.spec.ts` at 320 px | local | Pass | 2026-11-09 |
| MUPP-053-R4 | Test `MUPP-053-R1 R2 R4 …` (text, name, swap returns to the list); one row at 360 px, 44 px in `TECH-006-R4 MUPP-053-R2 R4` | local | Pass | 2026-11-09 |
| MUPP-053-R5 | Code review of `DESIGN.md` ("Add buttons"): rules for plus, centred text button and swap icon (documentation, no test) | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic. `npm run test:unit` still passes (212) | local | Pass | 2026-11-09 |
| Browser tests | Old tests that clicked or read the old texts updated (MUPP-003, 010, 038, 045); new tests per requirement; look checks in `design.spec.ts` | local | Pass | 2026-11-09 |
| Smoke test | Not applicable: no main page or flow added | | | |
| Accessibility | axe on `/admin`, `/admin/hantera`, the wish lists page, the Secret Santa tab and a participant's page (in the new tests). The checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-09 |
| Security | Not applicable: no server action, data or route changed | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time` before (`main` at 681ea93) and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 119 browser, 212 unit | 237.1 s | 7.4 s |
| After | 121 browser, 212 unit | 251.2 s | 7.4 s |

The browser suite was already over its 180 s budget on `main` (TECH-019 is about that and is not tried here). This change adds 14.1 s (+6 %, under the 25 % limit): two new tests (one of them, 5.2 s, is just over the 5 s per-test budget) and the extra checks in existing design tests. The numbers were measured on a busy machine, so the difference between runs is partly noise.

## Definition of Done

- [x] Tests: every check in the test plan is done; every requirement is tested or has a recorded check; unit and local tests pass
- [x] Test suite: over budget before and after (TECH-019); growth 6 %; the new tests follow the rules, one is 0.2 s over 5 s; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit e384c23 passed (2026-11-09)
- [x] Accessibility: axe passes; the live checklist in `wiki/system/accessibility.md`: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements in the card match what was built (R2 records the placement), copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the old text buttons and the temporary screenshot test are gone
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck`, `build` pass
- [x] Code review: passed, see [review.md](review.md), no must-fix findings
- [x] No larger improvements found

## Requirements as built

### MUPP-053-R1 Plus button for rows in a list
"Ny önskning" (all wish lists), "Ny person", "Nytt barn" and "Ny förälder" are a round 44 × 44 px plus icon button with an accessible name (for example "Ny person i Familjen Ek") that opens the same form card as before.

### MUPP-053-R2 Frames around parents and children
Parents and kids on the manage page are each a framed `Card` with the plus button inside, at the bottom of every container (wish lists, persons, parents, kids). Placement: centred (left-aligned was tried and rejected, see `DESIGN.md`).

### MUPP-053-R3 "Ny grupp"
On the Secret Santa tab the button is the centred text button "Ny grupp", the heading is "Grupper"; "event" and "familj" are not used for the groups in the interface.

### MUPP-053-R4 Logged-in parent and swap icon
`/admin` shows "Inloggad som <förälder>" and a swap icon button named "Byt förälder" (same behaviour) on one row at 360 px.

### MUPP-053-R5 Rules in DESIGN.md
`DESIGN.md` "Add buttons" says when to use a plus, a centred text button and the swap icon.

## Notes

- The visible text "Familj" remains in the form's heading and texts where it is data (family names, "Familjen Ek") and in some other Secret Santa texts outside the admin tab (for example "Byt familj" on the entrance); the card only renames the admin tab's heading, button and field.
- Added after the card was written, at the user's request: the "Töm listan" button was removed (no list-wide delete; remove one item at a time), with `clearList` in the server actions and `family.ts` and its tests. That ends the behaviour of MUPP-031-R5 (its unit test is removed) and the "Töm listan" step of MUPP-003; those specs are kept as built. Checked by lint, typecheck and the tests below.
- `FormCard` keeps `text` on the icon variant ("Storlekar" on `/admin`); only the add buttons lost their text.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
