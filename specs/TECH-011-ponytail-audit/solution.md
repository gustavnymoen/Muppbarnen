---
type: Solution
title: "TECH-011 Ponytail audit and tidy-up: solution"
description: "How Ponytail audit and tidy-up is built: data, interface and decisions and why."
feature: TECH-011
card: "#60"
depends_on: []
---

# TECH-011 Ponytail audit and tidy-up: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 60`.

## Data

None.

## Interface

None for visitors. The audit report is [audit.md](audit.md); the fixes chosen from it are listed there with their decisions.

## Decisions

- **Audit first, fixes after.** The `/ponytail-audit` run is read-only and is the first step of the card; the fixes are chosen with the product owner from its report (decided on the card).
- **One card.** Findings that are too big for it become their own cards (decided on the card).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: link the wiki pages this feature created or changed (and let each of them link back here).

[Specifications](../index.md)
