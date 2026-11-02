---
type: Solution
title: "MUPP-026 Menu hidden after refresh on a phone: solution"
description: "How the document is kept still so the menu stays reachable after a reload: interface and decisions and why."
feature: MUPP-026
card: "#84"
depends_on: [MUPP-002]
---

# MUPP-026 Menu hidden after refresh on a phone: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 84`.

## Data

None.

## Interface

Two CSS rules in `app/globals.css`: `html { overscroll-behavior: none }` and `html:has([data-page]) { overflow: hidden }`. `Page` carries the `data-page` attribute on its root. No text changes.

## Decisions

- **Cause:** `Page` is `h-dvh overflow-hidden`, but the document itself could still be scrolled a little (the dynamic viewport changes as the browser bar moves), and a restored scroll position or the bounce left the page shifted up. Making the document unscrollable fixes R1 and R2 together (the card allows R1 to be solved by R2).
- **Only where `Page` is used:** pages without `Page` (the password page) keep a scrollable document, so a short screen can still reach their form. `overscroll-behavior` is global, since it only removes the bounce.
- **Consequence the user accepted:** pull-down-to-refresh no longer works on the page; the browser's reload button does.
- **Not reproduced in a test of the real iOS bar:** see the manual check in [Verification](verification.md).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design](../../wiki/system/design.md), [Phone use](../../wiki/manual/index.md).

[Specifications](../index.md)
