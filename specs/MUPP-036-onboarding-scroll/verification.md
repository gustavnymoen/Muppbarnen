---
type: Verification
title: "MUPP-036 Onboarding dialog: one button and a scroll cue: verification"
description: How each requirement of the onboarding dialog's one button and scroll cue was checked, the test suite and the requirements as built.
feature: MUPP-036
---

# Verification of MUPP-036

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-036-R1 | Test `MUPP-035-R1 R2 R3 R4 R5 R6 R7 MUPP-036-R1 R2 …` (no "Stäng"; OK closes it) and `MUPP-035-R1 R2 Esc and a press outside …` in `tests/MUPP-035-onboarding-card.spec.ts` | local | Pass | 2026-11-04 |
| MUPP-036-R2 | Same journey (text fits at the default size: OK, no arrow) and `MUPP-035-R6 MUPP-036-R2 …` in `tests/design.spec.ts` at 320 × 568 (arrow, scrolls to OK, a new tab starts at the top, 44 px, axe). Reduced motion (jump instead of glide): code review, a one-line condition. On an iPhone: the user's own check showed the problem; the fix is not checked there yet | local | Pass | 2026-11-04 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic outside the component | | | |
| Browser tests | The MUPP-035 journey and the 320 px test extended; `npm run test:local` | local | Pass, see below | 2026-11-04 |
| Accessibility | axe at 320 px with the arrow; the checklist on the live site: not checked | local | Partly | 2026-11-04 |
| Security | Not applicable: no server code, no new input | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-04 |

## Test suite

No tests added or removed (two extended); `npm run test:time`: 100 browser tests, 170.7 s (before this change 168.9 s; the goal is 170 s, so this is at it; the new checks add no test).

## Definition of Done

- [x] Tests extended and passing; no leftovers; lint, typecheck pass
- [ ] Checked on the live site and on a phone
- [x] Requirements as built below; manual, system docs and log updated

## Requirements as built

### MUPP-036-R1 One close button

The dialog has one button for closing, "OK", and no cross; Esc and a press outside still close it and set the cookie.

### MUPP-036-R2 A cue that there is more

A down arrow named "Läs vidare" stands in place of "OK" while the panel has text below the visible part; the same button is "OK" at the end or when the text fits; a new tab starts at the top; at least 44 px; with reduced motion the panel jumps.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
