---
type: Solution
title: "MUPP-080 Choose families: solution"
description: "How the visitor's choice of families is built: the cookie, the filtering and the interface, and why."
feature: MUPP-080
card: "#279"
depends_on: [MUPP-073, MUPP-004, MUPP-039]
---

# MUPP-080 Choose families: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 279`.

## Data

No migration. The choice is a cookie: `families` (`__Host-families` in production, as the other cookies), HttpOnly, `Secure` in production, `SameSite=Lax`, path `/`, one year. Its value is `all` (Alla, no filter) or ids joined by commas (`1,3`); anything else counts as no choice (`parseChoice` in `lib/family-choice.ts`). It holds nothing about the person.

## Interface

- `lib/family-choice.ts`: the cookie and what a choice means (`resolveChoice`): fewer than two families is `single` (nothing asked, nothing filtered), two or more with no valid choice is `choose`, otherwise `chosen`; ids of families that no longer exist are dropped and an empty rest is no choice. `lib/family-view.ts` (`familyView`) reads the cookie and the families on the server.
- `chooseFamilies` (`app/actions.ts`): a form action that checks the site session and `guardWrite()` first, reads `all` and the `family-<id>` fields, checks the ids with `checkFamilyIds` (numbers that exist), writes the cookie and revalidates the layout. Nothing is chosen: "Välj minst en familj, eller Alla."
- `app/components/FamilyChoice.tsx`: `FamilyButton` (an icon button, a family with a funnel, named "Familj: Alla" / the family's name / "N valda", the text beside the icon from 640 px) at the top left, `FamilyCard` (the card "Vilken familj tillhör du?" with the choices listed from the start and "Spara") and the same `ChoiceForm` in a `Dialog` with the same title and text (one setting for the whole site, so one copy) with a checkbox per family (name and description) and "Alla", which excludes the families. `SiteHeader`/`Page` have a `filter` slot next to `back`.
- Start page (`app/page.tsx`): `listDeckInput(today, familyIds)` reads only the children whose parent is in a chosen family; with `choose` nothing is read and the card is shown.
- Secret Santa entrance (`app/secret-santa/page.tsx`): `entranceEvents(familyIds)` lists only the chosen families' Secret Santa. With two or more families the list is never skipped, also for one Secret Santa, and "Tillbaka" from the names goes to the list (R5). The button is shown on the list step only.
- "Så funkar det" (`OnboardingDialog.tsx`): a part "Välj familj" for visitors.

## Decisions

- **Filtered on the server, by a cookie.** The page is rendered per request, so children and Secret Santa of other families are never sent to the browser, and nothing flashes. A client-side filter on `localStorage` would show everything first.
- **Alla is stored as `all`, not as every id**, so a family added later is shown to those who chose Alla.
- **No choice means asked, not shown.** A visitor who never chose gets the card once the second family exists; Alla is one tick.
- **Fewer than two families: nothing changes.** The site looks as it did, and no button or card appears, so MUPP-073 could be released without visitors noticing.
- **A filter, not a boundary.** Everyone has the same site password and can choose any family; a link to another family's Secret Santa (`?grupp=`) still signs in. The dialog says it only filters.
- The dialog lies below the header (`Dialog` prop `belowHeader`) and closes on a press on the backdrop (`backdropClose`), so the filter button and the menu stay in sight and a press on the button closes it again. It opens and closes with the same motion as every card: it grows out of the button and folds back into it.
- The dialog is not a native `select` because several families can be chosen; "Alla" and the families are checkboxes whose state is in the component so they exclude each other.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu (system)](../../wiki/system/start-page.md), [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), the manuals [Startsidan](../../wiki/manual/startsidan.md) and [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
