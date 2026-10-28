---
type: Solution
title: "TECH-005 Security hardening: solution"
description: How the check test, the request limit, the block after wrong passwords, the Content-Security-Policy and the __Host- cookie are built, and the decisions behind them.
feature: TECH-005
card: "#27"
depends_on: [MUPP-009]
---

# TECH-005 Security hardening: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 27`.

## Data

Migration `db/migrations/002_login_blocks_and_write_requests.sql`:

- `login_blocks` (`ip` primary key, `blocked_until` in seconds): an address that is blocked.
- `write_requests` (`id`, `ip`, `requested_at`) with an index on `(ip, requested_at)`: one row per writing request, deleted after a minute.

`login_attempts` (from MUPP-009) stays, with a new meaning: a row per sign-in attempt that has not turned out to be right. Rows older than 15 minutes are deleted when the next attempt comes. All tables hold IP addresses and times only.

## Interface

- **`lib/login-block.ts`** (R3). `beginAttempt(ip)` deletes old attempts and expired blocks, returns `null` if the address is blocked, otherwise writes the attempt and returns its id; if more than 6 attempts are now in the window (only possible when many arrive at once) it blocks the address and returns `null`. `clearAttempt(id)` deletes the attempt when the password was right. `registerWrong(ip)` blocks the address for 20 minutes when more than 5 attempts are in the last 15 minutes. Site and admin sign-ins both call these three functions, so their wrong passwords count together.
- **`app/losenord/actions.ts`**: the login action calls `guardWrite()`, then `beginAttempt`, then compares the password, then `registerWrong` or `clearAttempt`. Messages: "För många förfrågningar. Försök igen om en stund." (request limit), "För många försök. Försök igen om en stund." (block), "Något gick fel. Ladda om sidan och försök igen." (wrong `Origin`), "Fel lösenord.".
- **`lib/write-limit.ts`** (R2). `registerWrite(ip)` deletes rows older than a minute, writes this request, counts the address's rows, and allows it if there are at most 60.
- **`lib/request-guard.ts`**. `guardWrite()` is called first in every server action and every `POST`, `PUT`, `PATCH` and `DELETE` handler (after the sign-in check, except in the login action): it checks that `Origin`, when there is one, has the site's host (`originMatches`) and then `registerWrite`. It returns `"ok"`, `"origin"` or `"limit"`; a handler answers 403 or 429, an action a message. `clientIp` moved here from the login action.
- **`lib/route-checks.test.ts`** (R1, and the rules that can be read from the code). Reads `app/` and `lib/` as text; the function `findProblems(sources)` returns one line per problem, "file#function: what is wrong". It is run on the site's own code and on made-up files (with and without the check). The login action is the one entry in `NO_SIGN_IN_CHECK`, with the reason; a second test fails if a listed exception no longer exists.
- **`next.config.ts`** (R4): the Content-Security-Policy.
- **`lib/site-session.ts`** (R4): `SESSION_COOKIE` is `__Host-site_session` in production and `site_session` in development.

## Decisions

- **The check test reads the code as text,** not by running it. A test that calls every route would need a signed-in and a signed-out visitor for every route and would fail only for routes it knows; reading the files finds new ones by itself. The price is a crude parser (exported functions of `route.ts` and `"use server"` files, the first statement of the body). It is simple enough to read in one sitting, and the tests with made-up files show what it catches. What it can't see — a check that is present but wrong — is for the code review.
- **"Before anything else" means the first statement.** A check that comes after a database call is too late, so the first statement of the function must be the check.
- **The call is written in the function itself,** so the test can see it. A helper that wraps the check can be added to the accepted names in the test when a feature needs it.
- **Counting before the check, and removing it again when right.** The first idea was to count wrong passwords after the check, as the card says. But then twenty requests at once all pass the "is it blocked" test before any of them has failed, and the one-second delay doesn't stop that. So the attempt is written first and deleted when the password was right: right passwords never count (R3), and at most 6 requests can reach the password check, however many arrive at once. The sixth attempt after five wrong may still be right; if it is wrong, it blocks.
- **Refused attempts add nothing** while the block lasts, so a family that keeps trying doesn't prolong it; 20 minutes after the sixth wrong password it ends, and the old attempts are by then more than 15 minutes old, so it doesn't start again.
- **The request limit counts before it decides,** like the old attempt limit. Many requests at once may all be refused (the count includes them all), never all accepted: the error is on the safe side.
- **Origin: a missing header is accepted.** Browsers always send `Origin` on a form post from another site, so a request without it isn't a CSRF attack from a browser. Next.js has its own `Origin` check for server actions, which stays on; ours is for route handlers and as a second layer.
- **The Content-Security-Policy allows inline scripts and styles,** and I tried the stricter way first. A nonce-based policy needs every page to be rendered for each request, and the Next.js docs say it can't be used with Partial Prerendering, which the site uses (`cacheComponents`). The hash-based one (experimental `sri`) was built and looked at: it puts `integrity` on the script files, but the inline scripts that Next.js and React add to every page (starting the page, streaming the parts that wait for the cookie) get no hash, so `script-src 'self'` would block them and the pages would not start. So the policy is `default-src 'self'` with `'unsafe-inline'` for scripts and styles and `'self'` for everything else (images also `blob:` and `data:`; `connect-src 'self'`; `object-src 'none'`; `base-uri`, `form-action` and `frame-ancestors` limited). An injected inline script could still run, but it can't load code from, or send data to, another site. `'unsafe-eval'` is added in development only.
- **`__Host-` only in production.** The prefix needs `Secure`, and a browser does not accept a `Secure` cookie from `http://` (Safari not even on localhost), so `npm run dev` over http would lose its sign-in. The tests run the production build, so they see the prefix.
- **The Blob store being private is a code check for now:** the check test fails on `put()` without `access: "private"`. There is no store in use yet, so "the picture's address does not answer without the site" is a manual check when MUPP-003 uploads the first picture (recorded in `verification.md`). Size and type of uploads are limited when the upload is built, in MUPP-003, as the card says.
- **Test IPs.** `tests/site-session.ts` gives each test its own `x-real-ip` as before, but starts at a random number: each test file loads the module again, and the block stays in the test database for the whole run, so two files would otherwise share addresses.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Security](../../wiki/system/security.md), [Site password](../../wiki/system/site-password.md), [Code review](../../wiki/system/code-review.md), [Way of working](../../wiki/system/way-of-working.md), [Rules for all features](../rules.md), [Lösenordet till sajten](../../wiki/manual/losenord.md).

[Specifications](../index.md)
