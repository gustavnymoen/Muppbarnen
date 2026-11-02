---
type: Review
title: "MUPP-019 Wish row: info button, labels and order: review"
description: "The code review of the wish row's info button, labels and order: findings, decisions and result."
feature: MUPP-019
---

# Code review of MUPP-019

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** R1–R4 are built as the card says and the sort rule stays in `sortWishes`. Unit, browser and design tests name their requirements. No must-fix findings. The review read the code only; lint, type check, build and tests were run separately.

**Security:** Passed. No data, route, server action or query changes; the bubble text is a fixed string rendered by React. `/security-review` not needed (card).

## Must fix

None.

## Should fix

- `inset-y-auto` next to `top-0` on the bubble did nothing: removed.
- A long title that wraps can leave the bubble covering the row's own expand button while shown. Accepted: the bubble starts right of the info button and hides on the next press. Not checked by hand with a long title.

## Suggestions

- The order test finds titles through markup (`button[aria-controls]:not([aria-label])`); a shorter locator would be less fragile. Left as is.

## Outside the change

None.
