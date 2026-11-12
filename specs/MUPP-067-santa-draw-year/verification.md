---
type: Verification
title: "MUPP-067 Secret Santa draw year in Swedish time: verification"
description: How the Swedish draw year was checked, the test suite before and after, and the requirement as built.
feature: MUPP-067
---

# Verification of MUPP-067

Run locally 2026-11-12; merged as PR #236 and Live tests passed.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-067-R1 (23:30 UTC on 31 December → new year) | Unit test `MUPP-067-R1 …` in `lib/santa.test.ts`: a fixed date at the turn of the year is passed as `today`; the rows get the new year and last year's rows still count as last year's. It failed before the fix. | local | Pass | 2026-11-12 |
| MUPP-067-R1 (any other day → year unchanged) | Indirectly: the existing draw tests compare with `swedishToday().year` and pass. No separate test. | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`: 376 tests (one new) | local | Pass | 2026-11-12 |
| Browser tests | `npm run test:local`: 165 of 166 passed; the one that failed (`MUPP-045` claim window) was closed by the browser while the machine was overloaded (load average about 40), and passed when its spec was run again (8 of 8). Not related to this change (no browser test touches the draw year). | local | Pass on rerun | 2026-11-12 |
| Smoke test, accessibility | Not applicable: no visible change | – | – | – |
| Security | The review's security points; `/security-review` not needed (no change to sign-in, queries or data) | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 375 unit + 167 browser (TECH-022's figures) | 338.8 s | 7.4 s |
| After | 376 unit + 166 browser run (no new browser test) | 748.6 s, **not comparable** | 54.8 s |

The "after" run was made while the machine was overloaded by other work (load average about 40), so its time says nothing about the suite. It has to be measured again on an idle machine.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; the requirement is tested; unit tests pass, `npm run test:local` passes (one test on rerun, see above)
- [ ] Test suite: not measured on an idle machine; to be run again
- [x] Deployed, and the smoke tests pass against production (Live tests): passed on merge commit c444d95 (run 43294488995, 2026-11-12)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (nothing visible changes), system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `lint`, `lint:docs`, `typecheck` and `build` pass without warnings
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

### MUPP-067-R1 The draw year is the Swedish year

The site shall file a Secret Santa draw under the year of the Swedish date.

- **Given** the time is 23:30 UTC on 31 December, **when** an administrator starts a draw, **then** its rows have the new year.
- **Given** the time is 12:00 on any other day, **then** the year is unchanged from before.

Built as written: `startDraw` takes `today = swedishToday()` and reads its year once.

## Notes

The card's test plan said `startDraw` already took the date as a parameter; it did not, so the parameter was added (decided with the owner).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
