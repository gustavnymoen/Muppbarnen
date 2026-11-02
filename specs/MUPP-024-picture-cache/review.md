---
type: Review
title: "MUPP-024 review"
description: "The code review of MUPP-024: findings, decisions and result."
feature: MUPP-024
---

# Code review of MUPP-024

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The picture address carries a version and is cached for a year only with the right version; the cookie check, 401/404 and the ETag are unchanged. Reviewed together with MUPP-025.
**Security:** Passed. `hasSiteSession()` is still the first statement of the picture route, both cache headers are `private`, the version is a sum of the file name and `v` is only compared as a string, so no input reaches a query or a path. `/security-review`: run, no findings (the change adds no input that reaches a query or path).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

None.

## Suggestions

- `lib/picture-url.ts:4` The version is 32 bits, so two names could in theory collide. **Done:** left as it is; stated as a `shortcut:` in the code.

## Outside the change

- Cached pictures stay on the phone after the site cookie expires (inherent to private caching). **Done:** one line in `wiki/system/admin.md`.

