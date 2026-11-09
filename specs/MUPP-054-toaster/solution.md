---
type: Solution
title: "MUPP-054 Toast after saving: solution"
description: "How the toast is built: one Toaster in the root layout in the browser's top layer, called from Form, the copy dialog and the question card."
feature: MUPP-054
card: "#159"
depends_on: [MUPP-045]
---

# MUPP-054 Toast after saving: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 159`.

## Data

None. No migration and no server action changed.

## Interface

- **`app/components/Toaster.tsx`** (R1, R2, R3): `<Toaster />` sits once in `app/layout.tsx`; `toast(text, error?)` can be called from any client code and does nothing if the page has no Toaster. The element is `popover="manual"`, shown with `showPopover()` for every message (after a `hidePopover()`, so it goes on top of a card opened since the last message), which puts it in the top layer in front of a modal `<dialog>`. It is fixed at the top, centred (`env(safe-area-inset-top)`), never wider than the screen and `pointer-events: none`. Timing: slides down from above, centred, in 300 ms (a Web Animation), stays 2 s, fades out in 300 ms (a Web Animation with `fill: forwards`), then `hidePopover()`; with reduced motion it appears and goes after 2 s without either. A new message cancels the timers and the animations and starts again. Green is `.toast-saved` and red `.toast-error` in `globals.css`.
- **`Form.tsx`**: after a save `toast(message)` (the same words as before: "Otis sparades", "fotboll lades till"; a new wish has the short title), after a failure that is an error of the form itself (`state.error`, which the server sets) `toast(state.error, true)`; errors at fields get no toast; this holds in a card and on a page. The rest is unchanged: the card closes with `close(announce)`, or stays with `confirm`, the first field with an error gets focus.
- **`Dialog.tsx`**: the line at the top of the card is now `sr-only` (it is the screen reader's confirmation for a card that stays open); the fade and the scroll to the top of the card that served the visible line are gone.
- **`CopyItem.tsx`**: "{titel} lades till" as a toast and as the announcement; a server error as a red toast. **`ConfirmAction.tsx`**: a server error as a red toast (a removal that succeeds shows no toast, as before).
- **Texts (Swedish):** the messages above; the red toast shows the server's own message.

## Decisions

- **Top layer, not a high `z-index`.** A modal `<dialog>` is above everything in the page, whatever its `z-index`; only another top-layer element is in front of it. Hence `popover`.
- **The toast is for the eye only (`aria-hidden`).** A popover outside the open card is inert while the card is modal, so it would not be read in the one case where the card stays open. The announcements are therefore unchanged: the hidden `aria-live` next to the card after a card has closed, the card's own status line while it stays open, "Sparat." on a page. Errors are read from the field and the alert as before.
- **Short Web Animations and timers, not one animation of 2.6 s.** The tests wait for all animations to finish (`animationsDone`); a long one would make every test wait, and a timer can be moved with the page's clock.
- **Not in the toast:** sign-in forms (they are not saves) and a removal that succeeds.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Form cards](../../wiki/system/form-cards.md), [Design system](../../wiki/system/design.md); for the visitor [Administration](../../wiki/manual/admin.md).
- Builds on [MUPP-045](../MUPP-045-form-cards/solution.md).

[Specifications](../index.md)
