---
id: TECH-003
title: Pipeline and branch protection
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
