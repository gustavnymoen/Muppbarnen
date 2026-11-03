---
type: Verification
title: "TECH-010 Flaky picture thumbnail in MUPP-010-R4: verification"
description: How each requirement of the thumbnail flake card was checked, the test suite before and after, and the requirements as built.
feature: TECH-010
---

# Verification of TECH-010

How each requirement was checked. All runs below were under load: 12 `yes` processes on the 10 CPUs, as in TECH-009.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-010-R1 | `MUPP-010-compact-admin.spec.ts --repeat-each 20` under load on `c70e674` (current `main`, 1 run), `5c35a28` (before MUPP-024, 1 run) and `ec4de06` (TECH-009, 2 runs): 640 passed, `MUPP-010-R4` 0 of 80 failed. Not reproduced, so there is no trace of a late step; recorded in [solution.md](solution.md) | local | Pass (not reproduced, recorded) | 2026-11-03 |
| TECH-010-R2 | Code review: `tests/MUPP-010-compact-admin.spec.ts` and the site are unchanged (no pause, no timeout), as R2 says when the cause is not found | local | Pass | 2026-11-03 |
| TECH-010-R3 | `MUPP-002-start-page`, `MUPP-004-birthday-card`, `MUPP-010-compact-admin` and `MUPP-012-parent-picker` with `--repeat-each 20` under load, three runs in a row: 320 passed, 320 passed, 320 passed (about 10 min each) | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable (card): no logic changes; `npm run test:unit`: 137 passed | local | Pass | 2026-11-03 |
| Browser tests | No new tests (card); the existing `MUPP-010-R4` is the proof (R1, R3); `npm run test:local`: 103 passed | local | Pass | 2026-11-03 |
| Smoke test | Not applicable (card): no page or flow changes | – | Not applicable | 2026-11-03 |
| Accessibility | Not applicable: visitors see no change | – | Not applicable | 2026-11-03 |
| Security | Not applicable (card): no code changes | – | Not applicable | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`). No test changed; the difference is the spread between runs on this machine.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-030) | 137 unit + 103 browser | 162.8 s | 4.3 s |
| After | 137 unit + 103 browser | 168.6 s | 4.7 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is checked (R1 and R3 by runs under load, R2 by code review); `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (168.6 s of 180 s, slowest 4.7 s of 5 s); no test was added or changed
- [x] Deployed, and the smoke tests pass against production (Live tests): run 41642127355 against the merge `1accb989` passed (2026-11-03)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built (R1 and R2 reworded with the user, 2026-11-03, since the failure was not reproduced), no open questions left; copied below as built; `solution.md` describes what was done
- [x] Manual: not applicable (nothing to use); system docs (`wiki/system/testing.md`) and `wiki/log.md` updated
- [x] No leftovers: no code changed; the scratch worktree of the old commits is removed
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none noticed in this work

## Requirements as built

### TECH-010-R1 The failure is looked for

The failure is looked for under load, on the current code and on the code where it was seen (TECH-009, `ec4de06`), and what was found is written in `solution.md`.

Acceptance criteria:

- **Given** 12 busy processes, **when** `MUPP-010-compact-admin.spec.ts` is run with `--repeat-each 20` on the current code and on `ec4de06`, **then** either the failure is reproduced and the trace shows which step is late, or `solution.md` records that it was not reproduced and in how many runs.

### TECH-010-R2 Fixed only with a known cause

The test or the site is changed only if R1 finds the cause. If the failure is not reproduced, nothing is changed: no added wait, no longer timeout (decided with the user, 2026-11-03). If the cause is found, it is fixed: a wait in the test only if the trace shows that the site behaves correctly, and then a longer timeout on that one `expect` with a comment, never a fixed pause; otherwise the site is fixed.

Acceptance criteria:

- **Given** the change, **when** the spec is read, **then** it has no fixed pause, and any added timeout is on that one `expect`, with a comment on why; with the cause not found, the spec is unchanged.

### TECH-010-R3 Stable under load

The thumbnail check passes every time under the load in R1.

Acceptance criteria:

- **Given** 12 busy processes, **when** the four feature spec files are run with `--repeat-each 20`, **then** all pass, in three runs in a row.

## Notes

- Small and related fixes carried along from MUPP-030 (CLAUDE.md):
  - `specs/MUPP-030-open-list-header/verification.md` records that Live tests passed against production for the merge `c70e6749` (run 41625212488, 2026-11-03), and the user's phone check (2026-11-03). Its accessibility checklist on the live site is still not checked.
  - `specs/MUPP-029-single-kid-close-motion/verification.md` records the user's check of the checklist's item 11 (reduced motion) on the live site (2026-11-03).
  - `specs/features.md` has MUPP-030 as Done; card #97 is in Done on the board.
- TECH-013 (#96) was the top card; the user chose TECH-010 first. The user's answers for TECH-013 (the name leads on the closed single-kid card; the three-kid list may scroll) are in a comment on #96.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
