---
type: Guide
title: Git and GitHub
description: Branches, commit messages, pull requests, branch protection on main and what must never be committed.
resource: .github/
feature: TECH-004
tags: [workflow, git, github]
---

# Git and GitHub

- **One branch per card,** named after its folder: `MUPP-010-wishlist`. Commit messages start with the ID; Swedish text is fine (`MUPP-010: Önskelista`).
- **Pull requests to `main`** with "Closes #<card>" and a short what and checks; the review report posted as a comment (`gh pr comment <url> --body-file specs/<ID>-<name>/review.md`).
- **Branch protection on `main`** (free for a public repository): changes only through pull requests; direct and force pushes refused; required checks `check`, `security` (CI), `preview` (Preview tests) and `Vercel`; the branch must be up to date with `main`; no approving review required when there is one developer. What the checks do is in [Pipeline](pipeline.md).
- **The repository is public** (needed for free branch protection), so nothing secret is ever committed: `.env*` is ignored, Gitleaks scans the history ([Security](security.md)).
- **Attribution:** Claude's commits end with its `Co-Authored-By` line, and its pull request descriptions with the Claude Code line.

Cards and the board: [Backlog](backlog.md).

Branch protection was set up by [TECH-003](../../specs/TECH-003-pipeline-and-branch-protection/solution.md).

[System documentation](index.md)
