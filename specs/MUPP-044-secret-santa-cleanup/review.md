---
type: Review
title: "MUPP-044 Secret Santa: yearly cleanup: review"
description: "The code review of the Secret Santa yearly cleanup: findings, decisions and result."
feature: MUPP-044
---

# Code review of MUPP-044

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** The cleanup route, the `CRON_SECRET` check, the test-date override, the year in the cookie and the once-a-year rule behave as the card, `solution.md` and the wiki describe. No must-fix findings.
**Security:** The review's security points passed. `/security-review` was run on the branch: no finding of high confidence (the secret is compared with `timingSafeEqual` after a length check and refused when unset, the proxy opens exactly one path on GET, the year is covered by the cookie's signature, all queries use parameters).

## Must fix

None.

## Should fix

- Card #142 R1 says "wishes, messages and the draw" are deleted and that an event "has no draw", but the draw rows stay on purpose as the log (R2). **Done:** decided and recorded in `solution.md` and `verification.md`; the card wording is to be aligned with the user.
- `CRON_SECRET` must be set in Vercel Production before the first 24 January. **Done:** in `wiki/system/project-setup.md`, with "at least 32 random characters".

## Suggestions

- `lib/santa-cleanup.ts` An event drawn between 1 and 23 January gets draw year N and is wiped on 24 January; drawing it again in December of year N replaces those rows, so "last year" is N-1. **Done:** left as it is (unlikely, not covered by the card).

## Outside the change

- `parseDate` in `lib/deck.ts` does not validate its input; only the test server's `SANTA_CLEANUP_TODAY` reaches it. Not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
