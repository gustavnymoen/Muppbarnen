---
type: Review
title: "MUPP-061 Wish note instead of check mark: review"
description: "The code review of the wish note instead of the check mark: findings, decisions and result."
feature: MUPP-061
---

# Code review of MUPP-061

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** The change does what MUPP-061-R1 says: `MemberCard` passes the partner line and the wish note through the existing `SlimCard` note, and the old `CheckIcon` is deleted. (Run on the first version, before the wording and the green symbol were changed; the change is a text and a small decorative icon.)
**Security:** Passed. Text only, no new input, route, query or personal data. `/security-review` not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-061-santa-wish-note/verification.md` and `review.md` were unfilled templates. **Done:** filled in.
- The two-line case (partner and wish note) was not proved by the phone test, whose member had no partner. **Done:** the test now gives the member a partner (`setSantaPartner` in `tests/family-db.ts`) and checks that the wish line sits below the partner line at 320 px.

## Suggestions

- `app/admin/SantaTab.tsx`: the `partner || member.hasWishes ? … : undefined` could be shorter with a list of lines. **Done:** left as it is; the condition is needed because an empty fragment is still a note, and it reads clearly.
- The card and solution say "light blue" but the token is a blue-grey. **Done:** `solution.md` and `verification.md` say so.

## Outside the change

- The history in `specs/MUPP-041-secret-santa-draw/verification.md` still mentions the check mark; it is a record of what was verified then, so it stays.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
