---
type: Review
title: "MUPP-068 Chat keyboard handled by iOS: review"
description: "The code review of the chat card without scripted keyboard fit and without automatic focus: findings, decisions and result."
feature: MUPP-068
---

# Code review of MUPP-068

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** `noAutofocus` is off by default so other cards are unchanged; the script of MUPP-065 and MUPP-066 is removed with nothing left unused.
**Security:** Passed: no server code, input, data or secrets. `/security-review`: not needed.

## Must fix

None.

## Should fix

- The test lacked axe, and the "other cards keep focus" check was not named. **Done:** axe added; the other cards are covered by `tests/MUPP-045-form-cards.spec.ts` (first field focused), recorded in verification.md. `verification.md`, `review.md` and the `noAutofocus` line in `wiki/system/form-cards.md` were missing. **Done:** added.

## Suggestions

- The two-step scroll to the end is justified by iOS behaviour the test cannot show. **Done:** kept; the real-phone check confirms it.
- MUPP-065 and MUPP-066 are marked superseded in their status text only through MUPP-068. **Done:** left as history.

## Outside the change

- The real iPhone check is not done (see [verification.md](verification.md)).
