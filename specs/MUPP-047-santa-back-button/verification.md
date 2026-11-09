---
type: Verification
title: "MUPP-047 Back button on the Secret Santa sign-in: verification"
description: How each requirement of the back button on the Secret Santa sign-in was checked, the test suite before and after, and the requirements as built.
feature: MUPP-047
---

# Verification of MUPP-047

How each requirement was checked. Browser tests ran locally (a production build, the local test database); nothing is deployed yet, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-047-R1 | Browser test `MUPP-047-R1 R2 R3 …` in `tests/MUPP-039-secret-santa-entrance.spec.ts` (Tillbaka present, "Det är inte jag" absent, keyboard focus, Tillbaka and Esc return to the names with the typed value gone, Esc in an open menu only closes the menu, axe); the position and size in `tests/design.spec.ts` `MUPP-039-R3 R4b …` (top left, ≥ 44 px, clear of the menu button and heading at 375 px) | local | Pass | 2026-11-09 |
| MUPP-047-R2 | Same browser test: the line reads exactly the new text, the old text is gone | local | Pass | 2026-11-09 |
| MUPP-047-R3 | Same browser test: the button is "Fortsätt", none is named "Logga in"; the other Secret Santa tests were updated to the new name | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic outside the page; the 193 existing ones pass | local | Pass | 2026-11-09 |
| Browser tests | One new test (R1–R3) and a check added to the design test; the 039, 040 and design tests use "Fortsätt" | local | Pass (121) | 2026-11-09 |
| Smoke test | Not applicable: no main page or flow is added | – | – | – |
| Accessibility | axe in the new test (the sign-in step); the checklist on the live site: not checked yet | local | Pass (axe) | 2026-11-09 |
| Security | Security points in the review; `/security-review` not needed (no data path changes) | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-040) | 193 unit + 120 browser | 200.2 s (browser) | 4.5 s |
| After | 193 unit + 121 browser | 245.9 s (browser), unit 0.6 s | 5.3 s |

One browser test was added (about 3 s); the others only changed a button name. The total is over the 3 minute budget, as it was before, and this run's 245.9 s is inflated: `npm run test:local` could not start (port 3100 and the shared test database were in use by other projects' and worktrees' test runs), so the suite ran with `PORT=3110` while the machine was loaded by other test runs. It is not a measure of the change. The suite is over its budget; [TECH-018](https://github.com/gustavnymoen/Muppbarnen/issues/146) covers it. The slowest test, 5.3 s, is the existing MUPP-039 sign-in test.

## Definition of Done

- [x] Tests: every check in the test plan is done and every requirement has a test; unit and browser tests pass locally
- [ ] Test suite: over the time budget (see above); TECH-018 covers it; the new test follows the quality rules
- [ ] Deployed, and the smoke tests pass against production: not yet, nothing is pushed
- [x] Accessibility: axe passes; the checklist on the live site is not done yet
- [x] Requirements match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] Improvements: the Esc guard fixed in this change; the shared sign-in test helper is left to TECH-018

## Requirements as built

- **R1** The sign-in step has a back button ("Tillbaka", the arrow icon of the kid card's Tillbaka) in the top left corner of the page header, opposite the menu button, and no "Det är inte jag". Pressing it, or Esc, shows the member grid again with nobody picked and the typed value gone. It has a tap target of at least 44 px, keyboard focus and passes axe, and does not cover the heading or the menu button at 375 px.
- **R2** The line reads "Hej <name>, ange ditt telefonnummer eller e-post för att komma vidare".
- **R3** The submit button reads "Fortsätt"; no button on the page is named "Logga in".

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
