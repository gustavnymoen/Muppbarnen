---
type: Solution
title: "MUPP-069 Help dialog arrow over the tabs on iPhone: solution"
description: "How the panel of the Så funkar det dialog is sized so that it never collapses on iOS and the arrow stays under it."
feature: MUPP-069
card: "#232"
depends_on: [MUPP-050]
---

# MUPP-069 Help dialog arrow over the tabs on iPhone: solution

What is built and why is in the card: `gh issue view 232`.

## Data

None.

## Interface

In `OnboardingGuides` (`app/components/OnboardingDialog.tsx`) the box around the text tabs and the scrolling panel in it use `flex-auto` (`1 1 auto`) instead of `flex-1` (`1 1 0%`). No texts or looks change.

## Decisions

- **Why it happened:** the dialog is a flex column whose height is only limited by `max-h-[85dvh]`, so its height is not definite. With a 0% basis iOS WebKit (the user's iPhone, Chrome 2026-11-12) gave the box and the panel height 0, and the button after them was drawn over the tabs. Chromium and Playwright's WebKit take the content height, so the tests never saw it.
- **Why `flex-auto`:** the basis is the content height, `min-h-0` still lets it shrink, and the panel scrolls inside `max-h`, so what the dialog looks like where it worked does not change.
- **Test:** the order tabs, panel, button is checked in the dialog test of `tests/design.spec.ts` and in `tests/MUPP-069-help-dialog-arrow.webkit.spec.ts`. Neither fails on the old code, as neither engine collapses the panel; only a real iPhone shows it (verification.md).

## Related

- [Verification](verification.md), [Review](review.md), [flow.mmd](flow.mmd); built on [MUPP-050](../MUPP-050-santa-help/solution.md). Documentation: [Start page](../../wiki/system/start-page.md).

[Specifications](../index.md)
