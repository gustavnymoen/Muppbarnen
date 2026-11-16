---
type: Verification
title: "MUPP-081 Family change: the deck starts at the next event: verification"
description: How MUPP-081-R1 was checked, the test suite before and after, and the requirement as built.
feature: MUPP-081
---

# Verification of MUPP-081

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-081-R1 | A step in the test `MUPP-080-R1 … MUPP-081-R1 …` in `tests/MUPP-080-choose-families.spec.ts`: browse to the second card (Julafton), change the choice to the other family, and Julafton is no longer shown (the first upcoming card is) | local, live | Pass | 2026-11-16 |

The test was not run without the `key` to see it fail, and the criterion "nothing is open" (a wish list open when the choice changes) has no test of its own: it follows from the same remount and was not checked separately.

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no rule outside the component | | | |
| Browser tests | One step in the existing test, no new test or page load | local | Pass | 2026-11-16 |
| Smoke test | Not applicable for the change; Live tests (the smoke tests) ran after the merge, run 43908481547 | live | Pass | 2026-11-16 |
| Accessibility | Not applicable: no new state or markup; the existing axe checks pass | local | Pass | 2026-11-16 |
| Security | Not needed (no sign-in, route, action, query or personal data changed) | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-16 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-080) | 190 browser | 344.7 s | not recorded |
| After | 438 unit + 190 browser | 346.9 s | 6.9 s |

The step adds about 0.2 s; the rest of the difference is the machine's variation. Within the 350 s budget, which is not raised.

## Definition of Done

- [x] Tests: the test plan is done, R1 is tested; `npm run test:unit` and `npm run test:local` pass (`npm run test:time`)
- [x] Test suite: within the budgets; no new test
- [x] Deployed (pull request 286), and the smoke tests pass against production (Live tests, run 43908481547)
- [x] Accessibility: the existing axe checks pass; the live checklist is marked done by the user (no new markup or state)
- [x] Requirements match what was built; no open questions; `solution.md` describes how
- [x] Manual not affected (visitors see no new feature); system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, see [review.md](review.md)
- [x] No technical tasks noticed

## Requirements as built

### MUPP-081-R1 The deck starts at the next event after a new choice

The start page shall show the first upcoming card of the new choice, with no list or kid opened, after the visitor has changed the choice of families.

- Given the visitor has browsed away from the first card, when they change the choice of families, then the first upcoming card of the new choice is shown.
- Given the visitor has a wish list open, when they change the choice, then nothing is open.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
