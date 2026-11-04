---
type: Review
title: "MUPP-036 Onboarding dialog: one button and a scroll cue: review"
description: "The review of the one-button, scroll-cue change in the onboarding dialog."
feature: MUPP-036
---

# Code review of MUPP-036

**Result:** Passed
**Date:** 2026-11-04, review run 1
**Summary:** A small change to one component (the cross removed; one button that is an arrow or OK) and two extended tests. Read by the author against `wiki/system/code-review.md`; no separate reviewer run, since it changes no server code.
**Security:** Not applicable: no server action, cookie or input changed.

## Must fix

None.

## Should fix

None.

## Suggestions

- `OnboardingDialog.tsx` The button changes its name while it has the focus; a screen reader may not announce the change. **Done:** left as it is: the name says what pressing does, and the arrow label "Läs vidare" is read when the focus lands on it.
