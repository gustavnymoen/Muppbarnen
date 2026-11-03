---
type: Solution
title: "MUPP-032 No focus ring after a tap: solution"
description: "How the site keeps the focus ring off elements focused by a tap or click, with one flag on the page and one CSS rule, and shows it again at the next key."
feature: MUPP-032
card: "#107"
depends_on: [MUPP-022, MUPP-006, MUPP-005, MUPP-014]
---

# MUPP-032 No focus ring after a tap: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 107`.

## Data

None.

## Interface

- `app/components/InputModality.tsx` (client component, rendered once in `app/layout.tsx`): two listeners on `document`, in the capture phase. `pointerdown` sets `data-pointer` on `<html>`, `keydown` removes it. It renders nothing.
- `app/globals.css`: `html[data-pointer] :focus-visible { outline: none }` replaces `[data-quiet-focus]:focus-visible`. The ring itself (`:focus-visible`, 3 px, brand colour) is unchanged.
- `app/components/BirthdayDeck.tsx`: MUPP-022's special case is removed (`byKeyboard`, `data-quiet-focus`, the `onKeyDown` and `onPointerDownCapture` lines for it). Focus moves exactly as before.

No visible text changes.

## Decisions

- **One rule for the whole site, not one per element.** The fault is the same everywhere: WebKit on a phone makes `:focus-visible` match an element that got the focus from `showModal()` or from a dialog closing, after a tap. Marking each such element (as MUPP-022 did for the kid's tile) would have to be repeated for the dialogs' first controls, the "Önskningar" scroll box and every dialog added later. A flag on `<html>` for "the last input was a pointer" covers them all.
- **Capture phase on `document`.** `Dialog` stops `keydown` and `pointerdown` from reaching the deck behind it, and React's own handlers would never see a tap inside it. Native capture listeners on `document` run first and are not affected.
- **Any key shows the ring again,** also Shift or Tab alone, so a tap followed by Tab shows the ring on the newly focused element (R2). Text fields keep the ring while typing: typing is a key.
- **A known limit:** assistive technology that presses a button without a key or a pointer event is counted as a pointer, so the ring is hidden for it until the next key. It is the same limit as in MUPP-022.
- **Why only WebKit shows the fault.** In Chromium a control focused by a tap does not match `:focus-visible`, so the Chromium suite passes with or without the fix; the WebKit test (`npm run test:webkit`, not in CI because WebKit isn't installed there) fails without the rule and passes with it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Accessibility](../../wiki/system/accessibility.md), [Testing](../../wiki/system/testing.md). Replaces the special case in [MUPP-022](../MUPP-022-close-animation-glitch/solution.md).

[Specifications](../index.md)
