---
type: Solution
title: "MUPP-050 Secret Santa help dialog: solution"
description: "How the dialog Så funkar det got two guides (Barnens listor and Secret Santa) in underlined tabs and a size that does not change between tabs."
feature: MUPP-050
card: "#151"
depends_on: [MUPP-035, MUPP-036, MUPP-049]
---

# MUPP-050 Secret Santa help dialog: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 151`.

## Data

None. The seen cookie is the existing `__Host-onboarding` ([MUPP-035](../MUPP-035-onboarding-card/solution.md)).

## Interface

- `app/components/Tabs.tsx`: the row of underlined tabs is now its own component, `TabBar` (controlled: `selected` and `onSelect`), and `Tabs` (the admin page) uses it. The row has `whitespace-nowrap` and less padding on a phone so the two tabs of the dialog stay side by side at 320 px.
- `app/components/OnboardingDialog.tsx`: the dialog is titled "Så funkar det". `GUIDES` holds two guides, "Barnens listor" (the tabs Besökare and Förälder, texts as before) and "Secret Santa" (the tabs Deltagare and Admin, bullet lists). The `TabBar` "Välj guide" switches guide; under it a tabpanel holds the button tabs "Läs som" and the text. A new `guide` prop ("listor" or "santa") says which guide to start on.
- `app/components/SiteMenu.tsx`: the menu item is "Så funkar det", and the dialog gets `guide="santa"` when `usePathname()` starts with `/secret-santa`.
- Texts to visitors, Swedish: written by the user and approved on the card (R3).

## Decisions

- **Same size on every tab (R4):** all four texts are rendered in one CSS grid cell on top of each other; the shown one is visible and the other three are `invisible` and `inert` (they keep their height but are out of the accessibility tree and the tab order). The scroll container is the grid, so the dialog gets the height of the tallest text (at most 85 % of the screen, from `max-h-[85dvh]`) and the button stays in the same place. The scroll cue of [MUPP-036](../MUPP-036-onboarding-scroll/solution.md) is unchanged and is reset when either tab changes. The price: on a short screen even the shortest text has an arrow instead of OK until it is read to the end of the tallest panel's height.
- **Two kinds of tabs:** the guide choice is underlined (like the admin page), the choice under it keeps the buttons, so the two rows are not mistaken for each other. Tried on 375 and 320 px; at 320 the first version wrapped "Barnens listor" onto two lines, fixed with `nowrap` and narrower padding.
- **Starting tab from the page:** the dialog is owned by `SiteMenu`, which already knows the page by `usePathname`. The state is not saved anywhere: the dialog's content starts again at every opening, as before.
- **First visit:** the start page opens it on "Barnens listor"; any way of closing it sets the cookie, whichever guide shows (the cookie is set by `onClose`, not by a tab).
- **Tests close the dialog with Esc,** not OK, since OK appears only when the whole text fits ([MUPP-050-R4](https://github.com/gustavnymoen/Muppbarnen/issues/151)); the helpers and the global setup wait for the dialog before pressing Esc.
- **No cross:** the card text said the cross stays; the information dialog has had no cross since [MUPP-036](../MUPP-036-onboarding-scroll/solution.md), so it closes with OK, Esc and a press outside.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), manual [Startsidan och menyn](../../wiki/manual/startsidan.md) and [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
