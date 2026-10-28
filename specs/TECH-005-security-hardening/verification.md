---
type: Verification
title: "TECH-005 Security hardening: verification"
description: How each requirement of Security hardening was checked, the test suite before and after, and the requirements as built.
feature: TECH-005
---

# Verification of TECH-005

Tests: the unit tests `lib/route-checks.test.ts`, `lib/login-block.test.ts` and `lib/write-limit.test.ts`, and `tests/TECH-005-security-hardening.spec.ts`. Everything below was checked locally on 2026-10-28; nothing is checked on the preview or the live site yet (the branch is not merged).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-005-R1 | Unit tests `TECH-005-R1 …` in `lib/route-checks.test.ts`: the site's own code passes and the scan finds `app/losenord/actions.ts`; made-up routes and actions without the check, with the check after other work, inline `"use server"` and admin files without the admin check fail with the file named; the login action is the one listed exception, and a listed exception that no longer exists fails | local | Pass | 2026-10-28 |
| TECH-005-R2 | Unit tests `TECH-005-R2 …` in `lib/write-limit.test.ts` against the unit-test database (60 allowed and the 61st refused, another address separate, a minute later allowed and old rows deleted, many at once never more than 60); the login action goes through `guardWrite()` (browser tests above). **Not tested in the browser:** a 429 from a real route, since no route handler exists yet; `lib/route-checks.test.ts` requires `guardWrite()` in every writing one | local | Pass | 2026-10-28 |
| TECH-005-R3 | Unit tests `TECH-005-R3 …` in `lib/login-block.test.ts` (five wrong allowed and the sixth blocks, the sixth try may be right, right ones not counted, the block lasts 20 minutes, wrong ones older than 15 minutes don't count, another address free, many at once can't all pass); browser test `TECH-005-R3 the sixth wrong password blocks …` (six wrong, then the right one is refused with the message, the password page is still shown, axe, no cookie). The admin sign-in doesn't exist yet: it will call the same three functions, so "any mix of site and admin" is true by construction, not tested | local | Pass | 2026-10-28 |
| TECH-005-R4 | Browser tests `TECH-005-R4 the Content-Security-Policy …` (every directive limited to the site, no other address or `*`, no violations while signing in and opening two pages, a script from another site is blocked) and `TECH-005-R4 the session cookie has the __Host- prefix …`; unit tests `TECH-005-R4 …` for `originMatches` and for `put()` without `access: "private"`; the old tests were changed to the new cookie name. **Manual:** the nonce-based and the hash-based (`sri`) policies were tried, see `solution.md` (the second built and the page's scripts looked at: inline scripts get no hash). **Not checked:** that a picture's direct address does not answer without the site, and the limits on uploads (no picture or upload exists until MUPP-003); the rotation notes in `security.md` were read through, not tried | local | Pass (as far as this card goes) | 2026-10-28 |
| TECH-005-R5 | `npm run lint:docs`; read-through that `specs/rules.md`, `wiki/system/code-review.md`, `.github/ISSUE_TEMPLATE/card.md`, `wiki/system/way-of-working.md`, `wiki/system/security.md` and `wiki/system/site-password.md` carry the rules and that each rule in `specs/rules.md` that can be read from the code is enforced by `lib/route-checks.test.ts` | local | Pass | 2026-10-28 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | The three files above | local | Pass | 2026-10-28 |
| Browser tests | `tests/TECH-005-security-hardening.spec.ts` (three tests) | local | Pass | 2026-10-28 |
| Smoke test | Not applicable: no page or flow changes | | | |
| Accessibility | axe on the password page showing the block message. The checklist on the live site: not applicable beyond MUPP-009's, the message is the same kind of text line as before | local | axe passes | 2026-10-28 |
| Security | `/security-review`, see [review.md](review.md) | local | No findings | 2026-10-28 |
| Documentation (R5) | `npm run lint:docs`; read-through | local | Pass | 2026-10-28 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-28 |

## Test suite

`npm run test:time` before and after (budgets and rules in `wiki/system/testing.md`). "Before" is the numbers recorded by MUPP-009.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 16 browser, 35 unit | about 17 s | 3.0 s |
| After | 18 browser, 57 unit | 20.7 s | 3.0 s |

The browser time grew by about 20 %. The block test sends six wrong passwords at once (one second of waiting, not six); a first version had a second test that signed in seven times, which took 4 s and repeated what a unit test shows, so it was dropped. The MUPP-009 test of the sixth attempt moved here, since the rule changed.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the live-site checks follow the deploy); every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, growth under 25 %, the new tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility: axe passes on the changed state; no visitor-facing change beyond the message
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: `lib/login-attempts.ts` and its test are replaced by `lib/login-block.ts` and its test
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none needed

## Requirements as built

Copied from the card (`gh issue view 27`). They are as written there, with these clarifications from the build:

- R1: the call must be the first statement of the function; the admin check names are `hasAdminSession` and `requireAdminSession` (built by MUPP-003); the same test also requires `guardWrite()` (R2) and `access: "private"` on Blob uploads (R4).
- R2: the check also covers the Origin (R4). Counted before it decides, so a burst may be refused as a whole but never accepted as a whole.
- R3: a wrong password that makes it the sixth blocks the address but is itself answered "Fel lösenord."; the attempts after it get the block message. The attempt is written before the check and deleted when the password was right.
- R4: the policy allows inline scripts and styles (see `solution.md` for why nonces and hashes don't work). The cookie prefix applies in production only. The private-store test is a code check for now; the live check and the upload limits come with MUPP-003.

### TECH-005-R1 A check that catches a forgotten sign-in check

A test shall fail when a route handler (`app/**/route.ts`) or a server action (`"use server"`) does not call the sign-in check (`hasSiteSession()`, and for admin actions the admin check) before anything else. A new route or action without the check makes `npm run test:unit` fail and name the file; the login action is the one listed exception, with the reason.

### TECH-005-R2 A request limit for writes

More than 60 writing requests in a minute from one IP address get 429 without touching the database; the count is kept in the database and old rows are cleaned away.

### TECH-005-R3 A block after repeated wrong passwords

More than 5 wrong passwords within 15 minutes, site and admin together, block the address for 20 minutes: every sign-in attempt is refused, also with the right password, with "För många försök. Försök igen om en stund."; the visitor still sees the password page; right passwords do not count.

### TECH-005-R4 Smaller hardening

A Content-Security-Policy limiting scripts, styles, images and connections to the site (as strict as Partial Prerendering allows); `__Host-` cookies; a test that the Blob store is private; an Origin check on writes and limits on uploads (with MUPP-003); notes on rotating `SITE_PASSWORD`, `SITE_SESSION_SECRET` and the admin values.

### TECH-005-R5 The rules are written down and reviewed

The rules are in `specs/rules.md`, `wiki/system/code-review.md` (breaking one is must-fix), the card template and `wiki/system/way-of-working.md` (cards list them under Security), and described in `wiki/system/security.md` and `wiki/system/site-password.md`.

## Notes

- The hash-based policy was tried and dropped; see `solution.md`.
- `tests/MUPP-009-site-password.spec.ts` lost its test of the sixth attempt (the rule is now TECH-005-R3) and uses the `__Host-` cookie name. The MUPP-009 requirement R5 (5 attempts in 15 minutes, right ones counted) is replaced by TECH-005-R3.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
