---
type: Solution
title: "TECH-007 Flaky admin tests: solution"
description: "How two flaky admin tests were made reliable: a pointer bug in ListPicker and a missing wait before axe."
feature: TECH-007
card: "#42"
depends_on: [MUPP-012, MUPP-003]
---

# TECH-007 Flaky admin tests: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 42`.

## Data

None.

## Interface

`app/components/ListPicker.tsx`: an option follows the pointer on `onPointerMove` instead of `onPointerEnter`. Nothing else changes for visitors.

## Decisions

- **`MUPP-012-R1 R2 R3` (the `Home` failure) was a real bug, not a test problem.** After an option is picked with the mouse the pointer stays where the list will open again. When the keyboard reopens the list, the browser fires `pointerenter` on the option under the resting pointer, which set the active option and overrode `Home`. Reproduced in 13 of 20 runs. `pointermove` only fires when the pointer actually moves, so keys and the pointer no longer fight. The test keeps checking the behaviour unchanged.
- **`MUPP-003-R5` (axe `document-title`) is fixed in the test.** The second axe check ran right after "Lägg till" was clicked, before the page had been re-rendered with the new kid. The test now waits for the new row first. The failure did not reproduce locally in 40 runs, so the cause (axe running mid page-change) is inferred from the failing report, not observed; CI has to confirm it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md) (ListPicker).

[Specifications](../index.md)
