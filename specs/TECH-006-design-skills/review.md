---
type: Review
title: "TECH-006 Design skills and a design pass: review"
description: "The code review of Design skills and a design pass: findings, decisions and result."
feature: TECH-006
---

# Code review of TECH-006

**Result:** Passed
**Date:** 2026-10-29, review run 1
**Summary:** The design pass (hidden site name, admin icon links with text from 640 px, one-line wish button, tiles on the Christmas card, wish list reveal) follows `DESIGN.md`, and the new motion respects `prefers-reduced-motion`. No must-fix findings.
**Security:** Passed. No sign-in, API, server action, database or personal-data code is touched (markup, CSS and tests only). `/security-review`: not needed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/globals.css` `.twin-avatar > *` forced the size with `!important` on top of the inline size, with two sources of truth, and the initial's font size stayed fixed. **Done:** `Avatar` now takes a CSS size (`size` may be a string such as `clamp(…)`), the constant `TWIN_AVATAR` in `BirthdayDeck.tsx` holds it, the font size follows (`calc(size * 0.45)`), and the CSS rule is removed.
- `DESIGN.md` did not mention the wish list reveal or the hidden site name. **Done:** both are in the motion and layout sections.

## Suggestions

- `divider-short` hard-codes `30 %`, `0.75rem` and `1px`. **Done:** left as it is: it is used in one place, and a token for it would be more than the rule it names.
- The contrast check in `TECH-006-R5` covers only the kid colours on the test card. **Done:** left as it is: the two kids on the test card are two of six; the contrast of all six was calculated by hand (5.6–7.5) and the colours are tokens in `DESIGN.md`. A unit test over all six is a small candidate for a later cleanup.
- The test of the hidden `h1` checks the bounding box and not `sr-only`. **Done:** left as it is: the box shows that the heading is not visible, and the accessible name is checked in the same test.

## Outside the change

- `IconLink compact` is 32 px, below the 44 px of `DESIGN.md`'s Layout section. **Done:** `DESIGN.md` now names the exception (WCAG 2.2 AA, chosen in MUPP-010). Not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
