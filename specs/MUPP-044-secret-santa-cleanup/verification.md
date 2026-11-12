---
type: Verification
title: "MUPP-044 Secret Santa: yearly cleanup: verification"
description: How each requirement of the Secret Santa yearly cleanup was checked, the test suite before and after, and the requirements as built.
feature: MUPP-044
---

# Verification of MUPP-044

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-044-R1 | Unit tests `MUPP-044-R1` (`lib/santa-cleanup.test.ts`: the day before, the day and after 24 January, once a year, nothing changes before the date, every event whatever its status ends inactive without wishes, a second run does nothing, the migration starts at the current year); browser test `MUPP-044-R1 R2 R3 …` (after the route is called the status is inactive and the wish is gone); `app/api/santa-cleanup/route.test.ts` and `proxy.test.ts` (the secret, GET only, the cron path in `vercel.json`) | local | Pass | 2026-11-10 |
| MUPP-044-R2 | Unit test `MUPP-044-R2` (draw rows, members and events unchanged by a cleanup); browser test `MUPP-044-R1 R2 R3 …` (the three log rows of last year stay) | local | Pass | 2026-11-10 |
| MUPP-044-R3 | Browser test `MUPP-044-R1 R2 R3 …`: after the cleanup the administrator activates and starts the event in the admin; the draw is the only one that avoids last year's receivers, and the lists start empty | local | Pass | 2026-11-10 |
| MUPP-044-R4 | Unit tests `MUPP-044-R4` (`lib/santa-session.test.ts`: the cleanup year is signed, a cookie of another year or without a year is refused); browser test `MUPP-044-R4 a cookie from before the cleanup stops working…` (the own page works, the route refuses a call without the secret, after the cleanup the same cookie sends the member to the entrance) | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-cleanup.test.ts`, `app/api/santa-cleanup/route.test.ts`, `lib/santa-session.test.ts`, `proxy.test.ts`, `lib/route-checks.test.ts` (the route is the listed exception) | local | Pass | 2026-11-10 |
| Browser tests | New `tests/MUPP-044-santa-cleanup.spec.ts` (2 tests); the existing cookie test of MUPP-039 now expects the year in the cookie | local | Pass | 2026-11-10 |
| Smoke test | None, as planned | not applicable | Not applicable | 2026-11-10 |
| Accessibility | Not applicable: nothing visible changes (the admin page of the browser test is the existing one) | not applicable | Not applicable | 2026-11-10 |
| Security | The review's security points and `/security-review`: [review.md](review.md) | local | Pass (no finding) | 2026-11-10 |
| Code review | [review.md](review.md) | local | Passed (run 1, no must-fix) | 2026-11-10 |

## Test suite

`npm run test:time` (budgets in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 311 unit + 141 browser (as recorded for MUPP-041, `main`) | over budget already (TECH-019) | over 5 s (TECH-019) |
| After | 326 unit (0.6 s) + 147 browser | 297.5 s (budget 180 s), the machine shared with other sessions | 6.9 s (MUPP-038, not touched) |

The suite is over its budget with and without this change (TECH-019). The change adds 2 browser tests (about 2 s together, each under 1.5 s); the other counts come from `main`.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: over the budget already before this change (TECH-019); the new tests are fast and follow the quality rules; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 0124eff passed (2026-11-10)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass; `npm run build` passes (the test server builds it)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none added

## Requirements as built

### MUPP-044-R1 Wipe a month after Christmas Eve

Wishes, messages and the draw of the year shall be deleted, and the event made inactive, when a month has passed since Christmas Eve.

- **Given** a date before 24 January, **then** nothing is deleted or changed; **given** 24 January or later, **then** every event, whatever its status, is inactive and has no wishes, messages or draw.

As built: the wipe runs once a year (the first run on or after 24 January, `ss_cleanup`), not on every day after it. The wishes are deleted and the event made inactive; the draw rows stay as the log (R2), so "no draw" means an inactive event. Messages do not exist until MUPP-043.

### MUPP-044-R2 Keep the log and the people

The history log, events and members shall be kept. **Given** a wipe, **then** the log rows, events and members are unchanged.

### MUPP-044-R3 Ready for next year

An event shall be possible to activate and start again after the wipe, and the draw shall use the log. **Given** a wipe, **when** the administrator activates and starts the event, **then** it works, the wish lists are empty, and last year's receivers are excluded.

### MUPP-044-R4 Signed-out members

Members shall be signed out by the wipe. **Given** a cookie from before the wipe, **then** it no longer works.

As built: the cookie holds the cleanup year; a cookie made before this change is refused once as well.

## Notes

- The route runs without the site cookie and is guarded by `CRON_SECRET` alone; it is the one entry in the route-checks exceptions.
- Not checked: a real Vercel Cron run (it only exists after the deploy and the variable is set).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
