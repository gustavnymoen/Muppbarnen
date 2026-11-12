---
type: Verification
title: "MUPP-018 Description max length: verification"
description: How each requirement of Description max length was checked, the test suite before and after, and the requirements as built.
feature: MUPP-018
---

# Verification of MUPP-018

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-018-R1 | Tests `MUPP-018-R1 …` in `lib/family.test.ts` (100 saved, 101 refused) and `tests/MUPP-018-description-max-length.spec.ts` (field stops at 100, server refuses 101, 100 saved) | local | Pass | 2026-11-02 |

## The test plan

How each kind of check in the card's test plan was done (see `wiki/system/testing.md`). Write "not applicable" with the reason where the plan says none.

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `saveItem` with 100 and 101 characters | local | Pass | 2026-11-02 |
| Browser tests | the admin form stops at 100; server message; axe on the error state | local | Pass | 2026-11-02 |
| Smoke test | not applicable: no main page or flow changes | | | |
| Accessibility | axe in the browser test; the error is a `role=alert` tied to the field (`aria-invalid`). Live checklist: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass | 2026-11-02 |
| Security | limit enforced on the server; `/security-review` not needed (no new route, action or query) | local | Pass | 2026-11-02 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-011) | 125 unit + 72 browser | 123.3 s | 4.3 s |
| After | 126 unit + 73 browser | 125.1 s | 4.7 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit a529356 passed (2026-11-02)
- [x] Accessibility: changed pages and states pass `expectNoA11yViolations`, and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not applicable if visitors see no change)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board

## Requirements as built

Copied from the card when the feature is done, with their acceptance criteria, so the repo shows what was built even if the card changes later.

### MUPP-018-R1 The description is at most 100 characters

The site shall refuse a description longer than 100 characters when a wish is saved, with the message "Högst 100 tecken.", and the form field shall not accept more than 100 characters.

- Given the form for a wish, when the administrator types, then the field stops at 100 characters.
- Given a request that sends 101 characters (bypassing the form), when the wish is saved, then nothing is saved and the answer is "Högst 100 tecken." on the description field.
- Given exactly 100 characters, then the wish is saved.

## Notes

No deviations. `npm run lint`, `lint:docs`, `typecheck`, `build` and `test:time` were run on 2026-11-02. Not checked: the live site (Live tests run after the merge). The live accessibility checklist was reported done by the user (2026-11-09).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
