---
type: Solution
title: "TECH-022 Ponytail audit of the code: solution"
description: "How the second ponytail audit was run and what was done with its findings."
feature: TECH-022
card: "#215"
depends_on: []
---

# TECH-022 Ponytail audit of the code: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 215`.

## Data

None.

## Interface

None for visitors or the administrator. The audit report is [audit.md](audit.md); every finding there has a decision.

## Decisions

- **Audit first, fixes after.** The `/ponytail-audit` run is read-only and is the first step; nothing was changed before the report was saved (R1).
- **The line between "fix here" and a card** is the card's: small and behaviour-preserving is fixed here (finding 4, `readOutbox` and `clearOutbox` moved out of the library into a test helper so the build no longer traces the whole project; finding 5, an identical copy of a list removed; finding 6, twelve `export`s that nothing outside the file uses); a bug fix with a new test, a security change and a refactor that touches every action file are own cards ([MUPP-067](https://github.com/gustavnymoen/Muppbarnen/issues/227), [TECH-024](https://github.com/gustavnymoen/Muppbarnen/issues/228)). Two findings are left with a reason.
- **Removing `export` instead of deleting.** The twelve names are used inside their own file, so only the keyword goes; no code or test was deleted.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd); the audit: [audit.md](audit.md).
- Documentation: [Testing](../../wiki/system/testing.md) (the test numbers), [log](../../wiki/log.md). The first run: [TECH-011](../TECH-011-ponytail-audit/solution.md).

[Specifications](../index.md)
