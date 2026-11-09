---
type: Review
title: "TECH-017 Sending email: review"
description: "The code review of Sending email: findings, decisions and result."
feature: TECH-017
---

# Code review of TECH-017

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** `sendMail` does what R0, R1 and R2 ask and each requirement has a named unit test; no must-fix finding.
**Security:** Passed. No route, action or sign-in is touched, no secret is logged or sent to the browser, `RESEND_API_KEY` is read from the environment only, HTML is escaped and the address check blocks header injection. `/security-review`: not needed (the card says so; the cards that send mail are reviewed).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/mail.ts:41` `saveToOutbox` could throw (disk full, folder not writable), outside the `try`, which contradicted "never throws". **Done:** wrapped, and a failure gives `{ ok: false }`.
- `verification.md` was still the template. **Done:** filled in.

## Suggestions

- `lib/mail.ts:43` The provider `fetch` had no timeout. **Done:** `AbortSignal.timeout(10_000)`; the existing `catch` handles it.
- `lib/mail.test.ts:8` The unit tests use the shared `mail-outbox.jsonl`, so they could wipe mails a browser test is about to read. **Left as it is:** nothing reads the outbox in a browser test yet, and the suites run one at a time per computer ([Testing](../../wiki/system/testing.md)); a feature that reads it in a browser test (MUPP-051) clears it itself and can give `sendMail` its own file then.
- `lib/mail.ts:2` `lib/` imports `SITE_NAME` from `app/components/SiteHeader`, which pulls in the menu component. **Left as it is:** it is the one place the name lives (MUPP-046) and `app/site-name.test.ts` imports it the same way.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
