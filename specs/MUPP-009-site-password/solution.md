---
type: Solution
title: "MUPP-009 Site password: solution"
description: How the shared site password is built - the proxy, the signed cookie, the password page, the attempt limit and the test set-up - and the decisions behind it.
feature: MUPP-009
card: "#17"
depends_on: [MUPP-001, MUPP-002]
---

# MUPP-009 Site password: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 17`.

## Data

Migration `db/migrations/001_login_attempts.sql`: the table `login_attempts` (`id`, `ip`, `attempted_at` in seconds) with an index on `(ip, attempted_at)`. Each attempt is one row; rows older than 15 minutes are deleted when the next attempt comes. It holds IP addresses and times only, no passwords.

## Interface

- **Password page** (`app/losenord/page.tsx`, `LoginForm.tsx`, `actions.ts`): the site name as `h1` in a card with a field "Lösenord" (`type=password`, `autocomplete=current-password`), a button "Öppna" and a text line for errors. It does not use `Page` and its header, so nothing but the name is shown. The form is a server action (`login`) run with `useActionState`, so it also works without script; the error is a `<p role="alert">` that is always in the page and gets its text when needed, and the field points to it with `aria-describedby`. The target comes in `?till=…` and is cleaned by `safeTarget` again when used.
- **Proxy** (`proxy.ts`): runs for everything except `_next/static`. `/losenord` passes; with a valid cookie everything passes; without one, page requests (GET/HEAD without `next-action`) get a 307 to `/losenord?till=<path>` and everything else (API routes, server actions, `/bilder/…`, other methods) gets 401 with no body.
- **Server check** (`lib/site-auth.ts`): `hasSiteSession()` and `requireSiteSession()` read the cookie again. Each page does it in a component of its own behind `<Suspense fallback={null}>` and builds its content after the check (`app/page.tsx`, `app/design/page.tsx`). API routes, server actions and the picture route that MUPP-003 adds call `hasSiteSession()` first and return 401.
- **Cookie** (`lib/site-session.ts`): `site_session` = `<expiry in seconds>.<HMAC-SHA256 of the expiry>` made with `SITE_SESSION_SECRET`; `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Max-Age` 180 days. `verifySession` checks the form, the signature (`timingSafeEqual`) and the expiry.
- **Password check** (`passwordMatches`): SHA-256 of both texts compared with `timingSafeEqual`. A wrong one is answered after one second.
- **Attempt limit** (`lib/login-attempts.ts`): `registerAttempt(ip)` deletes old rows, inserts this attempt, counts the address's rows in the last 15 minutes, and allows it if there are at most 5. The address is `x-real-ip` (set by Vercel, which overwrites what the visitor sends), else the first `x-forwarded-for`.
- **Settings:** `SITE_PASSWORD` and `SITE_SESSION_SECRET` (`.env.example`). If either is missing `siteSecrets()` returns `null`, no cookie is valid and no password matches, so the site is closed; `next.config.ts` stops a build on Vercel without them.
- **Look:** a new token `--color-danger` (`#E8938F`) for error text, in `app/globals.css`, `DESIGN.md` and `/design`.
- The flow is in [flow.mmd](flow.mmd).

## Tests and pipeline

- `playwright.config.ts` gives the local test server a made-up password and secret (overriding any real ones), and `tests/global-setup.ts` signs in once and saves the cookie in `playwright/.auth/site.json` (ignored by Git), which every test reuses through `storageState`. Tests of the password page, and the smoke test, start without it. `tests/site-session.ts` gives each test its own `x-real-ip` so that the limit is not shared between tests.
- Against a deployed site the password is given by hand in `SITE_PASSWORD`; without it only the smoke tests make sense, and they see the password page.
- The workflows are unchanged: CI's test server makes up its own values, and the smoke tests need no secret. Vercel needs the two settings for Production and Preview, or the build stops.

## Decisions

- **The check is per page, not in a layout.** A first version wrapped all pages in a layout that checked the cookie. With the proxy switched off it redirected, but the page's content was still in the response (the page is built before the layout decides, and the stream carries it). So each page checks before it builds its content, which is the pattern the Next.js docs call a data access layer. With the proxy off, a request now gets no content from the pages.
- **The count comes before the password check, and refused attempts are counted too.** Counting first means two requests at once can't both slip under the limit; counting refused ones keeps a guesser locked out while they keep trying. A friend who mistypes five times waits 15 minutes after the last try.
- **Right passwords are counted too,** so the rule is simply "5 attempts in 15 minutes".
- **`x-real-ip`, not `x-forwarded-for`,** since Vercel sets it itself. Locally there is no proxy, and the tests use the header to give each test its own address, which would be a hole on a server that doesn't overwrite it.
- **Next.js's redirect answer includes the target address as text** (also for a redirect from the proxy). It is only the path to the password page, no site content.
- **`/_next/static` is public.** It holds the script, style and font files of the whole site, as the card allows for the password page's own; they contain no children's data. `_next/image` is not excluded, and unused.
- **One fixed error colour token** instead of a one-off value: the design had no colour for errors (it says red means error).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Site password](../../wiki/system/site-password.md), [Security](../../wiki/system/security.md), [Lösenordet till sajten](../../wiki/manual/losenord.md).

[Specifications](../index.md)
