---
type: Review
title: "MUPP-079 Stay signed in to several Secret Santa groups: review"
description: "The code review of MUPP-079: findings, decisions and result."
feature: MUPP-079
---

# Code review of MUPP-079

**Result:** Passed
**Date:** 2026-11-15, review run 1
**Summary:** Several memberships in one signed cookie, a signature per entry, and the group id in the address only picks among the cookie's entries. R1-R6 are implemented as the card says; no must-fix findings.
**Security:** Passed. Every server action opens with `openSiteAction()`; `currentSantaMember(eventId)` only picks among signed entries, so a changed `?grupp=` or hidden `eventId` gives nothing; each entry is compared with `timingSafeEqual`; the new `IN (?,…)` query binds its values; redirects are built from numeric ids only. `/security-review`: run, no vulnerabilities at confidence 8 or higher (checked: cookie forgery, group-id authorization, SQL injection, open redirect, cookie attributes, data exposure). Not reported: there is no per-group sign-out and an entry cannot be revoked before the yearly cleanup; that is a decision on the card.

## Must fix

None.

## Should fix

- `tests/MUPP-079-santa-several-groups.spec.ts` (R4): the cleanup-year check used two entries for the same member, so it passed without the year filter. **Done:** the old-year entry is now for a member with no valid entry, and the test asserts that group asks for sign-in.
- `tests/family-db.ts`: `removeSantaMember` sat between a comment and the function it described. **Done:** moved above the comment.
- `verification.md` and `review.md` were not filled in. **Done.**

## Suggestions

- `app/secret-santa/wish-actions.ts` (`ownMember`): redirected to `/secret-santa` without the group. **Done:** uses `entranceHref` like the pages.
- `lib/santa-auth.ts` (`signedInMembers`): the "one per group" loop covers a case that does not happen. **Done:** a comment says `setSantaCookie` is what keeps one per group; the loop stays as a cheap safeguard.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
