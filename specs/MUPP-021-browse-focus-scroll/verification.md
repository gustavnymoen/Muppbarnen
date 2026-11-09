---
type: Verification
title: "MUPP-021 Browse forward with a list open: verification"
description: How each requirement of Browse forward with a list open was checked, the test suite before and after, and the requirements as built.
feature: MUPP-021
---

# Verification of MUPP-021

Checked locally on 2026-11-02. Not deployed yet: Live tests are not done (the user reported the live checklist tested by hand on 2026-11-09).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-021-R1 | Two tests `MUPP-021-R1 …` in `tests/MUPP-021-browse-focus-scroll.spec.ts` (next card with one kid; next card with several kids): deck `scrollLeft` is 0, list open, focus. Both failed before the fix (86 and 208) | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: the logic is in a component | | Not applicable | 2026-11-02 |
| Browser tests | `tests/MUPP-021-browse-focus-scroll.spec.ts` (2 tests, failing before the fix); whole suite run on port 3199 | local | Pass | 2026-11-02 |
| Smoke test | Not applicable: no main page or flow changed | | Not applicable | |
| Accessibility | axe in both tests; the checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Local pass; live checklist reported done | 2026-11-02 |
| Security | Not applicable: no route, action, query or personal data; `/security-review` not needed | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 132 unit + 91 browser | not measured | not measured |
| After | 132 unit + 93 browser | about 163 s (browser, `npx playwright test` on port 3199) + 0.4 s (unit) | not measured |

`npm run test:time` could not run because another session used port 3100; the suite was run directly. Within the 180 s budget.

## Requirements as built

**MUPP-021-R1** When a list is open on a card with one kid and the visitor goes to the next card, the deck is not scrolled sideways, and the next card is centred with its list open (or the overview with the first kid's button focused, if it has several kids).

## Definition of Done

- [x] Tests: every check in the test plan is done locally; unit tests and the browser suite pass
- [x] Test suite: within the time budgets
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: axe passes locally; the live checklist: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements match what was built; `solution.md` describes how
- [x] Manual unchanged (behaviour as described), system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run lint:docs` pass; `npm run build` ran as part of the test server
- [x] Code review done, no must-fix findings; see [review.md](review.md)
