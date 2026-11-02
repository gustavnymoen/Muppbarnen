---
type: Review
title: "MUPP-025 review"
description: "The code review of MUPP-025: findings, decisions and result."
feature: MUPP-025
---

# Code review of MUPP-025

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The closing copy moves for 300 ms and fades after 40 %, as the card says; the WebKit test fails before and passes after. Reviewed together with MUPP-024.
**Security:** Passed. `hasSiteSession()` is still the first statement of the picture route, both cache headers are `private`, the version is a sum of the file name and `v` is only compared as a string, so no input reaches a query or a path. `/security-review`: not needed (component and test only).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

None.

## Suggestions

- `transition.ts` (`play`): only the move clears the copy. **Done:** a comment says the fade is as long and the safety timeout covers the rest.
- The WebKit test depends on frame timing. **Done:** left as it is; it is run by hand, and the window it checks (about 210 ms above half opacity) is wider than the 100 ms it needs.

## Outside the change

- Cached pictures stay on the phone after the site cookie expires (inherent to private caching). **Done:** one line in `wiki/system/admin.md`.

