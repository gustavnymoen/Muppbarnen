---
type: Verification
title: "TECH-022 Ponytail audit of the code: verification"
description: How each requirement of the second ponytail audit was checked, the test suite before and after, and the requirements as built.
feature: TECH-022
---

# Verification of TECH-022

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-022-R1 | Manual: [audit.md](audit.md) exists with eight findings, ranked, each with file and problem; no personal data (read through). The audit run changed no file but the report. Can't be automated: it is a document. | local | Pass | 2026-11-12 |
| TECH-022-R2 | Manual: every finding has a decision line, the two left have reasons, and the two own cards ([MUPP-067](https://github.com/gustavnymoen/Muppbarnen/issues/227), [TECH-024](https://github.com/gustavnymoen/Muppbarnen/issues/228)) are on the board and linked. The decisions are Claude's proposal; not yet confirmed by the owner (the owner asked for a change on 2026-11-12, not yet specified). The "fix here" ones (4, 5, 6) add no logic or dependency. | local | Pass, decisions to confirm | 2026-11-12 |
| TECH-022-R3 | `lint`, `lint:docs`, `typecheck`, `build` (no warnings; the "whole project is traced" warning is gone) and `test:time` pass; the only test changes are six import lines. See the numbers below. | local | Pass, time over budget (see Notes) | 2026-11-12 |
| TECH-022-R4 | `wiki/system/mail.md` and `wiki/log.md` updated; a search of `wiki/` and `specs/` for the names that lost their `export` finds only history. `npm run lint:docs` passes. | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`, 375 tests, no new test. | local | Pass | 2026-11-12 |
| Browser tests | Full `npm run test:time` before the mail-outbox move: 167 passed. After it, the five specs that use the outbox (MUPP-041, 042, 043, 051, 060) were run again: 23 passed. | local | Pass | 2026-11-12 |
| Smoke test, accessibility | Not applicable: nothing visitors see changed. | | | |
| Security | No sign-in, admin, route, action or query was changed (an `export` keyword, a list copy, test helpers), so `/security-review` was not run. | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 375 unit + 162 browser (TECH-019's figures; main then gained MUPP-066's tests, not re-measured) | 329.3 s | 7.4 s |
| After | 375 unit + 167 browser | 338.8 s | 7.4 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: total time is 338.8 s, over the 330 s budget by 2.7 % (accepted by the owner on 2026-11-12; CI's limit of 455 s passed), with 5 more tests than the "before" figure (from MUPP-066, not from this card); growth 2.9 %
- [x] Deployed, and the smoke tests pass against production (Live tests): passed on merge commit c59a4c7 (run 43230382116, 2026-11-12)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left
- [x] Manual, system docs and `wiki/log.md` updated (the manual needs nothing: no visible change)
- [x] No leftovers
- [x] Clean code: `lint`, `lint:docs`, `typecheck` and `build` pass without warnings (this also closes TECH-020's open build box)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements added to the board: MUPP-067 and TECH-024

## Requirements as built

### TECH-022-R1 The audit is run and saved

The repository contains the report of a read-only `/ponytail-audit` over the whole repository, with no personal data: ranked findings, each with file and problem. Built as written.

### TECH-022-R2 Every finding has a decision

Each finding has one decision (fix here, own card, leave with a reason). The "fix here" ones are small and behaviour-preserving, the others are cards. Built as written.

### TECH-022-R3 The site behaves as before

`lint`, `lint:docs`, `typecheck`, a local `build` and `test:time` pass, no test weakened or deleted, and the suite numbers are recorded. Built as written.

### TECH-022-R4 The documentation matches the code

The documentation describes the code after the fixes and `lint:docs` passes. Built as written.

## Notes

- The full browser run took 338.8 s against a budget of 330 s. The change added no test and no work; the machine was otherwise idle. The `before` time was measured on a different base (162 tests). Not investigated further.
- The audit missed the build warning the first time; it was found when the build was run (finding 4).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
