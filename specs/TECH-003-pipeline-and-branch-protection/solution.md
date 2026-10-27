---
type: Solution
title: "TECH-003 Pipeline and branch protection: solution"
description: "How Pipeline and branch protection is built: data, interface and decisions and why."
feature: TECH-003
card: "#16"
depends_on: [TECH-002]
---

# TECH-003 Pipeline and branch protection: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 16`.

## Data

None.

## Interface

None. Visitors see no change.

## Decisions

- Branch protection is set with one `gh api -X PUT repos/gustavnymoen/Muppbarnen/branches/main/protection` call (pull request required with 0 approving reviews, required checks `check`, `security`, `preview`, `Vercel`; strict; `enforce_admins`; no force pushes or deletion), so it can be repeated exactly. `wiki/system/pipeline.md` already described these rules.
- Merged branches are deleted automatically (`delete_branch_on_merge` on the repository; read back as true).
- The workflows are not changed; TECH-002 showed that they work.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Pipeline](../../wiki/system/pipeline.md), [Git and GitHub](../../wiki/system/git-and-github.md).

[Specifications](../index.md)
