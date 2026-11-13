---
type: Review
title: "MUPP-072 Loading state on buttons + nag button text: review"
description: "The code review of the busy state on buttons and the nag button text: findings, decisions and result."
feature: MUPP-072
---

# Code review of MUPP-072

**Result:** Passed (run 1 stopped on 1 must fix, fixed; see below)
**Date:** 2026-11-13, review run 1
**Summary:** Every `disabled={pending}` is now `busy={pending}`, the spinner is drawn once in `Button.tsx`, and the nag text is tied to the button. Run 1 found that the button shrank for the first 300 ms before the spinner showed; fixed.
**Security:** The security points of the review: passed (client components only, no new action, route, query or data). `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

- `app/components/Button.tsx:9` R1 was not met in the first 300 ms: `aria-busy:px-2.5` took 10 px off each side at once, but the spinner that makes up for it comes after the delay, so the button shrank and then grew. **Done:** the narrower padding is now set with `data-spinner`, which is set together with the spinner; the browser test measures the width in the window before the spinner too.

## Should fix

- `app/components/Button.tsx` The `inPadding` prop of `Spinner` was never used and its comment was wrong. **Done:** removed.
- `app/components/Button.tsx` `IconButton` carried the padding rule through `base` while no icon button used `busy`. **Done:** the rule moved to `Button` only; `/design` now shows a busy `IconButton` and `tests/design.spec.ts` checks it (spinner instead of the icon, 44 px wide).
- `specs/MUPP-072-loading-state/verification.md`, `review.md` were the empty template. **Done:** filled in.

## Suggestions

- Every button rendered its own empty `role="status"`. **Done:** the region is now only rendered while the button is busy (empty first, text after the delay), and is `position: fixed`. The full test run showed why this mattered: with an empty region on every button, tests that look for `getByRole("status")` found several, and a hidden absolute element at the bottom of `/design` gave the page its own scroll. Three existing tests (`MUPP-045` confirmations) now name `p[role=status]`.
- `Button.tsx` is a client component; `npm run build` shows that no server page passes it anything that cannot be serialised. Kept.
- `tests/helpers.ts` `pageAnimationsDone` and the motion test in `tests/design.spec.ts` skip animations that never end (the spinner on `/design`). Kept.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
