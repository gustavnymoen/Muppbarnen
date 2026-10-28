---
type: Guide
title: Site password
description: "How the whole site is put behind one shared password: the proxy, the signed cookie, the block after wrong passwords, the settings, the private picture store and how the tests get past it."
resource: proxy.ts
feature: MUPP-009
tags: [security, sign-in, proxy, cookie]
---

# Site password

Nothing on the site is visible before the visitor has entered the site password. It is separate from the admin password ([Admin page](admin.md)): the site password gets you in, the admin password lets you edit.

## Parts

| Part | Where | What |
|---|---|---|
| Proxy | `proxy.ts` | Runs for every request except `/_next/static`. Without a valid cookie: pages are sent to `/losenord?till=<path>`; API routes, server actions, `/bilder/…` and every other request get 401 with no content. |
| Server check | `lib/site-auth.ts` | `hasSiteSession()` / `requireSiteSession()` read the cookie again. Each page checks in its own component behind `<Suspense>` and builds its content afterwards; API routes, server actions and the picture route call `hasSiteSession()` first. |
| Cookie | `lib/site-session.ts` | `__Host-site_session` (`site_session` in development over http): expiry and HMAC-SHA256 signature made with `SITE_SESSION_SECRET`. `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, no `Domain`, 180 days. |
| Password page | `app/losenord/` | The only page served without the cookie; asks for the password and leads on to the page the visitor asked for (only addresses on this site). |
| Block | `lib/login-block.ts`, `db/migrations/001_login_attempts.sql`, `002_login_blocks_and_write_requests.sql` | More than 5 wrong passwords in 15 minutes from one IP address block it for 20 minutes, also for the right password; right passwords don't count; shared with the admin sign-in. A wrong password is answered after one second. |
| Request limit and Origin | `lib/request-guard.ts`, `lib/write-limit.ts` | The login action first calls `guardWrite()`: at most 60 writing requests per IP address a minute, and the `Origin` must be the site. |

## Settings

- `SITE_PASSWORD` and `SITE_SESSION_SECRET` are environment variables: in `.env.local` locally and under Settings → Environment Variables in Vercel for **Production and Preview**. They are listed in `.env.example` and never committed, printed or sent to the browser.
- If either is missing the site is closed for everyone (no cookie is valid, no password matches, and an error is logged without the values), and a build on Vercel stops with a message saying which settings to add.
- Changing `SITE_SESSION_SECRET` signs everyone out; changing `SITE_PASSWORD` only matters for the next sign-in. Create the secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Pictures

The children's pictures are kept in a **private** Vercel Blob store and served by the site after the cookie check (the route `/bilder/<child id>`, see [Admin page](admin.md)). A public store would give every picture an address that works without the password for anyone who has the link, so the store must stay private.

## Tests

- `npm run test:local`: `playwright.config.ts` gives the test server a made-up password and secret (overriding any real ones); `tests/global-setup.ts` signs in once and saves the cookie in `playwright/.auth/site.json`, which all tests reuse. Each test gets its own `x-real-ip`, so the block and the request limit aren't shared.
- Against a deployed site: set `SITE_PASSWORD` to the real password by hand. Without it only the smoke tests make sense, and they see the password page.
- The tests are `tests/MUPP-009-site-password.spec.ts`, the smoke test in `tests/smoke.spec.ts`, the look in `tests/design.spec.ts`, and the unit tests `lib/site-session.test.ts` and `lib/login-block.test.ts` ([Testing](testing.md)). The block, the request limit, the check test for new routes and actions and the Content-Security-Policy are described in [Security](security.md) and tested by [TECH-005](../../specs/TECH-005-security-hardening/solution.md).

The design of the sign-in is also summarised in [Security](security.md). Built by [MUPP-009](../../specs/MUPP-009-site-password/solution.md); the Swedish version is [Lösenordet till sajten](../manual/losenord.md).

[System documentation](index.md)
