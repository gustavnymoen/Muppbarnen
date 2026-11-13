---
type: Review
title: "TECH-025 Build warnings on Vercel: review"
description: "The code review of the build warnings task: findings, decisions and result."
feature: TECH-025
---

# Code review of TECH-025

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** The change is small and matches R1–R4: `engines.node` is `24.x`, the install scripts of `unrs-resolver` and `fsevents` are denied, and ESLint stays on 9 with the blocker and the retry steps written down. The reviewer read the code and docs and did not run lint, build or tests (they were run separately, see `verification.md`).
**Security:** Passed. No routes, actions, queries or personal data; no install script is approved. The denied `unrs-resolver` script is not needed because `package-lock.json` has the `@unrs/resolver-binding-*` optional packages for the platform. `/security-review`: not needed (no sign-in, admin, API, action, query or personal data touched).

## Must fix

None.

## Should fix

- `verification.md` links `review.md`, which did not exist yet. **Done:** this file is saved.
- Test suite: 334.8 s is 4.8 s over the budget of 330 s, measured while other sessions used the machine. **Not done:** left open in the Definition of Done in `verification.md`; to be re-run on a quiet machine before Done.

## Suggestions

- `package.json` `allowScripts`: npm ignores an unknown key silently, so the preview's build log must show the `install-scripts` warning gone (R3). **Not done yet:** the build log is listed as not checked in `verification.md`.
- `package.json` `engines`: `24.x` also rejects Node 25 locally. **Left as it is:** intended; the next major upgrade changes it on purpose.

## Outside the change

- Retry ESLint 10 when `eslint-config-next` or its plugins allow it; the retry command is in `solution.md`. Not added to the board: nothing to do until then.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
