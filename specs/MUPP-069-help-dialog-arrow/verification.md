---
type: Verification
title: "MUPP-069 Help dialog arrow over the tabs on iPhone: verification"
description: How each requirement of the help dialog's panel sizing was checked, and the requirements as built.
feature: MUPP-069
---

# Verification of MUPP-069

Run locally 2026-11-12. Not deployed yet. **Not checked on a real iPhone.**

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-069-R1 | Dialog test in `tests/design.spec.ts` (375 and 320 px): the panel is taller than 44 px and starts under the text tabs; WebKit test (iPhone 13) the same | local | Pass (the old code passes too: these engines do not collapse the panel) | 2026-11-12 |
| MUPP-069-R2 | Same tests: the arrow starts at or below the panel's bottom and ends inside the dialog; the size and the checks of MUPP-035-R6, MUPP-036-R2 and MUPP-050-R4 are unchanged | local | Pass | 2026-11-12 |
| MUPP-069-R1 R2 (real) | Manual on an iPhone, Chrome, Safari and the pinned app: open "Så funkar det"; the text shows under the tabs and the arrow under it | phone | Not checked | – |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable | – | – | – |
| Browser tests | `npm run test:time`: 375 unit tests and 166 of 167 browser tests passed; `MUPP-037-R1` timed out at 30 s while the machine was loaded by other work (load average above 10) and passed when run alone (2 of 2); the WebKit run (12 tests) passed | local | Pass | 2026-11-12 |
| Test time | 711 s in total against the budget of 330 s, 11 tests over their limit: measured under heavy load from other sessions, **not** re-measured on a quiet machine; the change adds one block of bounding box reads to an existing test and one WebKit test (not in the normal suite) | local | Not reliably measured | 2026-11-12 |
| Real device | Manual on an iPhone | phone | Not checked | – |
| Smoke test, Security | Not applicable | – | – | – |
| Accessibility | Unchanged markup; axe in the dialog test passes | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Definition of Done

- [ ] Tests: real-phone check not done; test time not measured on a quiet machine
- [ ] Deployed, and Live tests pass
- [ ] Accessibility: live checklist not done
- [x] Requirements match what was built; `solution.md` describes it
- [x] Manual (no change: nothing a visitor does differs), system docs and `wiki/log.md` updated
- [x] No leftovers; lint, lint:docs and typecheck pass
- [x] Code review: Passed, see [review.md](review.md)

## Requirements as built

### MUPP-069-R1 The panel has its height on iOS

The box around the text tabs and the scrolling panel are sized from their content (`flex-auto`, may shrink), not from a 0% basis, so they do not collapse to no height.

### MUPP-069-R2 The arrow is under the panel

The arrow (or OK) is under the panel and inside the dialog, and does not overlap the tab buttons.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
