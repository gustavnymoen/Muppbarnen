---
type: Verification
title: "TECH-013 Birthday card hierarchy and small phones: verification"
description: How each requirement of Birthday card hierarchy and small phones was checked, the test suite before and after, and the requirements as built.
feature: TECH-013
---

# Verification of TECH-013

How each requirement was checked. Every browser test below is in `tests/design.spec.ts`, test `TECH-013-R1 R2 R3 R4 R5 R6 the closed cards at …`, run at 320 × 568 and 375 × 667. Before the change was built, its checks were run against the old code: R2 failed at 320 px (chip 58 px high), R1 at 375 px (date 30 px like the name), and R6 at 320 px (the name stayed at 17 px after widening).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-013-R1 | Test: the name is 30 px (`text-3xl`) and the date's font is smaller, at both sizes. The rule is in `DESIGN.md` | local | Pass | 2026-11-03 |
| TECH-013-R2 | Test: the chip is under 40 px high (one line; 30 px at 320 px, 58 before), has both stars and is clear of the picture | local | Pass | 2026-11-03 |
| TECH-013-R3 | Test: "Storlekar" and "Önskelista" are disjoint, at least 44 px high and inside the card; the picture is 78 px at 320 × 568 (floor 72) | local | Pass | 2026-11-03 |
| TECH-013-R4 | Test: the picture's width and height differ by at most 1 px at both sizes (was 96 × 69 and 140 × 121) | local | Pass | 2026-11-03 |
| TECH-013-R5 | Test: on the three-kid card both arrows are 44 px, on the screen, and disjoint from every kid's "Önskelista" and sizes button (each kid scrolled into view). At 320 px the gap is 13 px (was 5); at 375 px the arrows are unchanged | local | Pass | 2026-11-03 |
| TECH-013-R6 | Test (320 px run): "Maximiliana-Charlotte" on the twins' card is under 18 px, and after `setViewportSize(568 × 320)` it is 18 px and fits | local | Pass | 2026-11-03 |
| TECH-013-R7 | The whole suite (`npm run test:time`) passes, the MUPP-014 and MUPP-004 design tests unchanged; measured at 375 × 667 everything below the chip is where it was | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: the change is layout, and `FitName`'s measuring needs a browser (as the plan says); the 141 unit tests pass | local | Pass | 2026-11-03 |
| Browser tests | The new test per phone size (see above); in its own test instead of the MUPP-014 test, which it would have taken to 7 s (the card's test plan is updated) | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: no main page or flow is added or changed | none | n/a | 2026-11-03 |
| Accessibility | `expectNoA11yViolations` on the closed single-kid card and the three-kid card at 320 × 568, in the new test. The checklist on the live site (contrast of the smaller chip and date, the moved arrows' targets, text resize): **not checked**, the change is not deployed | local | Pass (axe); live checklist not checked | 2026-11-03 |
| Security | Security points in the review: passed. `/security-review`: not needed (presentation only) | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |
| Design | Impeccable critique (below). The check on a real phone (320 and 375 px): **not checked** | local | See below | 2026-11-03 |

### Impeccable critique

⚠️ DEGRADED: single-context (sub-agents not authorised in this session; run as a step of the feature, like MUPP-030). The detector (`impeccable detect`) found nothing in `BirthdayDeck.tsx` and `FitName.tsx`. Screenshots before and after at 320 × 568 and 375 × 667 (single-kid card) and 320 × 568 (three-kid card) show: the name is now the first thing read, with the date as a quiet label; the chip sits on one line under the date; the picture is round and fills the room left; nothing overlaps and the card keeps air around "Storlekar" and the wish button; the arrows sit at the deck's edge, clear of the buttons. No must-fix. Noted: the chip fills 171 of the 176 px a 320 px card has, so a wider font could make it touch the card's padding (it stays inside the card); and the cards with several kids keep the large date (`text-3xl`), so the hierarchy differs between the single-kid card and the others, as the card's scope chose. Questions skipped: run from another session as a step of the feature, no user present.

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-006) | 141 unit + 108 browser | 169.5 s | 4.4 s |
| After | 141 unit + 110 browser | 173.4 s (browser) + 0.3 s (unit) | 4.5 s |

Two browser tests added (1.9 s each); the total is within the 3 min budget and grew 2 %.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (except the live and real-phone checks, below); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by 2 %, and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (Live tests): run 41655959512 against the merge `66a2031` passed (2026-11-03)
- [ ] Accessibility: axe passes on the changed states; the checklist items on the live site are not checked yet (after the deploy)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated; `DESIGN.md` has the rule
- [x] No leftovers: `SOLO_AVATAR` is gone; the copies of `disjoint`, `inside` and `toCard` in `tests/design.spec.ts` moved to `tests/helpers.ts`; no commented-out code or debug output
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass; `npm run build` passed as part of `npm run test:local` (the test server builds with `npm run build`)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none noticed

## Requirements as built

### TECH-013-R1 The name leads on the closed single-kid card

- Given a closed card with one kid, when it is shown at any phone size, then the name is `text-3xl` and the date above it is a smaller label (`text-xl`, smaller in rendered size than the name).
- The rule (the name leads, the date is a label) is written in `DESIGN.md`.

### TECH-013-R2 The "Nästa födelsedag" chip fits on one line

- Given the nearest card with one kid at 320 × 568, when it is shown, then the chip is on one line, with both stars, and the picture does not overlap it.
- On screens narrower than 23rem the chip's text is smaller (`text-sm`); at 375 px and wider it is as before.

### TECH-013-R3 "Storlekar" is clear of the wish list button

- Given any closed card with one kid at 320 × 568, when it is shown, then the "Storlekar" button and the "Önskelista" button do not overlap, and both are at least 44 px high and fully inside the card.
- The picture may shrink below 96 px on the lowest screens to make room, down to 72 px (the size on cards with several kids). As built, the card also has less padding and smaller gaps on screens 600 px high or lower.

### TECH-013-R4 The picture is round

- Given a closed card with one kid, when it is shown at 320 × 568 and at 375 × 667, then the picture is as wide as it is high (within 1 px).

### TECH-013-R5 The arrows are clear of the buttons on a card with three kids

- Given a card with three kids at 320 × 568, when it is shown (scrolled to each kid in turn), then neither carousel arrow overlaps any "Önskelista" or sizes button.
- On narrow screens the arrows sit closer to the screen edge, still at least 44 px and fully on the screen; the buttons on the card are unchanged. At 375 px and wider the arrows are where they are now.

### TECH-013-R6 A shrunk name grows back

- Given a long name that `FitName` has shrunk at 320 px, when the screen gets wider (for example the phone is turned), then the name grows back to its full size if it now fits, without the view being drawn again.

### TECH-013-R7 Everything else looks as before

- Given the cards at 375 × 667, when they are shown, then everything outside R1–R6 looks as before: the existing tests in `tests/design.spec.ts` and the feature tests pass unchanged (apart from the sizes that R1–R5 change).

## Notes

- The picture on the closed single-kid card is 129 px at 375 × 667 (was 140 × 121, an oval), so at that size the picture is a little smaller than before; R4 asks for it to be round.
- The real-phone check and the accessibility checklist on the live site are left for after the deploy.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
