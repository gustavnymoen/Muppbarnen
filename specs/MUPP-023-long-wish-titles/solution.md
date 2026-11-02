---
type: Solution
title: "MUPP-023 Long wish titles wrap and get a maximum length: solution"
description: "How a long wish title is wrapped, cut to two lines and made smaller in the wish row and the claim dialog: interface and decisions and why."
feature: MUPP-023
card: "#77"
depends_on: [MUPP-005, MUPP-019]
---

# MUPP-023 Long wish titles wrap and get a maximum length: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 77`.

## Data

None. The maximum length of a title is lowered from 120 to 60 (R3): `MAX_TITLE` in `lib/form-input.ts`, read by the form (`maxLength`) and by `parseText` in `saveItem`, as `MAX_DESCRIPTION` is. Titles already saved are not changed; one over 60 is refused when its wish is next saved, so it is shortened then. Nothing else on the server changes.

## Interface

- **Wrapping (R1):** in `WishRow` (`app/components/WishList.tsx`) the title button and the span around the texts are `min-w-0`, so the flex item may shrink below the width of its longest word; the title itself is `wrap-anywhere` (`overflow-wrap: anywhere`), which breaks a single long word. `break-words` was removed from the `li`, where it did nothing. The claim dialog's list of titles uses `wrap-anywhere` too.
- **Two lines (R2):** a closed row's title is `line-clamp-2` (ellipsis after two lines); an opened row drops the clamp, so the whole title is shown there.
- **Smaller text (R2):** `isLongTitle` in `lib/wishes.ts` is true for a title over 24 characters, and the row then uses `text-sm` (14 px instead of 16 px).

## Decisions

- **Threshold 24 characters:** CSS cannot tell whether a title wrapped, so the size follows the length. Tried at 375 px, where the text column is about 140 px: titles up to about 16 characters fit on one line at 16 px, and 24 characters is where a title is certain to need two lines, so the smaller text is used from there. A shorter title that wraps once keeps the normal size.
- **Clamp, not a tooltip or a "more" button:** the row already unfolds on a press, so it is the natural place for the whole title.
- **The dialog is not clamped:** it is the place where the visitor confirms what they claim, so the whole title is shown (wrapped).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [manual](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
