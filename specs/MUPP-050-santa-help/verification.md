---
type: Verification
title: "MUPP-050 Secret Santa help dialog: verification"
description: How each requirement of the Secret Santa help dialog was checked, the test suite before and after, and the requirements as built.
feature: MUPP-050
---

# Verification of MUPP-050

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-050-R1 | Test `MUPP-050-R1 R2 R3 R7 …` in `tests/MUPP-050-santa-help.spec.ts`; `tests/MUPP-035-onboarding-card.spec.ts` (menu text) | local | Pass | 2026-11-12 |
| MUPP-050-R2 | Same test (tabs, arrow keys, panels) | local | Pass | 2026-11-12 |
| MUPP-050-R3 | Same test (six and seven bullets, the mail address, the closing sentence) | local | Pass | 2026-11-12 |
| MUPP-050-R4 | Test `MUPP-035-R6 MUPP-036-R2 MUPP-050-R4 …` in `tests/design.spec.ts` (same box on the four texts, button in the same place, 44 px, top tabs on one line, 320 px) | local | Pass | 2026-11-12 |
| MUPP-050-R5 | Test `MUPP-050-R5 …` and `MUPP-050-R5 R6 …` | local | Pass | 2026-11-12 |
| MUPP-050-R6 | Test `MUPP-050-R5 R6 …` (closing on Secret Santa sets the cookie) | local | Pass | 2026-11-12 |
| MUPP-050-R7 | Axe on all four texts in the R1 test; Esc and focus back in the same test | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic beyond choosing a tab | | | |
| Browser tests | The three tests of `MUPP-050-santa-help.spec.ts`, and the changed ones in `MUPP-035`, `MUPP-045`, `MUPP-002` and `design.spec.ts` | local | Pass | 2026-11-12 |
| Smoke test | Not applicable: the dialog is not a main page or flow; Live tests passed on the merge commit | live | Pass | 2026-11-12 |
| Accessibility | Axe in the tests; the checklist items of `wiki/system/accessibility.md` on the live site, checked by the user | local, live | Pass | 2026-11-12 |
| Security | Not needed: fixed texts, existing cookie, no new input | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

`npm run test:time` on 2026-11-12 after the change: 369 unit tests and 165 browser tests (3 of them new, the rest changed or as before), 331.4 s, over the 180 s budget as it already was before this card ([TECH-019](https://github.com/gustavnymoen/Muppbarnen/issues/160)); the slowest tests are not this card's (6.9 s). Not measured before the change; the card adds three short tests (each under 3 s) and no page loads beyond them.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured | not measured | not measured |
| After | 165 browser, 369 unit | 331.4 s | 6.9 s |

## Requirements as built

As on the card (`gh issue view 151`): R1 renamed dialog and menu item "Så funkar det"; R2 two underlined top tabs "Barnens listor" and "Secret Santa"; R3 the Secret Santa guide with Deltagare and Admin; R4 the same size on every tab; R5 which tab opens (Secret Santa on a Secret Santa page, otherwise Barnens listor; every opening starts fresh); R6 the seen cookie on either guide; R7 keyboard and screen reader.

## Definition of Done

- [x] Tests: the card's checks are done and `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: within the time budgets: no, over budget since before this card (TECH-019)
- [x] Deployed, and the smoke tests pass against production (Live tests, merge commit 773b68f)
- [x] Accessibility: axe passes in the tests; the live checklist was checked by the user
- [x] Requirements in the card match what was built, no open questions left
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers; clean code (`npm run lint`, `npm run lint:docs`, `npm run typecheck`, `npm run build`)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
