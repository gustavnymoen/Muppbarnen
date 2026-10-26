---
id: TECH-003
title: Pipeline and branch protection
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
