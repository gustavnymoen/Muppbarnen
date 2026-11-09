---
type: Guide
title: Mail
description: "How the site sends mail: sendMail with a shared layout, the provider call behind RESEND_API_KEY, and the outbox file that development and tests use instead."
resource: lib/mail.ts
feature: TECH-017
tags: [mail, infrastructure, testing]
---

# Mail

The server sends short mails with `sendMail(to, { subject, text })` in `lib/mail.ts`. What a mail says and when it is sent is decided by each feature ([MUPP-052](https://github.com/gustavnymoen/Muppbarnen/issues/154) for Secret Santa); `sendMail` only adds the layout and delivers it. Built by [TECH-017](../../specs/TECH-017-sending-email/solution.md).

## The layout

Every mail has the site's logo (`/icon.png`, one of the few public files, with an alt text), the text in paragraphs, a button to the site and, under the button, the line "Detta mail går inte att svara på.". A blank line in the text starts a paragraph and a single line break stays a line break. The button is a link styled with the colours of the site's primary button and the radius of its buttons (a rounded system font, since Fredoka is not available in mail clients); the link is also in the plain-text copy, which has the same text, the address and the same line. Callers set only subject and text, so a mail never holds more than the caller gave it; callers must not put member names, wishes or message text in it ([specs/rules.md](../../specs/rules.md)). HTML characters in the text are escaped. There is no heading: the subject says what the mail is about.

## The Secret Santa mails

`lib/santa-mail.ts` ([MUPP-052](../../specs/MUPP-052-santa-mail-texts/solution.md)) holds the eight mails of the Secret Santa series, one function each, returning `{ subject, text }` for `sendMail`. The functions take only the group's name (and, for mails 1 and 8, the name of the group's administrator), so no member name, wish or message text can get in. The subject always starts with "Secret Santa: <group> – ".

| Mail | Function | To | Sent by |
|---|---|---|---|
| 1 Group opened, with how it works | `activatedMail` | every member; also a member added while preparing, right after mail 8 | MUPP-051 |
| 2 Group deactivated | `deactivatedMail` | every member | MUPP-051 |
| 3 Draw done, group started | `startedMail` | every member | MUPP-041 |
| 4 Draw stopped | `stoppedMail` | every member | MUPP-041 |
| 5 The receiver's list changed (one mail an hour) | `listChangedMail` | the giver | MUPP-042 |
| 6 A message from the giver (collected over ten minutes) | `messageFromGiverMail` | the receiver | MUPP-043 |
| 7 A message from the receiver (same limit) | `messageFromReceiverMail` | the giver | MUPP-043 |
| 8 Added to a group | `addedMail` | that person | MUPP-051 |

The same module holds the questions of the status dialogs (`STATUS_CONFIRMATIONS`: activate, deactivate, start, stop; each "Är du säker?" and what happens), which MUPP-051 and MUPP-041 put into their buttons.

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
