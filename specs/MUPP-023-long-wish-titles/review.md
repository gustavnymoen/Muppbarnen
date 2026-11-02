---
type: Review
title: "MUPP-023 Long wish titles wrap and get a maximum length: review"
description: "The code review of Long wish titles wrap and get a maximum length: findings, decisions and result."
feature: MUPP-023
---

# Code review of MUPP-023

**Result:** Passed
**Date:** 2026-11-02, review run 2
**Summary:** R1, R2 and R3 are built and tested. The title wraps inside the row and the claim dialog, shows at most two lines with an ellipsis, is smaller over 24 characters, and is limited to 60 in the form and on the server (`MAX_TITLE`). No must-fix findings.
**Security:** Passed. The title length is still checked on the server by `parseText`, now with `MAX_TITLE` shared with the form; only a shorter limit, no new route, query or secret. `/security-review`: not needed (only a shorter length check in an existing validation).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

None.

## Suggestions

- The R1 test checks the claim dialog only at 320 px, the worst case; fine.
- `size` (40) and `url` (500) are still inline numbers in `WishlistSection.tsx` and `lib/family.ts`; a small cleanup for later, not worth a card.

## Review run 1 (stopped, 2 must fix)

Run 1 was made before the card got R3 and found: R3 not built (no 60 limit, no tests, `solution.md` said 120), and an unrelated `text-overflow` assertion in the Christmas Eve tile test removed by mistake. **Done:** R3 built with unit and browser tests, docs updated to 60, the assertion restored.

## Outside the change

None.

[Specifications](../index.md)
