---
type: Solution
title: "MUPP-087 Secret Santa help sections and mail texts: solution"
description: "How the Secret Santa guides in the help dialog got bold headings and shorter parts, and how mail 3 was reworded."
feature: MUPP-087
card: "#305"
depends_on: [MUPP-050, MUPP-052, MUPP-086]
---

# MUPP-087 Secret Santa help sections and mail texts: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 305`.

## Data

None.

## Interface

- `app/components/OnboardingDialog.tsx`: "Secret Santa" > "Deltagare" (five parts) and "Admin" (four parts) are `parts` (heading + paragraph), like the guide "Barnens listor". The field `sections` of `GuideTab`, its markup and the optional `?` on `parts` are deleted: every tab has `parts`.
- `lib/santa-mail.ts`: mail 3 (`startedMail`) has one line, "Det finns möjlighet att skriva meddelande till både den som ska köpa till dig och den du ska köpa till", instead of the two lines about the chats. The first paragraph and the amount line are as before.
- Texts to visitors, Swedish: written by the user and approved on the card (the first proposal was corrected by them).

## Decisions

- **Texts by the user:** the proposal in the card was replaced by the user's own wording; the code has the user's texts word for word and the test compares them word for word.
- **Same markup as the children's parts:** the existing `<section>`, `<h3>` and muted `<p>` are reused, so no new style or component was needed and the spacing test for the old sections in `design.spec.ts` was deleted with the sections.
- **Same size on every tab:** the longest panel still decides the height (MUPP-050-R4); the test compares `offsetHeight`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Mail](../../wiki/system/mail.md), manual [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
