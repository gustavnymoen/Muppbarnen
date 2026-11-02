---
type: Solution
title: "MUPP-018 Description max length: solution"
description: "How Description max length is built: data, interface and decisions and why."
feature: MUPP-018
card: "#61"
depends_on: []
---

# MUPP-018 Description max length: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 61`.

## Data

None. The database check `length(description) <= 500` in `003_family.sql` stays as a safety net; the limit of 100 is kept by the server code.

## Interface

The description field of the wish form (`WishlistSection.tsx`) has `maxLength={MAX_DESCRIPTION}`; `saveItem` (`lib/family.ts`) refuses a longer text with "Högst 100 tecken." on the field (the existing `parseText` message).

## Decisions

The number lives in one place, `MAX_DESCRIPTION` in `lib/form-input.ts`, which both the form and the server import.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md), [manual for the admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
