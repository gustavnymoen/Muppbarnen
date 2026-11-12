---
type: Verification
title: "TECH-024 Shared access checks: verification"
description: How each requirement of the shared access checks was checked, the test suite before and after, and the requirements as built.
feature: TECH-024
---

# Verification of TECH-024

Run locally 2026-11-12; merged as PR #240 and Live tests passed.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-024-R1 | Existing tests unchanged and passing: unit tests (381) and the browser tests (166, MUPP-044 after one fix, below); `npm run lint`, `lint:docs`, `typecheck` and `build` pass. No test weakened: the only changes to existing tests are the cleanup route test and spec using a 32+ character secret. | local | Pass | 2026-11-12 |
| TECH-024-R2 (one check per kind of access) | By reading: no server action in `app/admin/*actions.ts` or `app/secret-santa/*actions.ts` repeats the three checks (23 admin and 7 other actions use `openAdminAction`/`openSiteAction`); the cookies are set by `setSessionCookie`; both job routes use `refuseJobCall`. | local | Pass | 2026-11-12 |
| TECH-024-R2 (the check test fails when a check is left out) | Unit tests `TECH-024-R2 …` in `lib/route-checks.test.ts`: an admin action with `openSiteAction` fails, an action whose refusal is not answered fails, one with other work first fails, a job route without `refuseJobCall` fails; and `TECH-005-R1` (the site's own code passes). | local | Pass | 2026-11-12 |
| TECH-024-R2 (job secret check) | `lib/job-auth.test.ts` (the old `santa-job.test.ts`): only the exact Bearer secret passes; no, short or empty secret closes it. | local | Pass | 2026-11-12 |
| TECH-024-R3 (short or missing secret → 401) | `app/api/santa-cleanup/route.test.ts`: no secret, wrong, no `Bearer`, and a 17-character secret sent exactly: all 401. | local | Pass | 2026-11-12 |
| TECH-024-R3 (write limit first → 429) | Same file: after 60 calls from one address, the 61st with the right secret answers 429, and so does a wrong one. | local | Pass | 2026-11-12 |
| TECH-024-R3 (Vercel Cron still works) | Browser test `MUPP-044-R4` and `MUPP-044-R1 R2 R3` call the route with the secret and run the cleanup. Not tested against Vercel itself: that Cron's `GET` has no `Origin` header is from the code of `originMatches` and Vercel's documentation. | local | Pass (local) | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`: 381 tests (five new: two for the route, three in `lib/route-checks.test.ts`) | local | Pass | 2026-11-12 |
| Browser tests | `npm run test:time`: 164 of 166 passed. The two that failed (`MUPP-044`) had the old test-server secret written in the spec; fixed (the spec uses the new 32+ character secret) and the spec run again: 2 of 2. The full run was not repeated after the fix. | local | Pass after fix | 2026-11-12 |
| Smoke test, accessibility | Not applicable: no visible change | – | – | – |
| Security | The review's security points and `/security-review`: no high or medium findings. Owner set Vercel `CRON_SECRET` to a new 64-character value on 2026-11-12 (not verifiable from the repo). | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

`npm run test:time`, machine idle (load average about 2).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 376 unit + 166 browser (MUPP-067's figures; 167 in TECH-022's) | 338.8 s (TECH-022) | 7.4 s |
| After | 381 unit + 166 browser | 339.5 s | 7.4 s |

The total is 2.9 % over the 330 s budget, as it was before this change (338.8 s in TECH-022, accepted by the owner on 2026-11-12); this change adds no browser test and no time (+0.2 %).

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; unit tests pass; browser tests pass (the two MUPP-044 tests after the fix, see above)
- [ ] Test suite: 339.5 s, over the 330 s budget by 2.9 % as before this change; the owner has accepted that for TECH-022, not yet for this one
- [x] Deployed, and the smoke tests pass against production (Live tests): passed on merge commit 3f18de4 (run 43303578562, 2026-11-12)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (nothing visible changes), system docs and `wiki/log.md` updated
- [x] No leftovers: `jobAuthorized`'s default secret, the cleanup route's own comparison and the three cookie option lists are gone
- [x] Clean code: `lint`, `lint:docs`, `typecheck` and `build` pass without warnings
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none (see "Outside the change" in the review)

## Requirements as built

### TECH-024-R1 The site behaves as before

The site shall behave as before for visitors and administrators. Built as written.

### TECH-024-R2 One check per kind of access

Each kind of access check shall be written once: no server action repeats the three opening checks by hand, the cookies are set by one helper, both job routes use one secret check, and `lib/route-checks.test.ts` fails when an action or route leaves the check out. Built as written (`lib/action-open.ts`, `lib/session-cookie.ts`, `lib/job-auth.ts`); the check test also requires the action to answer on `refusal` and the job routes to call `refuseJobCall`.

### TECH-024-R3 The clean-up route is as closed as the mail job route

The clean-up route shall refuse a secret shorter than 32 characters (401, also when `CRON_SECRET` is missing) and shall be under the write limit (429 before the secret is looked at). Built as written.

## Notes

- The first full run failed two `MUPP-044` browser tests: the spec held the old test-server secret as a string, so changing it in `scripts/test-server.mjs` broke them. Found by the run, fixed in the spec.
- Not run: the full suite after that fix, and anything against Vercel.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
