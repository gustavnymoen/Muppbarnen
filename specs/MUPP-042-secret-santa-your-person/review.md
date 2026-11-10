---
type: Review
title: "MUPP-042 Secret Santa: your person and change mails: review"
description: "The code review of the started own page, the match's list and the hourly change mails: findings, decisions and result."
feature: MUPP-042
---

# Code review of MUPP-042

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** R1 to R3 are met. The match query only follows the signed-in giver to their own receiver; the job route is the one public route and is guarded by the request limit and a constant-time secret check; claim-before-send makes two runs send one mail.
**Security:** The security points of the review: passed (exact method and path in `proxy.ts`, `guardWrite()` before the secret, SHA-256 and `timingSafeEqual`, closed without a secret of 32 characters, counts-only answer, parameterised SQL, no third-party action in the workflow with `permissions: {}`, the secret passed through `env`). `/security-review`: run on the branch, no finding of confidence 8 or more (the public job route, the proxy exception, the one-way match query, the workflow and the SQL were examined).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/family-db.ts` A comment sat above the wrong helper. **Done:** moved back above `santaEventNames`.
- `specs/MUPP-042-…` The card names the folder `MUPP-042-secret-santa-your-person`; the folder was `…-santa-your-person`. **Done:** the folder and its links follow the card.

## Suggestions

- `lib/santa-changes.ts` A sender that throws would lose the claimed mark. **Done:** a throw counts as a failed mail and the mark is put back (unit test added).
- `tests/MUPP-042-santa-your-person.spec.ts` The 429 answer of the route is not tested. **Done:** left as it is: it is the shared `guardWrite()`, tested in `lib/write-limit.test.ts`, and the check test `lib/route-checks.test.ts` requires it before the secret.
- `.github/workflows/santa-mails.yml` Runners share IP addresses, so now and then a 429. **Done:** said in `wiki/system/secret-santa-match.md`; the next run retries and no mark is lost.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
