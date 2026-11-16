---
type: Review
title: "MUPP-085 Admin wish lists: arrows, slide and button places: review"
description: "The code review of MUPP-085: findings, decisions and result."
feature: MUPP-085
---

# Code review of MUPP-085

**Result:** Passed
**Date:** 2026-11-16, review run 2
**Summary:** Run 1 stopped on one must-fix (a swipe inside an open form card flipped the kid and lost what was typed); it is fixed and run 2 found nothing that must or should be fixed.
**Security:** Passed. `KidPage` still checks the site and admin sign-in and `canManage` before `notFound()`; only the signed-in parent's own kids (`listChildren(parent.id)`) are rendered, or the one kid alone for the master administrator on another parent's kid, so another parent's lists are never in the page (a browser test checks that the page source has none). No new route, action, cookie or query. `/security-review`: not needed (the card's test plan, nothing of sign-in, API routes, actions or queries is added).

How the review works: `wiki/system/code-review.md`.

## Review run 2

### Must fix

None.

### Should fix

None.

### Suggestions

- `KidFlipper.tsx` The panel that slides out was still readable and focusable for 250 ms. **Done:** it is `inert` and `aria-hidden` while it leaves.
- `KidFlipper.tsx` A text-selecting drag with the mouse over the lists flips the kid. **Done:** left as it is: touch is the target, and the start page's deck does the same.
- `KidFlipper.tsx` `panels.find(...)!` throws if the shown kid is no longer among the panels (a kid removed elsewhere, then a stale page refreshed). **Done:** left as it is: kids are not removed on this page, and a refresh of the page renders the list again.

### Outside the change

- `SizesButton`'s `corner` mode is now used only by the start page's deck. Nothing to do now; check it if the deck changes. The card's mention of a "sizes page" is out of date (it was removed in MUPP-045); `solution.md` says so.

## Review run 1

**Result:** Stopped (1 must fix)

### Must fix

- `KidFlipper.tsx` (the swipe): R2 says a swipe must not change the kid while a form card is open, but the open `<dialog>` is a DOM child of the flipper, so a horizontal drag inside a card flipped the kid, unmounted the card and lost what was typed. **Done:** the swipe is ignored when it starts in a dialog or on a control, or when any dialog is open; the browser test swipes on a button, in the open card's field and heading, and expects the same kid.

### Should fix

- `KidFlipper.tsx` `onAnimationEnd` cleared the leaving panel for any animation that bubbled up (the card's grow, a toast, a spinner). **Done:** only the panel's own animation counts.
- Untested R2 criteria (swipe from a button, fresh lists, the leaving panel cleaned up). **Done:** the swipe checks and the "wish added before flipping is there when flipping back" check joined the wish list test; the slide class is checked to be gone after the slide.
- `KidFlipper.tsx` the `popstate` listener kept the kids of the first render. **Done:** it reads them from a ref.
- `tests/helpers.ts` `expectBackArrow` measures the menu button, which the not-found page has too (the full run passed). **Done:** the comment says "the page may have none" no more.
- `DESIGN.md` the new bullets stood after the closing link. **Done:** moved into their own section.
- `KidFlipper.tsx` the reduced-motion check ran inside a state updater. **Done:** it is read before the updater.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
