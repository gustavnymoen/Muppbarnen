---
type: Review
title: "TECH-021 Mail deliverability: review"
description: "The code review of Mail deliverability: findings, decisions and result."
feature: TECH-021
---

# Code review of TECH-021

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** `layout` returns a full document with the escaped subject as title and a hidden first-paragraph preview; the plain text and the visible mail are unchanged. R3 and the Outlook check are manual and not done yet, recorded as such in `verification.md`.
**Security:** Passed. No sign-in, route, query or personal-data changes; subject and preview are escaped, the preview is cut before escaping. `/security-review`: not needed (no data or route changes).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `specs/TECH-021-mail-deliverability/verification.md` The Definition of Done boxes for tests, review and deploy are open, and R3 and the Outlook check (SCL before 5, after) are not recorded. **Done:** correct for now; they are filled in after the deploy.

## Suggestions

- `lib/mail.test.ts:62` The preview test matches with `[^<]*`, which works because the text is escaped. **Done:** left as it is.
- `lib/mail.ts:52` `slice` counts UTF-16 units, so an emoji at the cut could split a pair. **Done:** left as it is; the mail texts are fixed in the mail cards.

## Outside the change

- Nothing found.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
