---
type: Verification
title: "MUPP-074 Amount on Secret Santa groups: verification"
description: How each requirement of the amount on Secret Santa groups was checked, the test suite before and after, and the requirements as built.
feature: MUPP-074
---

# Verification of MUPP-074

Work in progress: only what has been done is marked; everything else is not checked yet.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-074-R1 | Unit tests `MUPP-074-R1 …` in `lib/santa.test.ts`; browser tests `MUPP-074-R1 …` in `tests/MUPP-074-santa-amount.spec.ts` | local | Pass | 2026-11-16 |
| MUPP-074-R2 | Browser test `MUPP-074-R2 …` in `tests/MUPP-074-santa-amount.spec.ts` (beside the greeting, none without an amount); the look on a 320 px phone with a long name: test in `tests/design.spec.ts` | local | Pass | 2026-11-16 |
| MUPP-074-R3 | Unit tests `MUPP-074-R3 …` in `lib/santa-mail.test.ts`, `lib/santa-notify.test.ts` and `lib/santa.test.ts` | local | Pass | 2026-11-16 |
| MUPP-074-R4 | Browser test `MUPP-074-R1 R4 …` (closed card, after a change, none when cleared); the look with a long name and the "Admin: …" line on 320 px: test in `tests/design.spec.ts` (no sideways scroll) | local | Pass | 2026-11-16 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npx vitest run` | local | Pass (419 tests) | 2026-11-16 |
| Browser tests | `tests/MUPP-074-santa-amount.spec.ts` (3 tests, axe in two) and one in `tests/design.spec.ts`; the whole `npm run test:time`: all 188 passed in the last run (one earlier run had a MUPP-071 failure that did not come back) | local | Partly | 2026-11-16 |
| Smoke test | Probably unchanged | | Not checked | |
| Accessibility | axe in the browser tests; the live checklist: not checked | | Not checked | |
| Security | `/security-review` on the branch: no findings (server check, parameters, `canManage`, no new route) | local | Pass | 2026-11-16 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-16 |

## Test suite

Last `npm run test:time` (188 browser tests, all passing): 330.1 s against the 350 s budget; earlier runs of the same code 343.1 s and 345.5 s. Before-numbers are not recorded.

## Definition of Done

- [x] Tests, test suite time (330.1 s of 350 s), code review and `/security-review`: done
- [ ] Deployed and Live tests, the live accessibility checklist, requirements as built, the before-numbers of the suite: not done yet

## Notes

The docs edits that close MUPP-076 (Live tests box, log line) ride along on this branch at the user's request; MUPP-076's test-time box stays open until the user accepts the overrun.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
