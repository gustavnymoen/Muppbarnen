---
type: Review
title: "MUPP-039 Secret Santa: entrance and sign-in: review"
description: "The code review of Secret Santa: entrance and sign-in: findings, decisions and result."
feature: MUPP-039
---

# Code review of MUPP-039

**Result:** Passed
**Date:** 2026-11-08, review run 1
**Summary:** The sign-in, cookie, attempt block and privacy points hold; R1 to R6 are built as the card says. No must-fix findings.
**Security:** Passed on the points in `wiki/system/code-review.md`: both actions call `requireSiteSession()` then `guardWrite()` first; the cookie is `__Host-`, `HttpOnly`, `Secure`, path `/`, no `Domain`, signed with a `santa.` prefix and holds only the person id; the existing attempt block is used and a right answer is not counted; every wrong try gives the same "Det stämde inte"; phone and email are read only inside `lib/santa-auth.ts` and appear in no page; input is checked on the server (`parseId`, a whitelist for the kind, 254 characters); SQL is fixed text. `/security-review`: run, no finding at confidence 8 or higher. Two things below the threshold: the cookie lasts a year with no revocation except removing the person (the card's decision), and the block is per address (written in `solution.md` as a known limit).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-039-secret-santa-entrance/`: `verification.md` and `review.md` were missing when the review ran. **Done:** both added.

## Suggestions

- `lib/santa-auth.ts` The block is per IP and a phone has 10^8 possibilities. **Done:** written in `solution.md` as a known limit.
- `app/secret-santa/actions.ts` `leave` returns silently when `guardWrite()` refuses, so the visitor sees no change. **Done:** left as it is; reloading and pressing again works.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
