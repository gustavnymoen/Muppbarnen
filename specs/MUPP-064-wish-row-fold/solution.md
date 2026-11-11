---
type: Solution
title: "MUPP-064 Wish rows fold out consistently: solution"
description: "How every wish row folds out to both headings with a dash for empty values, and why the change is only in the shared row."
feature: MUPP-064
card: "#207"
depends_on: [MUPP-005, MUPP-062]
---

# MUPP-064 Wish rows fold out consistently: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 207`.

## Data

None.

## Interface

- **`WishRow`** (`app/components/WishList.tsx`): the unfolded row always renders the "Beskrivning:" and "Storlek:" lines, with `–` (an en dash, normal text colour) when the value is empty. The link line is unchanged (only for an http(s) address), as is "Paxad av …" above them. The chevron and the button were already on every row, so no row needed other handling.
- **Both lists:** the children's lists and the match page use the same row, so one change covers both. The own list and the admin lists (`WishDetails`) are untouched.

## Decisions

- **Variant 1 of three, chosen by trying them:** the three variants in the card were drafted in the running site on a phone (a throwaway page, not committed): (1) always foldable with both headings, (2) foldable only with content and only filled headings, (3) like 2 with both headings. The user chose 1 with a dash, because it is the most consistent: every row looks and works the same, and nothing depends on what a wish happens to contain.
- **A dash, not a muted text:** "–" is short, and a muted "Inget angivet" per line would be noisy. Whether a screen reader reads the dash sensibly is checked live (card's test plan); a visually hidden text is the fallback.
- **No row height change:** as every row has a chevron, 44 px (children's lists) and 56 px (match page) stay as in MUPP-062.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Secret Santa match and change mails](../../wiki/system/secret-santa-match.md), [Startsidan](../../wiki/manual/startsidan.md), [Secret Santa](../../wiki/manual/secret-santa.md); builds on [MUPP-062](../MUPP-062-wish-rows/solution.md) and [MUPP-005](../MUPP-005-kid-card-and-claiming/solution.md).

[Specifications](../index.md)
