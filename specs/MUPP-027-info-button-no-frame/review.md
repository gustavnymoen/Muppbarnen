---
type: Review
title: "MUPP-027 Info button without a frame: review"
description: "The code review of Info button without a frame: findings, decisions and result."
feature: MUPP-027
---

# Code review of MUPP-027

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The change does what R1–R3 ask: `IconButton` gets a `frameless` prop that swaps the frame classes, and `InfoBubble` uses it. It reuses the shared component and the `edge` token, and the docs, log and `features.md` are updated.
**Security:** Passed. No sign-in, API, server action, database or personal-data code is touched. `/security-review`: not needed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `verification.md` The press state was not tested and the Code review row was set before `review.md` existed. **Done:** the test now holds the mouse down and checks the tint and that the button has not moved; the row and checklist are set.

## Suggestions

- `app/components/Button.tsx:32` `framelessClass` repeats layout parts of `base` and `iconClass`. **Done:** left as it is; `solution.md` explains why (no class override). With a second frameless button, build both from one size string.
- `tests/design.spec.ts` The keyboard-focus check is indirect. **Done:** a comment says why.

## Outside the change

- Nothing.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
