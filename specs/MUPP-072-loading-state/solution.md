---
type: Solution
title: "MUPP-072 Loading state on buttons + nag button text: solution"
description: "How every button that waits for a server action shows a busy state, and how the locked nag button explains itself."
feature: MUPP-072
card: "#250"
depends_on: [MUPP-071]
---

# MUPP-072 Loading state on buttons + nag button text: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 250`.

## Data

None.

## Interface

- **`busy` on `Button` and `IconButton`** (`app/components/Button.tsx`, now a client component because it holds the delay state). `busy` locks the button at once (`disabled`), sets `aria-busy="true"`, and after 300 ms draws a spinner to the left of the text (on an `IconButton`, instead of the icon). A busy button is less pale (`aria-busy:disabled:opacity-90`) than a disabled one (60 %), so it reads as "working" and not as "off".
- **No size jump (R1):** the spinner is 12 px wide and the button's gap is 8 px; while busy the side padding goes from 20 px to 10 px (`aria-busy:px-2.5`), which makes up for the 20 px the spinner takes; the narrower padding is set with `data-spinner`, which comes together with the spinner, so the button does not shrink in the 300 ms before it. The text moves 10 px to the right, the button keeps its width and height.
- **The delay (R2):** `delayedFlag` in `lib/busy-delay.ts` (plain code, unit tested with a fake clock) starts a 300 ms timer when `busy` turns on and cancels it when it turns off. The `useBusy` hook in `Button.tsx` wraps it.
- **Screen readers (R3):** the spinner is `aria-hidden`. A `role="status"` span (visually hidden, `position: fixed` so it cannot give the page a scroll) beside the button exists only while the button is busy: empty first, "Arbetar …" when the spinner appears, so it is announced once, politely, without moving focus. It is a sibling of the button, not inside it, so the button's name does not change. The existing toasts and `role="alert"` messages are untouched.
- **Motion (R4):** `.spinner` in `globals.css` is a ring in the button's own text colour (`currentColor`, so the contrast of each variant carries over) that turns; with `prefers-reduced-motion` it is a full ring that pulses in opacity instead.
- **Who uses it:** every `disabled={pending}` became `busy={pending}`: `Form` (save, add), `ConfirmAction`, `ClaimDialog` and `UnclaimDialog` in `WishList.tsx`, `ChatButton`, `NagButton`, `LoginForm`, `SignInForm`, `MemberEdit` and `CopyItem`. A grep for `disabled={pending}` in `app/` finds nothing.
- **Nag button text (R5):** `NagButton` shows "Du kan bara tjata en gång i timmen." under the button whenever it is locked (`state !== "free"`), the same text for "Tjatet är på väg" and "Du har tjatat nyss". The button points at it with `aria-describedby`. The text is normal body text, not dimmed. The button stays locked by the `state` property, and `busy` only covers the moment the action runs.
- `/design` shows three busy buttons next to the disabled ones.

## Decisions

- **Spinner left of the text, not text only ("Sparar …").** The buttons keep their words (R1 says the text stays), and a ring reads as "working" in every language. Tried and dropped: the spinner placed absolutely in the side padding looked crowded against the text and the rounded corner; a spinner that simply pushed the text made the button 20 px wider (a layout jump).
- **`Button.tsx` is a client component.** It was imported by server components too (the not-found page), which is fine: a client component can be used from a server component; only hooks cannot run in a server module.
- **The spinner shows after the delay, the lock does not.** A double press on a slow action is blocked at once; a fast action never flashes a ring.
- **`pageAnimationsDone` in `tests/helpers.ts`** skips animations that never end, or the accessibility check would wait forever on a busy button that stays busy (the `/design` page).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md), [Secret Santa match page](../../wiki/system/secret-santa-match.md), [Accessibility](../../wiki/system/accessibility.md), [Manual: Secret Santa](../../wiki/manual/secret-santa.md), [DESIGN.md](../../DESIGN.md).

[Specifications](../index.md)
