---
type: Verification
title: "MUPP-030 Open wish list gets the room: verification"
description: How each requirement of Open wish list gets the room was checked, the test suite before and after, and the requirements as built.
feature: MUPP-030
---

# Verification of MUPP-030

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-030-R1 | Test `MUPP-004-R2 … MUPP-030-R1 one kid …` in `tests/MUPP-004-birthday-card.spec.ts`: the nearest single-kid card has no "Nästa födelsedag" or "Fyller 6 år" with its list open, and both are back when it is folded up (375 × 667). Test `… MUPP-030-R1 R2 R3 the sizes buttons, Tillbaka and the top of an open kid view …` in `tests/design.spec.ts` (320 × 568 and 375 × 667): no chip or age line in the open views of the twins, the single-kid card and Christmas Eve | local | Pass | 2026-11-03 |
| MUPP-030-R2 | Test `… MUPP-030-R1 R2 R3 the sizes buttons, Tillbaka and the top of an open kid view …` in `tests/design.spec.ts` (320 × 568 and 375 × 667): the picture is 40 px, the name is to its right on the same vertical centre, the pair is centred on the card (within 1 px), and "Maximiliana-Charlotte" is on one line, not cut off and inside the card at 320 px | local | Pass | 2026-11-03 |
| MUPP-030-R3 | The same test: the date is vertically centred with the sizes button (within 1 px) and does not overlap it, with Tillbaka on the twins and Christmas Eve (`expectBack` keeps it clear of the heading) and with only the sizes button on the single-kid card; MUPP-020's test keeps it clear of both corner icons at 320 px | local | Pass | 2026-11-03 |
| MUPP-030-R4 | The tests of the closed cards (MUPP-004, MUPP-013, MUPP-014, MUPP-020) pass, and their checks of the closed cards are unchanged (MUPP-004 gained only the two R1 assertions on the open and folded list) | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic (the card says none); `npm run test:unit` passes, 137 tests | local | Pass | 2026-11-03 |
| Browser tests | As above, in `tests/design.spec.ts` at 375 × 667 and 320 × 568 for the three open views, and in MUPP-004; the whole `npm run test:local` passes, 103 tests | local | Pass | 2026-11-03 |
| Smoke test | Not needed: no page or flow is added | – | – | – |
| Accessibility | `expectNoA11yViolations` on the open single-kid view in the design test (both sizes), and on the open twins' and Christmas views in MUPP-004; the name is still the view's `h3`. The checklist in `wiki/system/accessibility.md` on the live site and the check on a phone: not checked yet (after the merge) | local | Pass (local); live not checked | 2026-11-03 |
| Security | Security points in the review: passed; `/security-review` not needed (presentation only) | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`). Before is MUPP-029's run on the same `main`.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 137 unit + 103 browser | 161.6 s (browser) + 0.3 s (unit) | 4.2 s |
| After | 137 unit + 103 browser | 162.8 s (browser) + 0.3 s (unit) | 4.3 s |

No new test: the checks are added to the existing per-size test of the open kid views, which already opens all three, and to MUPP-004's one-kid test.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the phone check is after the merge, below); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (162.8 s, slowest 4.3 s), and the new checks follow the quality rules in `wiki/system/testing.md` (`settledBox`, `animationsDone`, no fixed waits)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes on the changed states; the checklist items on the live site and the phone check are after the merge
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/startsidan.md`), system docs (`wiki/system/start-page.md`, `DESIGN.md`) and `wiki/log.md` updated
- [x] No leftovers: the 72 px picture and the open view's age line and chip are gone; nothing else became unused
- [x] Clean code: reuses `FitName` and `Avatar`; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: `FitName` not growing back in a wider parent, added to TECH-013 (#96)

## Requirements as built

### MUPP-030-R1 Only what the list needs

The site shall, in a view with an open wish list, not show the "Nästa födelsedag" or "Nästa: Julafton" chip and not show the age line ("Fyller X år" or "Beräknad …").

Acceptance criteria:

- **Given** the nearest card with one kid, **when** its wish list is opened, **then** neither the chip nor "Fyller X år" is shown; **when** it is folded up again, **then** both are back as before.
- **Given** a card with several kids or Christmas Eve, **when** a kid is opened, **then** neither the chip nor the age line ("Fyller X år" or "Beräknad …") is shown.

### MUPP-030-R2 Small picture with the name beside it

The site shall, in a view with an open wish list, show the kid's picture at 40 px with the name on one line to its right, the two centred together on the card. A name too long for the line shrinks to fit and never wraps.

Acceptance criteria:

- **Given** an open kid view, **then** the picture is 40 px, the name is to its right on the same line, and the pair is centred.
- **Given** a long name (for example "Maximiliana-Charlotte") at 320 px wide, **then** the name is on one line, fully visible and inside the card.

### MUPP-030-R3 The date on the button row

The site shall, in a view with an open wish list, show the date (or "Julafton") centred on the same row as the corner buttons, between them and without overlapping them.

Acceptance criteria:

- **Given** an open kid view with the back button and the sizes button, at 375 and 320 px wide, **then** the date is vertically centred with the buttons and does not overlap them.
- **Given** a single-kid card with the list open (only the sizes button), **then** the date is on the same row as the sizes button.

### MUPP-030-R4 The closed cards are unchanged

The site shall show the closed cards (one kid, several kids, Christmas Eve) exactly as before.

Acceptance criteria:

- **Given** the existing tests of the closed cards (MUPP-004, MUPP-013, MUPP-014, MUPP-020), **then** they pass unchanged.

## Notes

- The single-kid card in the design test is not the nearest card: made the nearest, its closed card is crowded at 320 × 568 (the chip pushes "Storlekar" onto the wish button). That is the closed cards' crowding in TECH-013, out of scope here, so R1's chip check on the nearest single-kid card is in MUPP-004 at 375 × 667.
- Small and related fixes carried along (CLAUDE.md): `specs/MUPP-029-single-kid-close-motion/verification.md` records that Live tests passed against production for the MUPP-029 merge `f144028` (run 41614915709, 2026-11-03) and that the user checked the single-kid list's opening and closing on their iPhone (2026-11-03); `specs/features.md` has MUPP-029 as Done.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
