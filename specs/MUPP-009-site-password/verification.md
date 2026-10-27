---
type: Verification
title: "MUPP-009 Site password: verification"
description: How each requirement of Site password was checked, the test suite before and after, and the requirements as built.
feature: MUPP-009
---

# Verification of MUPP-009

Tests: `tests/MUPP-009-site-password.spec.ts`, the smoke test in `tests/smoke.spec.ts`, the look in `tests/design.spec.ts`, and the unit tests `lib/site-session.test.ts` and `lib/login-attempts.test.ts`. Everything below was checked locally on 2026-10-27; nothing is checked on the live site or the preview yet (the branch is not pushed, and Vercel has no `SITE_PASSWORD` or `SITE_SESSION_SECRET` yet).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-009-R1 | Test `MUPP-009-R1 R2 R5 the password page, …` (redirect from `/design` with the target, name, labelled field with `type` and `autocomplete`, button, no links or navigation, "Fel lösenord." as a text line the field is described by, lands on `/design`, axe before and after an error, 320 px, only 200 answers while loading); `MUPP-009-R1 only an address on this site is accepted…` (an `https://` target goes to `/`); unit tests `MUPP-009-R1 …` for `safeTarget`; the look in `design.spec.ts` `MUPP-009-R1 the password page …` (Fredoka, card, 44 px field and button, focus ring, error colour with contrast ≥ 4.5:1) | local | Pass | 2026-10-27 |
| MUPP-009-R2 | Test `MUPP-009-R1 R2 R5 …` (cookie `HttpOnly`, `Secure`, `SameSite=Lax`, about 180 days, form of the value, not in `document.cookie`, no password in it); test `MUPP-009-R2 a changed or foreign cookie …` (changed, signed with another secret and junk are rejected, one signed with the secret is accepted); unit tests `MUPP-009-R2 …` (expiry, changed, another or missing secret) | local | Pass | 2026-10-27 |
| MUPP-009-R3 | Test `MUPP-009-R3 without the cookie …` (`/`, `/design`, a missing page and a query go to the password page with nothing but the address in the body; an API route, a POST, `/bilder/…` and a server action get 401 without a body); the password page loads only its own files; unit test `MUPP-009-R3 a missing password or secret …`. **Manual:** with `proxy.ts` taken away and the site built and started, `/` and `/design` sent no content from the pages (only the `NEXT_REDIRECT` marker and, for `/design`, the page title, which is the same text as the title of any visitor-facing page); the first version, with the check in a layout, did send the content, which is why each page checks. **Manual:** `VERCEL=1 next build` without the settings stops with "SITE_PASSWORD eller SITE_SESSION_SECRET saknas i bygget på Vercel…". Not tested: that a missing setting closes a running site (covered by the unit test of `siteSecrets` and by code review) | local | Pass | 2026-10-27 |
| MUPP-009-R4 | Code review and docs: `wiki/system/site-password.md` and `architecture.md` say the Blob store must be private and why. The route `/bilder/…` and the store itself come with MUPP-003; until then `/bilder/…` is refused by the proxy (tested in R3). Not checked: the visibility of the Vercel Blob store | local | Pass (as far as this card goes) | 2026-10-27 |
| MUPP-009-R5 | Unit tests `MUPP-009-R5 …` against the test database (5 allowed, the sixth refused, another address separate, old attempts removed after 15 minutes) and the hash comparison; test `MUPP-009-R5 the sixth attempt …` (five wrong attempts, then the right password is refused with "För många försök. Försök igen om en stund." and no cookie); the one-second delay in `MUPP-009-R1 R2 R5 …`. Code review: the attempt is written before the password is read | local | Pass | 2026-10-27 |
| MUPP-009-R6 | `npm run test:local` signs in once (`tests/global-setup.ts`) with a made-up password; the old tests pass unchanged; smoke test `MUPP-009-R6 @smoke …`; `.env.example` lists the settings. **Not checked yet:** that the Preview tests and Live tests pass against Vercel, and that the two settings are set in Vercel | local | Pass (local part) | 2026-10-27 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/site-session.test.ts` (R1 target, R2 cookie, R3 settings, R5 comparison) and `lib/login-attempts.test.ts` (R5 limit against the unit-test database) | local | Pass | 2026-10-27 |
| Browser tests | `tests/MUPP-009-site-password.spec.ts` (five tests), the look in `tests/design.spec.ts` | local | Pass | 2026-10-27 |
| Smoke test | `MUPP-009-R6 @smoke` replaces the start-page smoke test; run locally. Not yet against a preview or production | local | Pass | 2026-10-27 |
| Accessibility | axe on the password page, also with an error showing, in the browser test (320 px). **The checklist on the live site (keyboard, VoiceOver reading the error, 200 % zoom, text spacing, contrast, target sizes) is not done**: the page is not live | local | axe passes; checklist not checked | 2026-10-27 |
| Security | Security points in the review; `/security-review`, see [review.md](review.md) | local | See review | 2026-10-27 |
| Code review | [review.md](review.md) | local | See review | 2026-10-27 |

## Test suite

`npm run test:time` (budgets and rules in `wiki/system/testing.md`). "Before" is the numbers recorded by MUPP-002.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 10 browser, 24 unit | 6.6 s | 1.9 s |
| After | 16 browser, 35 unit | about 17 s | 3.0 s |

The browser time grew by more than 25 %. The cause is by design: a wrong password must take a second (checked in two tests), signing in and the 320 px, axe and cookie checks make the password-page test about 3 s, and the attempt-limit test sends five attempts at once to pay the second only once. It is far inside the budgets (3 min in all, 5 s per test); the suite is still small.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the live-site checks follow the deploy); every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets; the growth is explained above; the new tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes; the checklist on the live site follows the deploy
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none needed

## Requirements as built

Copied from the card (`gh issue view 17`) when the work was done. They are as written in the card, with these clarifications from the build:

- R1: the target is passed as `?till=<path>`; a target of `/losenord` itself goes to `/`.
- R3: Next.js writes the redirect address as the body of the redirect answer; nothing else is in it.
- R3: a page checks the cookie in its own component and builds its content after the check; a layout-level check was tried and rejected (see [Solution](solution.md)).
- R5: refused attempts and right passwords are counted too.

### MUPP-009-R1 The password page

The site shall have a password page at `/losenord`, in Swedish, that asks for the site password and takes the visitor on to the page they asked for.

- A visitor without the cookie who opens any page is sent to `/losenord`, and after the right password lands on the page they asked for (only addresses on this site are accepted; anything else goes to the start page).
- The page shows the site's name "Muppbarnens önskelistor", a field labelled "Lösenord" (`type=password`, `autocomplete=current-password`) and a button "Öppna", and no other content from the site.
- A wrong password shows "Fel lösenord." as text next to the field (read out by a screen reader), and the field keeps its label.
- The page passes axe, works from 320 px and is built from the MUPP-001 components.

### MUPP-009-R2 The signed cookie

The site shall remember a correct password in a signed cookie.

- The right password sets a cookie that is `HttpOnly`, `Secure` in production, `SameSite=Lax`, valid for 180 days, and contains an expiry time and an HMAC-SHA256 signature made with `SITE_SESSION_SECRET`.
- A cookie that has expired, has been changed or was signed with another secret is rejected as if there were none.
- Changing the secret signs everyone out.

### MUPP-009-R3 Everything is behind it

Without a valid cookie, no page, API route or picture shall be served.

- Any page (also `/design` and pages that do not exist) is sent to `/losenord` and nothing of its content is in the response.
- An API route, a server action or the picture address `/bilder/…` gets 401 without content.
- The password page, its own stylesheet, scripts and fonts are the only things served without the cookie.
- Pages and routes that read data check the cookie again on the server, so a mistake in the proxy does not open the site.
- If the password or the secret is missing in the environment, the site refuses everything, and a build for production stops with a clear message.

### MUPP-009-R4 Pictures stay behind the password

The children's pictures shall be reachable only through the site.

- `/bilder/…` is covered by R3, and the pictures are stored in a **private** Vercel Blob store and served by the site after the cookie check (the route itself is built with MUPP-003).
- `wiki/system/` says that the Blob store must be private and why.

### MUPP-009-R5 Slowed down and limited

The site shall make guessing the password slow.

- A wrong password is answered after about one second.
- After 5 attempts in 15 minutes from an IP address, a sixth is refused with "För många försök. Försök igen om en stund." without checking the password; the attempts are counted in a database table (a migration) before the password is checked.
- The password is compared as SHA-256 hashes with a constant-time comparison, and neither the password nor the secret is ever in the browser, a log or an error message.

### MUPP-009-R6 Tests and pipeline still work

The existing tests and the pipeline shall keep working with the site behind a password.

- `npm run test:local` and CI give the test server a made-up site password and secret, and the browser tests sign in once through the test setup and reuse that session; no real password is used.
- The smoke tests (against the preview and production, without secrets) check that the site answers with the password page and none of its content.
- `SITE_PASSWORD` and `SITE_SESSION_SECRET` are set in Vercel for Preview and Production and listed in `.env.example`; tests run against a deployed site with the password in `SITE_PASSWORD` by hand.

## Notes

- **Vercel needs `SITE_PASSWORD` and `SITE_SESSION_SECRET` for Production and Preview before the pull request can build.** They were not set by this change: the password is the owner's to choose.
- The page title of a page is static metadata and is sent even if the proxy were off; it holds no children's data.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
