---
type: Verification
title: "MUPP-078 Secret Santa members: partner and top buttons: verification"
description: How each requirement of MUPP-078 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-078
---

# Verification of MUPP-078

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-078-R1 | Unit tests `MUPP-078-R1 …` in `lib/santa.test.ts` (partner both ways, no partner, outside the group or not an id refused, already paired releases the old pair); browser tests `MUPP-078-R1 …` in `tests/MUPP-078-santa-partner-and-scroll.spec.ts` (no field in an empty group, "Ingen" first then the people, with axe; a started group has no card) | local | Pass | 2026-11-15 |
| MUPP-078-R2 | Browser test `MUPP-078-R2 …` in the same file: the document pushed to 120 px, then "Stäng" and "Spara" both bring it back to 0 (fails without the fix, checked). The real iPhone keyboard cannot be tested in the suite | local | Pass (the scroll position); iPhone: see the next row | 2026-11-15 |
| MUPP-078-R2 other cards | The same `Dialog` serves every card; code review, and the existing card tests in `tests/MUPP-045-form-cards.spec.ts` pass | local | Pass | 2026-11-15 |
| MUPP-078-R2 on a device | Manual on an iPhone (home screen and Chrome, a person at the top and one at the bottom of the list): marked done by the user; no details were recorded | live | Pass (as reported by the user) | 2026-11-15 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `addMember` with a partner in `lib/santa.test.ts` | local | Pass | 2026-11-15 |
| Browser tests | The three tests of `tests/MUPP-078-santa-partner-and-scroll.spec.ts`, axe on the open new-person card | local | Pass | 2026-11-15 |
| Smoke test | Not applicable: no main page or flow is added; Live tests after the merge are marked done by the user | | | |
| Accessibility | axe on the new-person card with the Partner field (labelled select); the live checklist is marked done by the user; no per-item details were recorded | local | Pass (axe) | 2026-11-15 |
| Security | Review points by reading; `/security-review` marked done by the user; its result was not recorded here | local | Review passed | 2026-11-15 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-15 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-072, merged main) | 396 unit + 176 browser | 352.2 s | 7.4 s |
| After | 400 unit + 179 browser | 390.4 s | 30.1 s (a failing test) |

Three browser tests fail on `main` too, without this change (checked by restoring the old `Dialog.tsx`): `MUPP-017-R1`, `MUPP-021-R1` and the wish list test `MUPP-013-R5 …` in `design.spec.ts`; they look date dependent and are not caused by this change. The 30 s is that failing test timing out, and it is what puts the total over budget.

## Definition of Done

- [x] Tests: the iPhone check of R2 is marked done by the user; the three tests that failed on `main` were made date-proof by TECH-028
- [x] Deployed, and Live tests pass (marked done by the user)
- [x] Accessibility: live checklist (marked done by the user)
- [x] Requirements in the card match what was built (see below)
- [x] Manual, system docs and log updated
- [x] No leftovers, lint, `lint:docs`, typecheck and build pass
- [x] Code review passed, see [review.md](review.md); `/security-review` marked done by the user

## Requirements as built

### MUPP-078-R1 Partner when adding a person

The "Ny person" card of a group that is not started has the Partner field, as the edit card has: label "Partner", first option "Ingen", then the people in the group; hidden in a group with no one. The new person and the chosen partner point to each other and both rows show "Partner: <name>". "Ingen" adds the person without a partner. A `partnerId` outside the group or not an id is refused with "Välj en av de andra i gruppen." and nothing is saved. A partner who already has a partner releases the old pair, as when editing. A started group still adds nobody.

### MUPP-078-R2 The page stays put after an edit

When an edit card closes (saved, Esc or "Stäng") the document is scrolled back to the top, and once more when the keyboard has gone down, so the page header and the buttons at the top are not left under the status bar on iPhone. Desktop is unchanged.

## Notes

The cause (iOS pushes the document up when the keyboard opens) is likely, not proved. The device check, the live accessibility checklist, `/security-review` and Live tests were marked done by the user on 2026-11-15; no per-item details were recorded.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
