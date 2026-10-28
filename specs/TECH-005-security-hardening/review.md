---
type: Review
title: "TECH-005 Security hardening: review"
description: "The code review of Security hardening: findings, decisions and result."
feature: TECH-005
---

# Code review of TECH-005

**Result:** Passed
**Date:** 2026-10-28, review run 1
**Summary:** The attempt and block logic is correct (the sixth wrong password blocks, right passwords never count, concurrent attempts cannot all get through). The reviewer found gaps in the check test, all fixed.
**Security:** Passed on sign-in, input, queries (all parameterised) and cookies. `/security-review`: run, no findings of confidence 8 or above. It noted that `'unsafe-inline'` in the Content-Security-Policy leaves inline-script XSS unmitigated, which is the documented trade-off (no XSS sink exists in the code).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/route-checks.test.ts` `exportedFunctions` skipped export forms it did not know (`export const POST = withAuth(…)`, `export { handler as POST }`, `export default`). **Done:** such exports in a route or action file now fail the test; tests added.
- `lib/route-checks.test.ts` only scanned `app/` and `lib/`, and `.ts`/`.tsx`. **Done:** the whole project is scanned (except `node_modules`, `tests`, `scripts`, `specs`, `wiki`, `db`, dot-folders), and `.js`/`.mjs` files too.
- `lib/route-checks.test.ts` took the first `{` after `(` as the body, so `GET(req, { params })` was misread. **Done:** the parameter list is skipped; test added.
- `lib/route-checks.test.ts` accepted `if (await hasSiteSession()) {…}` (wrong polarity). **Done:** `!` is required; test added.

## Suggestions

- `guardWrite()` writes a row even for a refused request. **Done:** said in `security.md`.
- A server error between `beginAttempt` and `clearAttempt` leaves the attempt counted. **Done:** noted in a comment (the safe side).
- `tests/site-session.ts` starts at a random IP number, so runs are not reproducible. **Left as it is:** a collision between two files is very unlikely and a fixed offset would need the file name.

## Outside the change

- `clientIp` falls back to `"okänd"` off Vercel, so all such requests share one block and one limit (from MUPP-009).
- `proxy.ts` is outside the check test.
