---
type: Review
title: "MUPP-050 Secret Santa help dialog: review"
description: "The code review of the Secret Santa help dialog: findings, decisions and result."
feature: MUPP-050
---

# Code review of MUPP-050

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** The change does what R1 to R7 ask and reuses the shared tab row (`TabBar`, taken out of `Tabs`) and `Dialog`. No must-fix findings; the should-fix points were fixed.
**Security:** Passed. Fixed texts only; no input, route, server action, query, cookie or secret is added, and `markOnboardingSeen` is unchanged. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/design.spec.ts` (R4 test) ran at 320 px only. **Done:** it now runs at 375 x 667 and 320 x 568.
- `tests/MUPP-050-santa-help.spec.ts` did not test Home, End and the tab order of the top tabs. **Done:** added to the first test.
- `tests/MUPP-050-santa-help.spec.ts` (third test) loaded the page twice. **Done:** one `goto`.
- `verification.md` and the check of the texts against the admin. **Done:** "aktivera och starta" means one after the other and "till julafton" stays, both confirmed by the user; the wipe (24 January) matches `lib/santa-cleanup.ts`.

## Suggestions

- The inner "Läs som" tabs have their own arrow-key code. **Done:** left as it is (old code, the card keeps the button style); a `variant` on `TabBar` is the way if a third place needs button tabs.
- OK shows only after scrolling on a short screen, because the dialog is as tall as its longest text. **Done:** left as the trade-off for no jumping; recorded in `solution.md`.
- The OK path of the first visit is covered by the 320 px design test only (the setup closes with Esc). **Done:** noted.

## Outside the change

None.

[Specifications](../index.md)
