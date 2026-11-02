---
type: Review
title: "MUPP-026 Menu hidden after refresh on a phone: review"
description: "The code review of MUPP-026: findings, decisions and result."
feature: MUPP-026
---

# Code review of MUPP-026

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The document is locked (`overflow: hidden` on `html` when a page has `data-page`, plus `overscroll-behavior: none`), which covers R1 and R2; code, tests and docs match the card.
**Security:** The security points of the review: passed. `/security-review`: not needed, the change is CSS, one data attribute and tests.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `verification.md` was missing during the review. **Done:** written, with the manual iPhone check recorded as not checked.

## Suggestions

- The R1 test cannot fail without the fix in desktop Chrome; the manual iPhone check covers the real cause. **Done:** left as it is, stated in `verification.md`.
- `html:has([data-page])` couples the CSS to an attribute in `Page`. **Done:** left as it is; the CSS comment explains it.

## Outside the change

- Pages without `Page` keep a scrollable document on purpose. The admin child pages use `KidPage`, which uses `Page`, so they are locked too. Nothing added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
