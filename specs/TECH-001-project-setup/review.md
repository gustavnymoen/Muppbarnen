---
id: TECH-001
title: Project setup
---

# Code review of TECH-001

**Result:** Passed
**Date:** 2026-10-26, review run 1
**Summary:** The setup matches R1–R6 and every requirement has a named test or a recorded manual check. No real personal data would be committed.
**Security:** Passed. No sign-in, API routes, queries or secrets in the change; the security headers are tested; Actions are pinned to commits; `pictures/` and `.env*` are ignored. `/security-review`: not needed (the change touches none of sign-in, admin, API routes, server actions, queries or personal data).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `CLAUDE.md:5` The "New project" note is stale. **Done:** not changed. The note says to remove it when the setup in `PLAYBOOK.md` is done, and that is only so after TECH-002 and TECH-003 (the repository, hosting and pipeline). It is removed in TECH-003 (written in its scope).
- `specs/TECH-001-project-setup/flow.mmd` Still the template's generic flow. **Done:** replaced with how the dev server starts.
- `lib/db.ts:34` A stray `//.` comment line left from the old project. **Done:** removed.
- `specs/TECH-001-project-setup/verification.md` Broken `review.md` link, empty "Requirements as built", code review row not done. **Done:** filled in.
- `README.md:5` The live site does not exist until TECH-002. **Done:** marked "(from TECH-002)".

## Suggestions

- `tests/helpers.ts` `signIn`, `requireAdminPassword`, `deleteWithConfirmation` and `uniqueName` are unused here and `signIn` and `deleteWithConfirmation` hard-code Swedish UI texts. **Done:** left as they are. They are the kit's shared helpers and MUPP-003 (admin) uses them; the texts are adapted to the admin page's actual wording there.
- `tests/smoke.spec.ts` Repeats the heading check of the R4 browser test. **Done:** left as it is; the smoke test is the one that runs against the deployed site, and the plan asks for it.
- `lib/db.ts` The helpers are unused until MUPP-003. **Done:** left as they are; documented in `architecture.md`.

## Outside the change

- `PLAYBOOK.md` names Gurras Flyg as its source. Intentional provenance, not a leftover. Not added to the backlog.
