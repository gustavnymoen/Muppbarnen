---
type: Solution
title: "MUPP-033 Birthdate field fits on a phone: solution"
description: "How the date field is kept inside its form on iOS Safari: three classes on date inputs in Field."
feature: MUPP-033
card: "#108"
depends_on: [MUPP-010]
---

# MUPP-033 Birthdate field fits on a phone: solution

How it is built. What is built and why is in the card: `gh issue view 108`.

## Data

None.

## Interface

`Field` in `app/components/Form.tsx` adds `dateFit` (`block min-w-0 max-w-full appearance-none text-left`) to inputs of type `date`. iOS Safari gives a date input a minimum width of its own; `min-w-0` and `max-w-full` let it shrink to the form, and `appearance-none` drops the native box sizing. The phone's own picker is unchanged. No new texts.

## Decisions

- One shared constant for the date type, not a class on the one call site, so every date field gets the fix (the card's scope).
- The fault shows only in Safari on iOS, which neither Chromium nor Playwright's WebKit reproduces. The automated test therefore guards the layout in Chromium; the real check is manual on an iPhone ([Verification](verification.md)).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md).

[Specifications](../index.md)
