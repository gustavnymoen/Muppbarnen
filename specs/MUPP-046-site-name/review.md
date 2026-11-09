---
type: Review
title: "MUPP-046 Site name: review"
description: "The code review of Site name: findings, decisions and result."
feature: MUPP-046
---

# Code review of MUPP-046

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** `SITE_NAME` is the single source of the name, the title template, Open Graph and Apple web app tags are in `app/layout.tsx`, and the manifest and icons match R1–R4. No must-fix findings.
**Security:** Passed. The exception in `proxy.ts` matches four exact paths with `includes()` on the pathname (no prefix or regex), only for `GET` and `HEAD`; a `POST` still gets 401; `proxy.test.ts` covers lookalikes, other methods and the list. No route handler, action, query, cookie or secret is added; the SVG has no script or external reference. `/security-review`: run, no findings (confidence ≥ 8).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `verification.md` The user's own look at the icon, the deploy and the live accessibility checks are still open and are recorded as not checked. **Done:** left unchecked on purpose; to be filled in after the deploy.

## Suggestions

- `proxy.ts:11` `PUBLIC_FILES` is exported from `proxy.ts` only so the test can pin it. **Done:** left as it is; the build accepts it. If Next restricts exports from the proxy file, move the list to `lib/`.
- `tests/MUPP-039-secret-santa-entrance.spec.ts:20` Next's route announcer (`role=alert`) now holds text once page titles differ. **Done:** the helper is narrowed to `#santa-fel`; no other test was affected in the full run.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
