---
type: Review
title: "MUPP-055 Back arrow on the Secret Santa own page: review"
description: Code review of the back arrow and cross on the Secret Santa own page against the card's requirements and the code review rules.
feature: MUPP-055
---

# Review of MUPP-055

**Result:** Passed

The own page no longer has "Byt person". It has the arrow "Tillbaka" (a form post to the unchanged `leave`) with more than one group, and the cross "Stäng" (a plain link to `/`) with one group. Both cases are tested; no "Byt person" is left in code, tests or wiki. The reviewer did not run the tests, lint or the build (they were run by the builder).

**Security:** Passed. `leave` still calls `requireSiteSession()` and `guardWrite()` first; the arrow is a form submit, so no write happens on GET; the cross changes nothing; no new input, query, cookie or secret. `/security-review` not needed.

## Must fix

None.

## Should fix

- The parameter `back_` in `expectBackInCorner` was confusing. Fixed: renamed to `control`.

## Suggestions

- The Escape key press in the design test had no comment. Fixed: it now says why.
- `specs/features.md` lists MUPP-055 above MUPP-052; the list is in the order the features were finished, not by number, so left as is.
- R2's "without JavaScript" is recorded as not checked in `verification.md` (the page's streamed content is hidden without JavaScript); noted on the card.

## Outside the change

None.

[Specifications](../index.md)
