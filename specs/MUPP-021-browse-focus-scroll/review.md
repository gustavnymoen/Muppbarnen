---
type: Review
title: "MUPP-021 Browse forward with a list open: review"
description: "The code review of MUPP-021: findings, decisions and result."
feature: MUPP-021
---

# Code review of MUPP-021

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The `focus({ preventScroll: true })` fix matches the cause in `solution.md` and meets MUPP-021-R1. No must-fix findings.

## Security

Passed. No sign-in, route, action, query or personal-data changes; `/security-review` is not needed.

## Must fix

None.

## Should fix

- The tests lacked `expectNoA11yViolations` although the card's test plan says axe. Fixed: both tests call it.
- `verification.md` lacked test counts and times. Fixed when the full suite had run.

## Suggestions

- Other `.focus()` calls (`WishList.tsx`, `Fold.tsx`, `ListPicker.tsx`) could scroll their containers too; not changed without a reproduction.
- The `deckScroll` helper in the test walks two parent elements and breaks if the markup changes; its comment names the intent.
