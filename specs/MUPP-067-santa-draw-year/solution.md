---
type: Solution
title: "MUPP-067 Secret Santa draw year in Swedish time: solution"
description: "How the year of a Secret Santa draw is taken from the Swedish date instead of the server clock."
feature: MUPP-067
card: "#227"
depends_on: [MUPP-041]
---

# MUPP-067 Secret Santa draw year in Swedish time: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 227`.

## Data

None. The column `ss_draw.year` is the same; only where its value comes from changes.

## Interface

No visible change. `startDraw` in `lib/santa.ts` has a third parameter `today = swedishToday()` (from `lib/deck.ts`). It reads `today.year` once and uses it in the three queries that need the year: the history ("the latest year before this one"), the delete of left-over rows of the same year, and the inserts. The caller in `app/admin/santa-actions.ts` passes nothing.

## Decisions

- **A parameter, not a faked clock.** `isExpected` in `lib/deck.ts` already takes `today` the same way, so the test passes a fixed date and needs no fake timers. The default is what runs on the site.
- **One read of the year.** The old `thisYear()` was called three times in one transaction; a draw that straddled midnight could have used two different years. Now it is read once.
- **The test's own `thisYear` is the Swedish year too**, so the existing tests do not fail for an hour on New Year's Day.
- `stopDraw` needs no change: it deletes the latest year's rows and never reads the clock.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa draw](../../wiki/system/secret-santa-draw.md). Found by [TECH-022](../TECH-022-ponytail-audit-2/audit.md), finding 1.

[Specifications](../index.md)
