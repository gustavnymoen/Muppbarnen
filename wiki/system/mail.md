---
type: Guide
title: Mail
description: "How the site sends mail: sendMail with a shared layout, the provider call behind RESEND_API_KEY, and the outbox file that development and tests use instead."
resource: lib/mail.ts
feature: TECH-017
tags: [mail, infrastructure, testing]
---

# Mail

The server sends short mails with `sendMail(to, { subject, heading, text })` in `lib/mail.ts`. What a mail says and when it is sent is decided by each feature ([MUPP-052](https://github.com/gustavnymoen/Muppbarnen/issues/154) for Secret Santa); `sendMail` only adds the layout and delivers it. Built by [TECH-017](../../specs/TECH-017-sending-email/solution.md).

## The layout

Every mail has the site's logo (`/icon.png`, one of the few public files, with an alt text), the heading, the text, a rule, and the same footer: the link to the site and "Detta mail går inte att svara på.". It is sent as simple HTML with a plain-text copy. Callers set only subject, heading and text, so a mail never holds more than the caller gave it; callers must not put member names, wishes or message text in it ([specs/rules.md](../../specs/rules.md)). HTML characters in the text are escaped.

## Where a mail goes

| Situation | What happens |
|---|---|
| `RESEND_API_KEY` is set | One POST to Resend's API from `Tomten <tomten@kusinportalen.com>`. An error or no answer gives `{ ok: false }`; nothing is logged. |
| No key, `TURSO_DATABASE_URL` is a `file:` URL (development, the test server) | Nothing leaves the machine; the mail is appended to `mail-outbox.jsonl` in the local data folder (`lib/mail-sink.ts`). Tests read it with `readOutbox()` and empty it with `clearOutbox()`. |
| No key on a deployed site | `{ ok: false }`, nothing sent. |

The key and the sender domain are set up in [TECH-020](https://github.com/gustavnymoen/Muppbarnen/issues/168) (not built yet), so until then the site sends no real mail.

## For callers

`sendMail` returns `{ ok: true }` or `{ ok: false }` and never throws, so a feature can list who did not get a mail and carry on. It does one mail to one address; a feature that mails a whole group calls it once per member.

[System documentation](index.md)
