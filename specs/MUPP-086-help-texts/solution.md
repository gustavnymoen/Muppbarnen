---
type: Solution
title: "MUPP-086 Help dialog texts and Secret Santa sections: solution"
description: "How the help dialog got a text about own gifts, the family filter first, and Secret Santa guides in paragraphs instead of bullets."
feature: MUPP-086
card: "#300"
depends_on: [MUPP-050, MUPP-077, MUPP-080]
---

# MUPP-086 Help dialog texts and Secret Santa sections: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 300`.

## Data

None.

## Interface

- `app/components/OnboardingDialog.tsx`: in the guide "Barnens listor" > "Besökare" the part "Välj familj" is first (new text) and "Lägg till egna presenter" follows "Ångrat dig eller klickat fel?". The field `bullets` of a guide tab is replaced by `sections` (strings): each is shown as a muted paragraph, with the same spacing (`space-y-3`) as the parts of the other tabs, and no heading.
- Texts to visitors, Swedish: written by the user and approved on the card. "Secret Santa-grupper" is capitalised as on the rest of the site (decided with the user).

## Decisions

- **Grouping (R3, agreed with the user on a phone-sized screen):** the 6 bullets of "Deltagare" became 3 paragraphs (bullets 1-2, 3-5, 6) and the 7 of "Admin" 3 paragraphs (1-2, 3-4, 5-7). The sentences are word for word and in the same order; only the line breaks between them are gone. Space between paragraphs is enough to tell the sections apart without headings, and the muted text stays readable.
- **No new component:** the existing paragraph style of the dialog is reused; the list markup and its classes were deleted.
- **Same size on every tab:** the longest panel still decides the height (MUPP-050-R4); the test compares `offsetHeight`, which ignores the opening animation.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), manual [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
