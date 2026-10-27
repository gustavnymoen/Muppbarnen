---
type: Review
title: "MUPP-002 Start page: review"
description: "The code review of Start page: findings, decisions and result."
feature: MUPP-002
---

# Code review of MUPP-002

**Result:** Passed
**Date:** 2026-10-27, review run 1
**Summary:** The header, hamburger menu and CSS-only carousel meet R1–R4 and reuse the MUPP-001 components; every requirement has a test. No must-fix findings.
**Security:** Passed. No sign-in, admin, API, database, cookie or personal data; all data is made-up. `/security-review`: not needed (see the card's test plan).

How the review works: [Code review](../../wiki/system/code-review.md).

## Must fix

None.

## Should fix

- `app/components/SiteMenu.tsx:42` `onBlur` closed the menu when `relatedTarget` was null; Safari gives buttons no focus on click, so a click on "Start" or "Admin" could unmount the menu first. **Done:** it now closes only when the next focus target is known and outside; clicks outside are handled by the `pointerdown` listener. Not run in Safari.
- `verification.md` "Before" row of the test suite is an estimate. **Done:** the file says so (found by subtracting the new tests' time).
- `review.md` was missing when `verification.md` linked to it. **Done:** this file.

## Suggestions

- `tests/MUPP-002-start-page.spec.ts:98` The snap position was compared to a fixed 16 px. **Done:** it is now compared to the heading's `x`.
- `app/components/SiteMenu.tsx:34` Closing logic is in two handlers (`pointerdown` and `onBlur`). **Done:** left as it is; each covers a different input and the split is commented.
- "Swiped" in R3 is tested through the arrow keys and the CSS values; real touch is left to the manual checklist on the live site.

## Outside the change

- `specs/features.md` listed MUPP-001 as Ongoing although merged; set to Done in this change.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
