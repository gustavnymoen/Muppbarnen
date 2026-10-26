---
id: MUPP-000
title: Short name of the feature
---

# Verification of MUPP-000

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-000-R1 | Test `MUPP-000-R1 …` in `tests/MUPP-000-<name>.spec.ts` | local, live | Pass | YYYY-MM-DD |
| MUPP-000-R2 | Manual: … (why it can't be automated) | live | Pass | YYYY-MM-DD |

## The test plan

How each kind of check in the card's test plan was done (see `wiki/system/testing.md`). Write "not applicable" with the reason where the plan says none.

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | … | local, CI | Pass | YYYY-MM-DD |
| Browser tests | … | local, CI | Pass | YYYY-MM-DD |
| Smoke test | … | preview, live | Pass | YYYY-MM-DD |
| Accessibility | axe in …; the checklist items … on the live site | local, live | Pass | YYYY-MM-DD |
| Security | Security points in the review; `/security-review` (if needed) | local | Pass | YYYY-MM-DD |
| Code review | [review.md](review.md) | local | Passed | YYYY-MM-DD |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | … | … s | … s |
| After | … | … s | … s |

## Definition of Done

- [ ] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations`, and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not applicable if visitors see no change)
- [ ] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [ ] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [ ] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [ ] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [ ] Code review done, no must-fix findings left; see [review.md](review.md)
- [ ] Technical tasks for larger improvements noticed along the way added to the board

## Requirements as built

Copied from the card when the feature is done, with their acceptance criteria, so the repo shows what was built even if the card changes later.

### MUPP-000-R1 Short title

…

## Notes

Deviations from the requirements, and anything found during verification.
