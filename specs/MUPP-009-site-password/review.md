---
type: Review
title: "MUPP-009 Site password: review"
description: "The code review of Site password: findings, decisions and result."
feature: MUPP-009
---

# Code review of MUPP-009

**Result:** Passed
**Date:** 2026-10-27, review run 1
**Summary:** No must-fix findings. The cookie is checked in `proxy.ts` and again in each page, the attempt is counted before the password is compared, and no secret reaches the browser, a log or an error message.
**Security:** Security points of the review: passed. `/security-review`: run, no findings with confidence of 8 or higher (cookie signing and comparison, the target address, the proxy rules, the server-side check, the login action and the secrets in the repository were examined).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/design.spec.ts`, `tests/MUPP-009-site-password.spec.ts`: the default base address and the own `x-real-ip` were copied into several `newContext` calls. **Done:** one helper, `newVisitor`, in `tests/site-session.ts`.
- `tests/design.spec.ts`: a needless `await` before `expect` on a plain number. **Done:** removed.
- `tests/MUPP-009-site-password.spec.ts`: the redirect body assertion did not say why the body may hold the address. **Done:** a comment says Next.js writes the redirect address as text.

## Suggestions

- `proxy.ts`: every method passes on `/losenord`, so a POST with another action's id gets through the proxy; safe while `login` is the only action. **Done:** comment added in the proxy; `solution.md` already says each later action must call `hasSiteSession()`.
- `app/losenord/actions.ts`: without an IP header all requests share the address "okänd". **Done:** left as it is: it only happens off Vercel and errs on the safe side.
- `lib/login-attempts.ts`: refused attempts are also inserted. **Done:** left as it is: a recorded decision in `solution.md`.

## Outside the change

- `wiki/system/testing.md` had a stale smoke-test example name. **Done:** updated in this change.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
