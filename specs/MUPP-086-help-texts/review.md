---
type: Review
title: "MUPP-086 Help dialog texts and Secret Santa sections: review"
description: "The code review of the help dialog texts and Secret Santa sections: findings, decisions and result."
feature: MUPP-086
---

# Code review of MUPP-086

**Result:** Passed
**Date:** 2026-11-20, review run 1
**Summary:** The texts are word for word as approved, the Secret Santa sentences are all there in the same order with the agreed grouping, and the old `bullets` code is deleted. No must-fix findings.
**Security:** Passed: static text and markup, no input, route, query, cookie or secret. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/design.spec.ts`: the look (space between sections) was not in the dialog's design test. **Done:** the test "MUPP-035-R6 … MUPP-050-R4" now checks a gap of at least 8 px between the paragraphs of both Secret Santa tabs (the contrast is the existing muted text colour, covered by axe).
- `tests/MUPP-086-help-texts.spec.ts`: "the intro stays above all parts" and "every sentence in the same order" were not asserted. **Done:** added (intro above "Välj familj"; first and last words of each of the three paragraphs per tab). The scroll arrow and OK button are unchanged and covered by the MUPP-035, MUPP-036 and MUPP-069 tests, which pass.
- `verification.md`: the suite time had no TECH card. **Done:** TECH-030 added.

## Suggestions

- `app/components/OnboardingDialog.tsx:186` `key={text}`: fine, the strings are unique. Left as it is.
- Re-run `npm run test:time` for a clean "After" row. **Done:** see `verification.md`.

## Outside the change

- The suite is at its time budget: added as TECH-030 (#301).
- Next.js is flagged with a security advisory: added as TECH-031 (#302).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
