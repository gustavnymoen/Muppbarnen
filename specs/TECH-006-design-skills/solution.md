---
type: Solution
title: "TECH-006 Design skills and a design pass: solution"
description: "How Design skills and a design pass is built: data, interface and decisions and why."
feature: TECH-006
card: "#34"
depends_on: []
---

# TECH-006 Design skills and a design pass: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 34`.

## Data

None.

## Interface

So far (R1): a "Design work" section in `CLAUDE.md` and `wiki/system/way-of-working.md`, and a design point in the reviewer's checklist. `PRODUCT.md` and the three steps (concept, admin, cards) follow, each decided by the user from proposals tried in the running site.

## Decisions

The design decisions of each step are recorded here and in `DESIGN.md` once the user has decided.

- **Step 1 (concept), decided 2026-10-29:** the current look (MUPP-001) stays. Eight proposals in four rounds were shown on a temporary page in the running site and compared on a phone; the user preferred the current look to all of them. The proposals page and its stylesheet were deleted again, and the tokens did not change. Why it matters: the dark, soft look already fits the product (calm, phone first), and the later steps refine it instead of replacing it.

- **Step 2 (admin), decided 2026-10-29:** the admin and the password page already follow the concept. Critique and audit (on a phone and on a wide screen; the detector found nothing) gave three findings. (1) The manage page's lists were as wide as the screen, so the buttons were far from the names: its content is now at most 42 rem wide (`max-w-2xl`). (2) The two icon links per child on the admin start had no visible text: from 640 px a short text (`Storlekar`, `Önskelistor`) stands beside the icon (`text` on `IconLink`); on a phone only the icons, since the parents are told what they do. (3) The 32 px icon buttons in the rows stay: they pass WCAG 2.2 AA (24 px), and they were chosen in MUPP-010 to fit side by side. The critique ran in one context, not in two isolated sub-agents.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: link the wiki pages this feature created or changed (and let each of them link back here).

[Specifications](../index.md)