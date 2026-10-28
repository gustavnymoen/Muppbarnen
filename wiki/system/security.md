---
type: Guide
title: Security
description: "How security is handled: review points, /security-review, the CI scans, Dependabot, the site password, the check test, the request limit, the block, the Content-Security-Policy, rotating secrets, and the planned admin sign-in design."
resource: .semgrep/
feature: TECH-004
tags: [security, workflow]
---

# Security

- **In the code review** ([Code review](code-review.md)): sign-in checked on the server for every admin page, server action and API route; input validated on the server; parameterised queries; secrets out of code, the browser, logs and error messages; secure cookies; errors that say what to do without internals; personal data shown only to the right person; actions pinned to commits. Breaking one is must-fix.
- **`/security-review`** (Claude Code) for every change touching sign-in, admin, API routes, server actions, database queries or personal data; its high findings are must-fix and its result goes into `review.md`.
- **In CI** (job `security`, see [Pipeline](pipeline.md)): `npm audit --omit=dev --audit-level=high`; Semgrep with the community rules for JavaScript, TypeScript, React, Next.js and SQL injection plus our rule in `.semgrep/sql.yml`; Gitleaks over the whole history. A wrong Semgrep finding is marked on its line with `// nosemgrep: <rule>` and a comment why.
- **Dependabot:** npm security updates; monthly grouped updates of the pinned Actions.
- **A leaked secret is rotated first;** removing it from Git doesn't make it secret again.
- **Headers:** the security headers are in [Architecture](architecture.md).

## Site password (built, MUPP-009)

The whole site is behind one shared password ([Site password](site-password.md)):

- One shared password, `SITE_PASSWORD`; the server sets the cookie `__Host-site_session` with an expiry and an HMAC-SHA256 signature made with `SITE_SESSION_SECRET`: `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, no `Domain`, valid 180 days.
- Passwords compared as SHA-256 hashes with `timingSafeEqual`; a wrong password answered after a second; a block after repeated wrong passwords (see below).
- `proxy.ts` refuses everything without the cookie (pages are sent to `/losenord`, API routes, actions and pictures get 401), and what reads data checks the cookie again on the server. With the password or the secret missing the site is closed, and the build on Vercel stops.
- The children's pictures live in a private Blob store and are served by the site after the check.

## Hardening (TECH-005)

The rules every route handler, server action and form follows are in [`specs/rules.md`](../../specs/rules.md); the code review checks them ([Code review](code-review.md)) and breaking one is must-fix.

- **Check test** (`lib/route-checks.test.ts`, run by `npm run test:unit`): reads `app/` and `lib/` as text and fails, naming the file and function, when a route handler (`app/**/route.ts`) or an exported function in a `"use server"` file does not call `hasSiteSession()` or `requireSiteSession()` as its first statement; when a file under `admin` does not call `hasAdminSession()` or `requireAdminSession()` straight after; when a server action or a `POST`, `PUT`, `PATCH` or `DELETE` handler does not call `guardWrite()`; when `"use server"` is written inside a component; and when `put()` to Vercel Blob lacks `access: "private"`. The one exception is `login` in `app/losenord/actions.ts`, listed in the test with the reason. The admin names `hasAdminSession` and `requireAdminSession` are what MUPP-003 builds.
- **Request limit** (`lib/write-limit.ts`, table `write_requests`): `guardWrite()` (`lib/request-guard.ts`) counts every writing request per IP address in the database and refuses the 61st in a minute (a server action answers with a message, a route handler answers 429) before any data is touched (the count itself is one small insert in `write_requests`, deleted after a minute). Old rows are deleted on each call. The same function checks that the `Origin` header, when there is one, names the site's own host (CSRF); Next.js's own check for server actions stays on as well.
- **Block** (`lib/login-block.ts`, tables `login_attempts` and `login_blocks`): shared by the site and admin sign-ins. A sign-in attempt is written before the password is checked, so many requests at once cannot all slip through, and is deleted again if the password was right, so right passwords never count. More than 5 wrong passwords in 15 minutes from one address block it for 20 minutes: every attempt is refused with "För många försök. Försök igen om en stund.", also with the right password, and refused attempts add nothing. The block applies to sign-in only; the visitor still sees the password page. There is no rising delay, so a family on one shared address waits at most 20 minutes.
- **Content-Security-Policy** (`next.config.ts`): `default-src 'self'`, scripts, styles, images (also `blob:` and `data:`), fonts and connections only from the site itself, `object-src 'none'`, `base-uri`, `form-action` and `frame-ancestors` limited to the site. Nonce-based CSP can't be used: Next.js needs every page rendered at each request for it, and the site uses Partial Prerendering (`cacheComponents`). The hash-based variant (experimental `sri`) was tried and does not work either: it adds `integrity` to the script files but the inline scripts that Next.js and React put in each page (starting the page, streaming the dynamic parts) get no hash, so `script-src 'self'` blocks them. So the policy is the strictest that works: inline scripts and styles are allowed (`'unsafe-inline'`), but nothing can be loaded from, or sent to, another site. In development `'unsafe-eval'` is added for React's debugging. A test (`TECH-005-R4`) checks the header and that the pages run without violations.
- **Cookies** have the `__Host-` prefix in production (secure, path `/`, no `Domain`), so a cookie set from a sub-domain is not accepted. Locally over http the prefix is left off, since `Secure` cookies need https.
- **Pictures:** the Blob store is private. The check test fails on `put()` without `access: "private"`; that a picture's direct address does not answer without the site is checked by hand when MUPP-003 creates the first upload.
- **Uploads:** the limit of size and type comes with MUPP-003, where the upload is built.

## Rotating secrets and leaks

Set the new value in Vercel (Production and Preview) and in `.env.local`, and redeploy; the old value stops working at the deploy.

| Value | Rotate when | What happens |
|---|---|---|
| `SITE_PASSWORD` | A friend should lose access, or it leaked | Only the next sign-in needs the new one; cookies already issued stay valid. To sign everyone out, rotate `SITE_SESSION_SECRET` too. |
| `SITE_SESSION_SECRET` | The password leaked, or a cookie did | Everyone is signed out and must enter the password again. Create one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (MUPP-003) | Same, for the admin | Same, for the admin sign-in. |
| `TURSO_AUTH_TOKEN`, Blob token | One leaked | Create a new token in Turso or Vercel, replace it, and revoke the old one. |

If one leaks: rotate it first, then look for how (Git history, logs, a screenshot), then remove it. Removing it from Git doesn't make it secret again. If the password was guessed, a block shows in `login_blocks` in the database.

## Admin sign-in (planned for MUPP-003)

The design carried over from Gurras Flyg, built the same way as the site password:

- One shared password, `ADMIN_PASSWORD`; a cookie with an expiry and an HMAC-SHA256 signature made with `ADMIN_SESSION_SECRET`: `HttpOnly`, `Secure` in production, `SameSite`, lasting until the browser closes and rejected after 8 hours.
- The same hashed comparison, one-second delay, and the same block as the site password ([Hardening](#hardening-tech-005)): wrong admin and site passwords count together. Its routes and actions follow the check test and call `guardWrite()`.
- `proxy.ts` checks the cookie before admin pages, and every server action checks it again; server actions check their input at run time (ids integers, texts strings of limited length, lists arrays).

[System documentation](index.md)
