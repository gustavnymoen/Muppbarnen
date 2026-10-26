---
id: TECH-003
title: Pipeline and branch protection
---

# Verification of TECH-003

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-003-R1 | Manual: `gh api repos/gustavnymoen/Muppbarnen/branches/main/protection` lists `check`, `security`, `preview`, `Vercel`, strict on, pull request required (0 approvals), force pushes and deletion off; `delete_branch_on_merge` is true. Direct push: not checked yet (needs a commit pushed to `main`, to be done once the user allows pushing) | live | Pass (protection); direct push not checked | 2026-10-26 |
| TECH-003-R2 | Manual: same call shows `enforce_admins` on | live | Pass | 2026-10-26 |
| TECH-003-R3 | Not checked yet: needs this pull request merged | live | Not checked | |
| TECH-003-R4 | Not checked yet: needs the preview build log and the Turso dashboard, with the user | live | Not checked | |
| TECH-003-R5 | Manual: `CLAUDE.md` read; the note is gone and no `<…>` placeholders are left | local | Pass | 2026-10-26 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no behaviour changes. `npm run test:unit` still passes (1 test) | local | Pass | 2026-10-26 |
| Browser tests | Not applicable: no behaviour changes. `npm run test:local` still passes (3 tests) | local | Pass | 2026-10-26 |
| Smoke test | Runs as Preview tests and Live tests with this pull request (see R3) | preview, live | Not checked | |
| Accessibility | Not applicable: visitors see no change | live | n/a | 2026-10-26 |
| Security | Not applicable for `/security-review`: no code changed, only repository settings and documentation | local | n/a | 2026-10-26 |
| Code review | [review.md](review.md) | local | Passed (run 2) | 2026-10-26 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 1 unit + 3 browser | 0.5 s | 0.3 s |
| After | 1 unit + 3 browser | 0.5 s | 0.3 s |
