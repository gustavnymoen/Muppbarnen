---
type: Review
title: "TECH-024 Shared access checks: review"
description: "The code review and security review of the shared access checks: findings, decisions and result."
feature: TECH-024
---

# Code review of TECH-024

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** The moves keep the check order (site cookie, admin cookie, write limit), the refusal behaviour and the cookie options. The clean-up route is stricter than before and Vercel Cron still gets through (a `GET` without `Origin`, one call a day). No must-fix findings.
**Security:** Passed. Sign-in order is unchanged in every moved action; `guardWrite` still runs on every action and on both job routes; the cookie options are identical (`httpOnly`, `secure` in production, `sameSite: "lax"`, `path: "/"`, `maxAge` only where it was before, `0` to clear); no new secret or cookie; hashes compared with `timingSafeEqual` and 32 characters at least for both job routes. `/security-review`: run, no high or medium findings (it also noted that the write limit now counts the cleanup route's calls, which is a rate-limit matter and by design).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/route-checks.test.ts:17` The reason text still named `lib/santa-job.ts`. **Done:** now `lib/job-auth.ts`.
- `specs/TECH-024-shared-auth-helpers/` had no `verification.md` or `review.md`. **Done:** both written; `wiki/log.md` has a line.

## Suggestions

- `lib/route-checks.test.ts` The check `/\brefusal\b/` was satisfied by the destructuring alone. **Done:** it now needs `if (refusal)`. The job routes' `if (refused) return refused` is not checked beyond the call of `refuseJobCall`; left, since the test reads text and does not check order.
- `lib/action-open.ts` `openAdminAction` returns both `admin` and `parent`. **Done:** left as it is; `admin` is used by three actions for `expires`, `parent` by the rest.
- `app/api/santa-cleanup/route.test.ts` The 429 test left rows in `write_requests`. **Done:** it deletes them.

## Outside the change

- The three `hasSiteSession()` checks in `app/actions.ts` (they answer instead of redirecting) and `requireSiteSession()` in the pages stay as separate checks, listed in `solution.md`. Not added to the board: no duplication of the three-line opening, and the page checks are a different pattern.
- Vercel Production `CRON_SECRET` must be 32+ characters before the deploy: set to a new 64-character value by the owner on 2026-11-12, not verifiable from the repo.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
