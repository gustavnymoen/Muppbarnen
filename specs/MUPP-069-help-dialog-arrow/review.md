---
type: Review
title: "MUPP-069 Help dialog arrow over the tabs on iPhone: review"
description: "The code review of MUPP-069: no findings; the real-iPhone check is the only proof of the fix."
feature: MUPP-069
---

# Code review of MUPP-069

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** `flex-1` to `flex-auto` on the box and the panel matches R1 and R2 and is the smallest fix for the described iOS collapse. No must-fix or should-fix findings.
**Security:** Passed. No sign-in, server action, API route, database, cookie or personal-data code is touched, and no markup changes. `/security-review`: not needed for the same reason.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

None.

## Suggestions

- `tests/MUPP-069-help-dialog-arrow.webkit.spec.ts` Neither new check can fail on the old code, as Chromium and Playwright's WebKit do not collapse the panel. **Done:** left as it is; the card and `solution.md` say so, and the real-iPhone check in `verification.md` is the proof of R1. The WebKit test also asserts the panel is taller than 44 px, as the `design.spec.ts` check does, so a collapse in that engine would be caught.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
