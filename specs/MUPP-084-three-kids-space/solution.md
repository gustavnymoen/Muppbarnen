---
type: Solution
title: "MUPP-084 Three kids: use the card's space: solution"
description: "How the three rows of a card with three kids fill the card's height with larger pictures and names, and why."
feature: MUPP-084
card: "#291"
depends_on: [MUPP-082]
---

# MUPP-084 Three kids: use the card's space: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 291`.

## Data

None.

## Interface

Only `DeckCardView` in `app/components/BirthdayDeck.tsx` changes, for a card with three kids:

- The list is `flex-1` (it fills the card under the heading) and each `li` is `flex-1 min-h-0`, so the rows share the height equally with the 12 px gap (R1). Nothing scrolls; the rows have no vertical padding, and the picture is centred in the row (the card said "padding reduced"; the card text is updated to match).
- Each `li` is a size container (`container-type: size`) and the picture takes its diameter from it: `max(56px, min(100cqh - 1rem - 2px, 40cqw))` (`ROW_AVATAR`): the row's height less 0.5 rem of air on each side and the border, at most 40 % of its width, never under 56 px (R2). `Avatar` already accepts a CSS length as its size.
- The name is `text-3xl` and still a `FitName`, so it shrinks to fit and is cut at 12 px (R3).
- Rows and tiles share one button, as before (R4); only the classes that differ by layout change.

## Decisions

- **Container query instead of measuring in script:** the picture follows the row's size in CSS alone, also when the window is resized, with no `ResizeObserver`.
- **Rows without vertical padding:** on a 320 × 568 phone the rows are about 104 px high, and the picture is limited by the width (40 %) rather than the height, so padding never has to give way; the 56 px minimum is a floor for very low screens.
- Proposal B (wish and sizes buttons in the rows) was tried as a mock-up and dropped: it did not fit a 320 px phone.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [manual](../../wiki/manual/startsidan.md); builds on [MUPP-082](../MUPP-082-christmas-card-by-kids/solution.md).

[Specifications](../index.md)
