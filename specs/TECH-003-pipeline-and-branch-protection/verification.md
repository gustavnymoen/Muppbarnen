---
type: Verification
title: "TECH-003 Pipeline and branch protection: verification"
description: How each requirement of Pipeline and branch protection was checked, the test suite before and after, and the requirements as built.
feature: TECH-003
---

# Verification of TECH-003

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-003-R1 | Manual: `gh api repos/gustavnymoen/Muppbarnen/branches/main/protection` lists `check`, `security`, `preview`, `Vercel`, strict on, pull request required (0 approvals), force pushes and deletion off; `delete_branch_on_merge` is true. Direct push to `main`: not tried; Claude's attempt was blocked by the permission check, so the refusal itself was not seen. The rules were read back with `gh api` instead | live | Pass (protection); direct push refusal not seen | 2026-10-26 |
| TECH-003-R2 | Manual: same call shows `enforce_admins` on | live | Pass | 2026-10-26 |
| TECH-003-R3 | Manual: PR #19 merged (commit `989d057`) with `check`, `security`, `preview` and `Vercel` green first (reported by the user); the Live tests run for the merge on `main` succeeded (`gh run list`) | live | Pass | 2026-10-26 |
| TECH-003-R4 | Manual, with the user: the preview database `muppbarnen-preview` (opened via Vercel → Storage) has the table `schema_migrations`, so the migrations ran on it. Build log and the Preview/Production variable names were not read | live | Pass (tables seen); build log not checked | 2026-10-26 |
| TECH-003-R5 | Manual: `CLAUDE.md` read; the note is gone and no `<…>` placeholders are left | local | Pass | 2026-10-26 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no behaviour changes. `npm run test:unit` still passes (1 test) | local | Pass | 2026-10-26 |
| Browser tests | Not applicable: no behaviour changes. `npm run test:local` still passes (3 tests) | local | Pass | 2026-10-26 |
| Smoke test | Preview tests (`preview`) green on PR #19; Live tests succeeded on `main` after the merge (see R3) | preview, live | Pass | 2026-10-26 |
| Accessibility | Not applicable: visitors see no change | live | n/a | 2026-10-26 |
| Security | Not applicable for `/security-review`: no code changed, only repository settings and documentation | local | n/a | 2026-10-26 |
| Code review | [review.md](review.md) | local | Passed (run 2) | 2026-10-26 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 1 unit + 3 browser | 0.5 s | 0.3 s |
| After | 1 unit + 3 browser | 0.5 s | 0.3 s |

## Requirements as built

Copied from the card when the feature is done, with their acceptance criteria, so the repo shows what was built even if the card changes later.

### TECH-003-R1 Protected main

`main` accepts changes only through pull requests, refuses direct pushes, force pushes and deletion, requires the checks `check`, `security`, `preview` and `Vercel` to be green, and requires the branch to be up to date with `main`.

Acceptance criteria:

- **Given** the protection, **when** `gh api repos/gustavnymoen/Muppbarnen/branches/main/protection` is read, **then** it lists those four checks, strict (up to date) on, force pushes and deletion off.
- **Given** the protection, **when** a commit is pushed directly to `main`, **then** GitHub refuses it.

### TECH-003-R2 No exceptions

The rules also apply to the repository owner (enforced for administrators).

Acceptance criteria:

- **Given** the protection, **then** `enforce_admins` is on.

### TECH-003-R3 The pipeline runs end to end

A pull request goes through CI (`check`, `security`), Preview tests and Vercel, is merged, and Live tests then pass against production.

Acceptance criteria:

- **Given** this card's pull request, **when** it is merged, **then** all four required checks were green first, and the Live tests run for the merge commit succeeds.

### TECH-003-R4 Preview uses its own database

A preview build runs the migrations on `muppbarnen-preview`, not on production.

Acceptance criteria:

- **Given** the pull request's preview build log, **then** it shows the migrations being run, and the Turso dashboard shows the tables in `muppbarnen-preview`; production's variables are not used by Preview.

### TECH-003-R5 Setup note removed

The "New project" note is removed from `CLAUDE.md`, and the `<…>` placeholders there are filled in where they can be.

Acceptance criteria:

- **Given** `CLAUDE.md`, **then** it has no "New project" note.

## Notes

TECH-004 added this section: the card's requirements were not copied when TECH-003 was finished. R1 is as built except that a direct push to `main` was not tried (see the result above); R4's build log was not read.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
