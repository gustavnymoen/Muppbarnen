---
type: Verification
title: "MUPP-007 Warning when removing claimed gifts: verification"
description: How each requirement of Warning when removing claimed gifts was checked, the test suite before and after, and the requirements as built.
feature: MUPP-007
---

# Verification of MUPP-007

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-007-R1 | Browser test `MUPP-007-R1 R2 …` in `tests/MUPP-007-remove-claimed.spec.ts` (text with name and date, accessible description, axe); unit test `MUPP-007-R1 …` in `lib/family.test.ts` (the lists carry who and when) | local | Pass | 2026-11-03 |
| MUPP-007-R2 | Same browser test: focus on "Avbryt", Avbryt and Esc keep the item and the claim, "Ta bort" removes it | local | Pass | 2026-11-03 |
| MUPP-007-R3 | Browser test `MUPP-007-R3 …` (free and unlimited item: usual text, no "paxad"). Archived items: no remove button, covered by `MUPP-031-R5 R7 …` | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/family.test.ts`; `npm run test:unit` 162 passed. No helper is exported, so no test of the text itself (see solution.md) | local | Pass | 2026-11-03 |
| Browser tests | `tests/MUPP-007-remove-claimed.spec.ts` (2 tests); `npm run test:time` 114 passed | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: admin only, the card names none | | | |
| Accessibility | axe on the dialog with the warning; the checklist on the live site: **not checked** (after the deploy) | local | Pass (axe); live not checked | 2026-11-03 |
| Security | Security points in the review; `/security-review`: no findings | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 161 unit + 112 browser | 178.0 s (browser) + 0.3 s (unit) | 4.6 s |
| After | 162 unit + 114 browser | 176.3 s (all browser tests) | 4.5 s |

Two browser tests (about 1 s each) and one unit test added; within the 180 s budget. Lint, `lint:docs`, type check and build pass.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (except the live checklist); `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, new tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet, after the merge
- [ ] Accessibility: axe passes; the live checklist is not checked yet
- [x] Requirements in the card match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: reuses `ConfirmAction`, `dayAndMonth`, `parseDate`; lint, `lint:docs`, typecheck and build pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

Copied from the card (#14) on 2026-11-03.

### MUPP-007-R1 Warning when removing a claimed active present

The site warns a parent who removes an item that is claimed and active (not archived), and says who claimed it and on which day ("Cykel är paxad av Moster Lisa 30 oktober. Hen kan redan ha köpt den."), in addition to the usual text. The warning is part of the dialog's description for screen readers.

### MUPP-007-R2 Go ahead or cancel

"Avbryt" (or Esc) keeps the item and its claim; confirming removes the item as before. Focus starts on "Avbryt".

### MUPP-007-R3 No warning otherwise

An unclaimed or unlimited item gives the usual dialog. Archived items have no remove button.

## Notes

The warning is built when the page is rendered; a claim made after the page was opened is not shown.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
