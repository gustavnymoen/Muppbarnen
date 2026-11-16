---
type: Review
title: "MUPP-083 Admin wish lists: sizes and flipping between kids: review"
description: "The code review of MUPP-083: findings, decisions and result."
feature: MUPP-083
---

# Code review of MUPP-083

**Result:** Passed
**Date:** 2026-11-17, review run 1
**Summary:** The change meets R1 to R4 with no must-fix findings; the parent scoping of the arrows and the `Dialog` `onCancel` change are correct, and the test merges keep every old check.
**Security:** Passed. `KidPage` still checks the site session, the admin session and `canManage` first; the arrows' ids come from `listChildren(parent.id)`. `/security-review` not needed: no new route, action or query.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-083-admin-wishlist-sizes/verification.md` missing. **Done:** written.
- Card named the folder `MUPP-083-admin-wishlist-sizes-and-kids`. **Done:** the card now says `MUPP-083-admin-wishlist-sizes`.

## Suggestions

- `app/admin/barn/[id]/KidPage.tsx`: `parent?.id` could in theory give every kid. **Done:** `parent && neighbours(… parent.id …)`.
- `tests/MUPP-010-compact-admin.spec.ts`: the substring match on "Storlekar" with `.first()` and `.last()`. **Done:** left as it is; the test opens the dialog after each click and checks its heading with the kid's name.
- R4 measures one wish row at three widths. **Done:** left as it is; it is enough for the risk.

## Outside the change

- `canManage` is not a type guard, so callers still see `Parent | null` after the check. Not added to the board: a small cleanup for when the pages next change.
