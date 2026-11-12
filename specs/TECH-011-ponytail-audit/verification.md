---
type: Verification
title: "TECH-011 Ponytail audit and tidy-up: verification"
description: How each requirement of Ponytail audit and tidy-up was checked, the test suite before and after, and the requirements as built.
feature: TECH-011
---

# Verification of TECH-011

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-011-R1 | Manual: [audit.md](audit.md) exists with seven ranked findings and no personal data (read through). Can't be automated: it is a document. | local | Pass | 2026-11-01 |
| TECH-011-R2 | Manual: every finding in [audit.md](audit.md) has a decision line; the one "own card" finding links [TECH-012](https://github.com/gustavnymoen/Muppbarnen/issues/63), which is on the board. Findings 6 and 7 were decided by Claude, not by the product owner (who said "fix 1–5"): to be confirmed. | local | Pass, 6 and 7 to confirm | 2026-11-01 |
| TECH-011-R3 | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:time` all pass (125 unit, 72 browser). The only new check is four lines in the picture test of `MUPP-003-R6` (`ETag`, `304`, and a `200` after the picture is replaced). No test weakened or deleted. | local | Pass | 2026-11-01 |
| TECH-011-R4 | `wiki/system/admin.md`, `wiki/system/testing.md`, `wiki/system/architecture.md` and `wiki/log.md` updated; `npm run lint:docs` passes. | local | Pass | 2026-11-01 |

## The test plan

How each kind of check in the card's test plan was done (see `wiki/system/testing.md`). Write "not applicable" with the reason where the plan says none.

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`, 125 tests. No new test: nothing the audit fixed was logic with no test. | local | Pass | 2026-11-01 |
| Browser tests | `npm run test:local` through `test:time`, 72 tests; the picture test of `MUPP-003-R6` got the `ETag` checks. | local | Pass | 2026-11-01 |
| Smoke test | Not applicable: no main page or flow changed; the existing smoke tests ran locally and passed. Preview and live: not checked yet. | local | Pass (local) | 2026-11-01 |
| Accessibility | Not applicable: nothing visitors see changed. | | | |
| Security | The route keeps the cookie check first; a test now shows that a matching `If-None-Match` without the cookie still gives `401`. `/security-review` run on the diff: no findings. | local | Pass | 2026-11-01 |
| Code review | [review.md](review.md), run 1: passed, two should-fix points fixed. | local | Passed | 2026-11-01 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-015) | 125 unit + 72 browser | 124.0 s (browser) + 0.2 s (unit) | 4.7 s |
| After | 125 unit + 72 browser | 123.3 s (browser) + 0.2 s (unit) | 4.3 s |

The "before" numbers are from [MUPP-015](../MUPP-015-back-button/verification.md). Run on this computer with four old checkouts in `.claude/worktrees` still present; before finding 1 was fixed, `npm run test:unit` would have counted their test files too (885 files, not 15).

## Definition of Done

- [ ] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit aed6bf8 passed (2026-11-01)
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations`, and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not applicable if visitors see no change)
- [ ] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [ ] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [ ] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [ ] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left: the review passed, see review.md (checked 2026-11-12)
- [ ] Technical tasks for larger improvements noticed along the way added to the board

## Requirements as built

Copied from the card when the task is done.

## Notes

- Removing the four old worktrees in `.claude/worktrees` (3.0 GB, all clean and in `main`) was refused by the permission check, so they are still there; the product owner removes them.
- `npm run typecheck` and the test server build first failed on a stale generated file, `.next/dev/types/validator.ts` (from a dev server run on 2026-10-28, naming a page that does not exist now). It is git-ignored and was moved to the scratchpad; `next dev` generates it again. CI is not affected.
- After the review's small changes (a comment, a test line, documentation) `npm run lint`, `npm run typecheck`, `npm run lint:docs` and the specs `MUPP-003-admin-page` and `smoke` were run again and pass (19 tests); the full suite (125 unit, 72 browser) was run before them.
- Not done yet: the requirements as built (copied from the card at the end), the Done checklist, the push, the deploy and the Live tests.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
