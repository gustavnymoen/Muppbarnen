---
type: Review
title: "TECH-016 Smaller functions on Vercel: review"
description: "The code review of Smaller functions on Vercel: findings, decisions and result."
feature: TECH-016
---

# Code review of TECH-016

**Result:** Passed
**Date:** 2026-11-06, review run 1
**Summary:** `sharp` is imported only in `lib/picture-upload.ts`, `saveChildPicture` moved unchanged to `app/admin/picture-actions.ts` (only `/admin/hantera` imports it), the alias applies only when `VERCEL` is set, and the shared helpers exist once in `app/admin/action-helpers.ts`. No must-fix or should-fix findings.
**Security:** Passed. The three guards of `saveChildPicture` (site cookie, admin cookie, write limit) are first and in the same order, followed by rights, size and type checks; `put()` still uses `access: "private"`; `lib/route-checks.test.ts` scans the new action file; no new input, query, route, cookie or secret. `/security-review`: run over the branch, no findings (the change moves code and swaps the database client for the web build of the same package; the picture rules are untouched).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

None.

## Suggestions

- `lib/pictures.ts` must never import `lib/picture-upload.ts`, or `sharp` returns to every function that reads pictures. **Done:** left as it is; the dependency runs one way, and `scripts/function-sizes.mjs` fails if it ever changes.
- `scripts/function-sizes.mjs` matches `darwin|linux|win32` and `/` paths. **Done:** left as it is; it is run by hand on macOS and Linux (not in CI).
- CI's `check` job builds without `VERCEL`, so only the Vercel build and the Preview tests exercise the web client. **Done:** documented in `solution.md`; the Preview tests are the check.

## Outside the change

None.

[Specifications](../index.md)
