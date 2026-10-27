---
type: Review
title: "MUPP-001 Design: review"
description: "The code review of Design: findings, decisions and result."
feature: MUPP-001
---

# Code review of MUPP-001

**Result:** Passed
**Date:** 2026-10-27, review run 2
**Summary:** All findings of run 1 are fixed and verified; no must-fix left.
**Security:** Passed. No sign-in, admin, API, database or personal data; the style guide uses made-up data. `/security-review`: not needed (see the card's test plan and `wiki/system/code-review.md`).

How the review works: [Code review](../../wiki/system/code-review.md).

## Review run 2

### Must fix

None. The run 1 fixes were checked in the code: padding and negative margin on `PageContent` with a test of the offsets, unused `childText` and test helpers removed, swatch values in `app/design/tokens.ts` checked by a unit test, the R7 test without an `if`, four font weights in the card, the pressable demo card a real button, `viewport-fit=cover`, and the reduced-motion press that keeps the highlight shadow.

### Should fix

- `verification.md` still had the template's front matter. **Done:** set to MUPP-001.
- `app/components/Page.tsx` comment lines misaligned. **Done:** aligned.

### Suggestions

- Child colour variables reached only through `var(--color-child-${color})` strings might not be emitted by Tailwind. **Done:** `@theme static` in `globals.css` emits every token.
- The sky hex is repeated in `app/design/page.tsx` and checked by a unit test. **Left as it is:** it works and is tested.
- `font-display: swap` is not tested in the browser. **Left as it is:** it is `next/font`'s setting, recorded as code-reviewed in `verification.md`.

### Outside the change

- Hover states (R4) are not tested; recorded in `verification.md`. Not added to the board: the card does not ask for a test of them.

## Review run 1

**Result:** Stopped (1 must fix)

### Must fix

- `app/components/Page.tsx` The scrolling content region clipped the focus ring (R4 "not hidden by other content") and the card shadows at its edges. **Done:** the region got padding and an equal negative margin, and `tests/design.spec.ts` checks that the first button, card and heading sit at least 6 px inside the region.

### Should fix

- Unused `childText` in `colors.ts`. **Done:** removed.
- Colour values repeated in `app/design/page.tsx`. **Done:** moved to `app/design/tokens.ts` and checked against `globals.css` in `lib/design-tokens.test.ts`.
- R7 check wrapped in `if (entrance)` could pass silently. **Done:** now asserted.
- The card said three font weights, the code loads four. **Done:** the card now says four.
- The pressable demo card was a `div` with `role="button"` and no key handler. **Done:** `Card` takes `as="button"`.
- `verification.md` was still the template; unused `TEXT` and `MUTED` in `tests/helpers.ts`. **Done:** filled in and removed.

### Suggestions

- Reduced-motion press replaced the highlight shadow. **Done:** it only darkens now.
- Safe areas do nothing without `viewport-fit=cover`. **Done:** set in `app/layout.tsx`.
- A caller's `style` replaced `--child`. **Done:** `Card` merges the styles.

### Outside the change

- Test token constants repeat `globals.css`; a helper that reads the CSS file could remove it later. Not added to the board (too small until more pages use them).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
