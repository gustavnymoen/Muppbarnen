---
type: Solution
title: "MUPP-036 Onboarding dialog: one button and a scroll cue: solution"
description: "How the onboarding dialog got one button that is an arrow while there is more text and OK at the end."
feature: MUPP-036
card: "#125"
depends_on: [MUPP-035]
---

# MUPP-036 Onboarding dialog: one button and a scroll cue: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 125`.

## Data

None.

## Interface

- `app/components/OnboardingDialog.tsx`: the cross "Stäng" is gone. The button at the bottom is one `Button`: a `ChevronDownIcon` named "Läs vidare" while `more` is true, and the text "OK" otherwise. The arrow scrolls the panel down by 80 % of its height (smooth, or at once with reduced motion); OK closes the dialog.
- `more` is `scrollHeight - scrollTop - clientHeight > 2` of the panel. It is checked on scroll, when the panel changes size (`ResizeObserver`; the dialog is hidden, so it has no size until it opens, and the phone may be turned) and when the tab changes, which also scrolls the new panel to the top.
- Texts: only the new accessible name "Läs vidare".

## Decisions

- **One button instead of two** (the user's proposal after trying it on a phone): the dialog closes with OK, Esc or a press outside, and the cross was a fourth way to do the same.
- **An arrow instead of a visible scrollbar:** iOS hides scrollbars until you scroll, and a styled one is not reliable there. The arrow works the same on every device, and the same button turning into OK also tells the reader that the end is reached.
- The focus stays on the button when it turns into OK, so a keyboard user can press it again to close.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), manual [Startsidan och menyn](../../wiki/manual/startsidan.md); built on [MUPP-035](../MUPP-035-onboarding-card/solution.md).

[Specifications](../index.md)
