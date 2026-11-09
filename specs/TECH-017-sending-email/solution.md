---
type: Solution
title: "TECH-017 Sending email: solution"
description: "How the site sends mail: one function with a shared layout, a provider call behind a key, and an outbox file for development and tests."
feature: TECH-017
card: "#136"
depends_on: [MUPP-046]
---

# TECH-017 Sending email: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 136`.

## Data

None in the database. In development and tests the mails are appended to `mail-outbox.jsonl` in the local data folder (next to the database).

## Interface

No page. `lib/mail.ts` exports `sendMail(to, { subject, text })`, which returns `{ ok: true }` or `{ ok: false }` and never throws, and `layout()`. `lib/mail-sink.ts` holds the outbox (`saveToOutbox`, `readOutbox`, `clearOutbox`), which tests read. The layout is Swedish: the logo (`/icon.png`, already public), the text, and the footer "Detta mail går inte att svara på." with the link to the site.

## Decisions

- **Outbox in a file, not in memory or the database.** The test server and the tests are different processes, so memory does not work; a table would need a migration in production for something only tests read. A line of JSON per mail next to the database does.
- **"Local database" decides, not `NODE_ENV`.** The test server and `npm start` run as production builds, so `NODE_ENV` cannot tell a test from the real site. Like `wrongWait`, the outbox is used only when `TURSO_DATABASE_URL` is a `file:` URL, so a deployed site without a key fails instead of pretending to send.
- **No key means no real mail**, so the provider call can be written and unit-tested now (with a faked `fetch`) and turned on by TECH-020 just by setting `RESEND_API_KEY`.
- **Callers get `{ ok }`, not an exception**, so a card can tell the administrator who did not get a mail (MUPP-041-R6, MUPP-051-R2) and carry on.
- **Nothing is logged** on failure: not the address, key or text.
- The address check is deliberately simple (one `@`, a dot, no spaces or angle brackets, so a newline cannot inject a header); the provider is the real validator.
- The logo is the existing public `/icon.png`, so no new public path.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Mail](../../wiki/system/mail.md).

[Specifications](../index.md)
