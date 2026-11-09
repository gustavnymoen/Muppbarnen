---
type: Solution
title: "MUPP-049 Menu names and order: solution"
description: "How the menu got the names Barnens listor and Så funkar listorna and the order Barnens listor, Secret Santa, Så funkar listorna, Admin."
feature: MUPP-049
card: "#150"
depends_on: [MUPP-002, MUPP-035]
---

# MUPP-049 Menu names and order: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 150`.

## Data

None.

## Interface

- `app/components/SiteMenu.tsx`: the entries are "Barnens listor" (link to `/`, was "Start"), "Secret Santa", "Så funkar listorna" (the button that opens the dialog, was "Så funkar sajten") and "Admin", in that order; Admin is last and muted as before.
- `app/components/OnboardingDialog.tsx`: the dialog's title, which is also its accessible name, is "Så funkar listorna". The texts inside the dialog are unchanged.
- Comments in `app/page.tsx`, `app/actions.ts` and `lib/onboarding.ts` that quote the dialog's name were updated.

## Decisions

None worth recording: only words and order changed, no new markup. The older specs of MUPP-002 and MUPP-035 keep the words they were built with; the tests of both were updated (the requirement IDs `MUPP-049-R1 R2 R3` are in the names of the two tests that check the menu and the dialog).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), [Form cards](../../wiki/system/form-cards.md), [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
