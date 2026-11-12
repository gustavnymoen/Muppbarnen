---
type: Review
title: "TECH-020 Go live with mail: review"
description: "The code review of Short name of the feature: findings, decisions and result."
feature: TECH-020
---

# Code review of TECH-020

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** The test-mail script reads the key only from the environment, never prints it and sends one plain mail to the one address given; the docs are true after the two fixes below.
**Security:** Passed. No `NEXT_PUBLIC_` use, the key is never logged (the script prints only the recipient and the HTTP status), `.env*` is ignored by Git, the recipient is validated, Gitleaks runs over the whole history, and the test server blanks the key. `/security-review`: not needed (nothing touches sign-in, admin, routes, actions, the database or personal data).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `wiki/system/mail.md` said the key is set for Production only; it is also set for Preview. **Done:** the page says so and what it means.
- `.env.example` said "only on Vercel" while telling the owner to use `.env.local` for the test script, where the key also makes `npm run dev` send real mail. **Done:** the comment says so.
- Open Definition of Done items in `verification.md`. **Done where possible;** `npm run build` and `test:local` are not run (the build's `prebuild` step runs against the owner's local database), and the Preview key is not decided.

## Suggestions

- `scripts/send-test-mail.mjs:6`: the sender is duplicated from `lib/mail.ts`; marked with a `shortcut:` comment. **Done:** left as it is.

## Outside the change

- Should the Preview environment hold a real Resend key? Left to the owner; recorded in `verification.md`.
- The Exchange work address holds back mail Resend shows as Delivered: accepted by the owner, not investigated.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
