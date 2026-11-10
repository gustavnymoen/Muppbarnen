---
type: Review
title: "MUPP-058 Install tip in Secret Santa mails: review"
description: "The code review of the install tip in Secret Santa mails: findings, decisions and result."
feature: MUPP-058
---

# Code review of MUPP-058

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** R1 is met. The tip is one constant (`INSTALL_TIP`) in `lib/mail.ts`, `Mail.installTip` switches it on, and only mails 1, 3 and 8 set it. HTML and plain text have it in the order the card asks for, and no caller changes.
**Security:** Passed. Fixed text, no input; the steps go through `escapeHtml`; the address is built from `SITE_URL`; no personal data. `/security-review`: not needed (as the card says).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/santa-mail.test.ts` The last test's name claimed more than it checked (the address from `SITE_URL`). **Done:** renamed to what it checks and it now also asserts `SITE_URL`.

## Suggestions

- `lib/mail.ts:13` `installTip?: true` could be a plain `boolean`. **Done:** left as it is: `true`-only keeps "no flag" as the single way to say no.
- `lib/santa-mail.test.ts` Some literals ("Kusinportalen", the intro) could use constants. **Done:** left as it is: the literals guard the card's wording.

## Outside the change

- Not checked: how the tip looks in a real mail client (no real mail is sent until TECH-020).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
