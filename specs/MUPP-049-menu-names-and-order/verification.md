---
type: Verification
title: "MUPP-049 Menu names and order: verification"
description: How each requirement of Menu names and order was checked, the test suite before and after, and the requirements as built.
feature: MUPP-049
---

# Verification of MUPP-049

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-049-R1 | Test `MUPP-002-R1 R2 R4 MUPP-049-R1 R2 …` in `tests/MUPP-002-start-page.spec.ts`: the links read Barnens listor, Secret Santa, Admin and the one button Så funkar listorna; `MUPP-003-R8` checks the links too | local | Pass | 2026-11-09 |
| MUPP-049-R2 | Same tests: the list items of the open menu are in the order Barnens listor, Secret Santa, Så funkar listorna, Admin (`tests/MUPP-035-onboarding-card.spec.ts`), and the Tab order follows it; the muted Admin colour is checked in `tests/design.spec.ts` | local | Pass | 2026-11-09 |
| MUPP-049-R3 | Test `MUPP-035-R1 … MUPP-049-R1 R2 R3 …`: the dialog is found by the name "Så funkar listorna", and Esc returns focus to "Meny" | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: only words and order changed; the 211 existing unit tests pass | local | Pass | 2026-11-09 |
| Browser tests | The menu and dialog tests above, with `expectNoA11yViolations` on the open menu | local | Pass | 2026-11-09 |
| Smoke test | The existing smoke tests name no menu entry, so none changed | local | Pass | 2026-11-09 |
| Accessibility | axe on the open menu in the tests above; the live-site checklist: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (live checklist reported done) | 2026-11-09 |
| Security | Not applicable: no route, query or data change | local | n/a | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time`. No test was added or removed. The "before" numbers are from [TECH-018](../TECH-018-test-suite-room-again/verification.md) (111 tests, about 178 s); `main` has since gained the tests of MUPP-045, 047 and 053, so they are not comparable.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 111 (TECH-018) | about 178 s | not recorded |
| After | 121 | 248.5 s (over the 180 s budget) | 7.3 s |

The run was made while other test runs and builds were using the machine (a second `test:time` of mine had also been started by mistake), so the time is not reliable; my change adds no test and no work to the tests. Not rerun on a quiet machine. CI's number is the one to trust.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: over budget in a noisy local run (see above); CI to confirm; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 7006781 passed (2026-11-09)
- [x] Accessibility: axe passes locally; the live-site checklist: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none needed

## Requirements as built

### MUPP-049-R1 Names

The menu shall show the entries "Barnens listor", "Secret Santa", "Så funkar listorna" and "Admin", and no entry named "Start" or "Så funkar sajten".

- **Given** the open menu, **then** its entries read exactly those four names.

### MUPP-049-R2 Order

The entries shall come in the order Barnens listor, Secret Santa, Så funkar listorna, Admin.

- **Given** the open menu, **then** the entries are in that order, and Admin is last and dimmed as before.

### MUPP-049-R3 Dialog name

The dialog opened by "Så funkar listorna" shall have the heading and accessible name "Så funkar listorna".

- **Given** the entry is pressed, **then** a dialog named "Så funkar listorna" opens, and focus returns to the menu button when it closes, as before (MUPP-035-R3).

## Notes

No deviations. The older specs of MUPP-002 and MUPP-035 keep the words they were built with.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
