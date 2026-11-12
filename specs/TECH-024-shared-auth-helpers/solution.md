---
type: Solution
title: "TECH-024 Shared access checks: solution"
description: "How the opening checks of server actions, the session cookies and the bearer-secret check of the two job routes are written once."
feature: TECH-024
card: "#228"
depends_on: [TECH-005, MUPP-044, MUPP-042]
---

# TECH-024 Shared access checks: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 228`.

## Data

None.

## Interface

No visible change. New files in `lib/`:

- `action-open.ts`: `openSiteAction()` (site cookie, then `guardWrite()`) and `openAdminAction()` (site cookie, admin cookie, then `guardWrite()`). Both return `refusal`, the Swedish text to show when the limit or the Origin check said no (or `null`); `openAdminAction()` also returns `admin` and `parent`. An action reads `const { parent, refusal } = await openAdminAction(); if (refusal) return failed(formData, { error: refusal });`. 23 admin actions and 7 other actions (the admin login and the Secret Santa ones) use them (`app/admin/actions.ts`, `santa-actions.ts`, `picture-actions.ts`, `login-action.ts`, `app/secret-santa/actions.ts`, `chat-actions.ts`, `wish-actions.ts`).
- `session-cookie.ts`: `setSessionCookie(name, value, maxAge?)`, the one place with the cookie options. Used by the site login, `setAdminCookie` and `setSantaCookie`/`clearSantaCookie`.
- `job-auth.ts`: `jobAuthorized(authorization, secret)` (the old function of `lib/santa-job.ts`, now with the secret as a required parameter) and `refuseJobCall(request, secret)`: `guardWrite()` first (429), then the secret (401), `null` when the call may go on. `app/api/santa-mails/route.ts` passes `SANTA_JOB_SECRET`, `app/api/santa-cleanup/route.ts` passes `CRON_SECRET`.

`lib/santa-job.ts` only keeps `SANTA_JOB_PATH` (used by `proxy.ts`). `lib/job-auth.test.ts` is the old `santa-job.test.ts`, moved with the code.

## Decisions

- **Helpers return the refusal instead of the response.** The actions answer in different shapes (`FormState` through `failed`, `{ ok: false, error }`, nothing at all), so the helper cannot return the answer; it returns the text and the action puts it in its own shape. The three checks stay in the one order of `specs/rules.md`.
- **The check test reads the helpers by name.** `lib/route-checks.test.ts` still reads code as text; it now also accepts `openSiteAction()`/`openAdminAction()` as the opening, requires an action that calls one of them to read `refusal` (else the limit would be checked but ignored), and requires the two job routes to call `refuseJobCall()`. An `openSiteAction()` in an admin file still fails the admin check.
- **The cleanup route is as closed as the mail route.** Before: its own length-first comparison, any secret length, no limit. Now the same function: at least 32 characters, hashes compared, and the write limit first. Vercel Cron sends a `GET` without an `Origin` header, so `guardWrite()` passes it, and one call a day is far below 60 a minute.
- **`CRON_SECRET` must be 32 characters or more before this is deployed**, or the cleanup answers 401 and the yearly cleanup does not run. The owner set a new 64-character value in Vercel on 2026-11-12; the test server's value (`scripts/test-server.mjs`) is made 32+ too.
- **Not changed:** the three `hasSiteSession()` checks in `app/actions.ts` (they answer instead of redirecting, a different check), the onboarding cookie (a plain cookie, not a session), `app/losenord/actions.ts#login` (no site cookie yet), and the page checks (`requireSiteSession()` in pages, outside the card).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Security](../../wiki/system/security.md), [Secret Santa cleanup](../../wiki/system/secret-santa-cleanup.md), [Secret Santa match](../../wiki/system/secret-santa-match.md). Found by [TECH-022](../TECH-022-ponytail-audit-2/audit.md), findings 2 and 3.

[Specifications](../index.md)
