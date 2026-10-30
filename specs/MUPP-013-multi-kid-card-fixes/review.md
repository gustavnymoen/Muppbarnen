---
type: Review
title: "MUPP-013 Multi-kid birthday card fixes: review"
description: "The code review of Multi-kid birthday card fixes: findings, decisions and result."
feature: MUPP-013
---

# Code review of MUPP-013

**Result:** Passed
**Date:** 2026-10-29, review run 1
**Summary:** The change does what R1–R5 say; each requirement has a test named after it and the docs are updated. No must-fix findings; two should-fix points were fixed. The review was made against the requirements in `verification.md` and `solution.md` (the card could not be read from the reviewer's sandbox).
**Security:** Passed. Front end only: no routes, actions, queries, cookies or personal data; only the name already on the card is shown. `/security-review`: not needed, as the test plan says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/FitName.tsx:25` The effect depended on `[children]`, which is a new array on every render on the Christmas tiles, so the observer was recreated each time; and `document.fonts.ready.then(fit)` had no cleanup. **Done:** `FitName` takes the name as a string (the screen-reader text "Öppna" is a sibling in the tile) and the font callback is skipped after unmount.
- `tests/design.spec.ts` (the Christmas test) The name was found through the Tailwind class `span.block`. **Done:** it is found by its text.

## Suggestions

- `app/components/WishList.tsx` `aria-expanded={false}` is constant on the closed button. **Done:** left as it is: it is true, and the button is replaced when the list opens; the screen-reader behaviour is part of the live accessibility check, which is still to do.
- `tests/design.spec.ts` (R1 check) The test hard-coded the 12 px of the divider's padding. **Done:** it now allows a difference under 20 px.
- `app/components/BirthdayDeck.tsx` The id shared by the wish button and "Stäng" couples two components. **Done:** a comment at `open`.

## Outside the change

- `.claude/launch.json` is local only. **Done:** kept out of the commit.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
