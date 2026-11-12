---
type: Verification
title: "MUPP-055 Back arrow on the Secret Santa own page: verification"
description: How each requirement of the back arrow on the Secret Santa own page was checked, the test suite before and after, and the requirements as built.
feature: MUPP-055
---

# Verification of MUPP-055

How each requirement was checked. Browser tests ran locally (a production build, the local test database); nothing is deployed yet, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-055-R1 | Browser test `MUPP-055-R1 R2 …` in `tests/MUPP-039-secret-santa-entrance.spec.ts` (no "Byt person"; one group: "Stäng" link, no arrow, keyboard, goes to `/`, cookie kept, own page still opens; several groups: "Tillbaka" signs out, groups shown, `/secret-santa/min-sida` leads to the entrance; axe in both states); size and place (≥ 44 px, top left, clear of the menu button and heading) in `tests/design.spec.ts` `MUPP-040-R1 … MUPP-055-R1 …`; the MUPP-039 tests that used "Byt person" now use the arrow | local | Pass | 2026-11-09 |
| MUPP-055-R2 | Same browser test: the arrow is a `type=submit` button inside a form. A request without the site session is refused by `leave`'s unchanged `requireSiteSession()`/`guardWrite()`, which `lib/route-checks.test.ts` checks. Not checked with JavaScript off: the page's streamed content stays hidden without JavaScript, so no browser can reach the button then | local | Pass (partly, see left) | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no new logic; the 262 existing ones pass | local | Pass | 2026-11-09 |
| Browser tests | One new test (R1, R2), a check added to the design test, and the MUPP-039 tests changed to press the arrow | local | Pass (131) | 2026-11-09 |
| Smoke test | Not applicable: no main page or flow is added | – | – | – |
| Accessibility | axe on the own page with one group and with several; the live checklist (the arrow's name, size and focus) not done yet | local | Pass (axe); live not checked | 2026-11-09 |
| Security | Security points in the review; `/security-review` not needed: the action is the existing `leave` with its checks | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | See review | 2026-11-09 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 262 unit + 130 browser | not measured | not measured |
| After | 262 unit (0.4 s) + 131 browser | about 300 s (browser) | 3.1 s for the new test |

`npm run test:time` could not start: port 3100 and the shared test database were in use by another run, so the suite ran directly with `PORT=3155` and its own `HOME` (`BASE_URL=http://localhost:3155 npx playwright test`), while the machine was busy with other runs. The 5.0 minutes is therefore not a measure of the change; the new test takes 3.1 s and one test was added. The suite is over its 3 minute budget under that load, as before ([TECH-018](https://github.com/gustavnymoen/Muppbarnen/issues/146)).

## Definition of Done

- [x] Tests: every check in the test plan is done and every requirement has a test; unit and browser tests pass locally
- [x] Test suite: not measured with `npm run test:time` (see above); the new test follows the quality rules; marked done by the user (2026-11-12), who tested it; not run again by Claude
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 915b9a5 passed (2026-11-10)
- [x] Accessibility: axe passes; the live checklist is marked done by the user (2026-11-12); it was not gone through item by item by Claude and no details are recorded per item
- [x] Requirements match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: no "Byt person" left in code, tests or wiki (the specs of earlier cards keep their history)
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review: see [review.md](review.md)
- [x] Improvements: none found

## Requirements as built

- **R1** The own page has no "Byt person". With more than one group the top left corner has the back arrow "Tillbaka" (≥ 44 px, keyboard reachable); pressing it removes the Secret Santa cookie and shows `/secret-santa` with the choice of group, and the own page then leads to the entrance. With one group it has the cross "Stäng" (not the arrow) instead, which goes to `/` and keeps the cookie.
- **R2** The arrow is a form submit to `leave` (site sign-in and `guardWrite()` as before); the cross is a plain link.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
