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

The HTML part is a complete document ([TECH-021](../../specs/TECH-021-mail-deliverability/solution.md)): `<!doctype html>`, `<html lang="sv">`, a `<head>` with charset and the subject as `<title>`, and a `<body>` that starts with a hidden preview text, the first paragraph of the mail cut at 90 characters, which inboxes show next to the subject. Spam filters read a bare `<div>` as sloppy. The Resend domain has open and click tracking switched off (a setting in the Resend dashboard, not in the code), since a tracking image and rewritten links are also signals for filters. The visible mail is the same as before.

Every mail has the site's logo (`/icon.png`, one of the few public files, with an alt text), the text in paragraphs, a button to the site and, under the button, the line "Detta mail går inte att svara på.". A blank line in the text starts a paragraph and a single line break stays a line break. The button is a link styled with the colours of the site's primary button and the radius of its buttons (a rounded system font, since Fredoka is not available in mail clients); the link is also in the plain-text copy, which has the same text, the address and the same line. Callers set only subject and text, so a mail never holds more than the caller gave it; callers must not put member names, wishes or message text in it ([specs/rules.md](../../specs/rules.md)). HTML characters in the text are escaped. There is no heading: the subject says what the mail is about.

A mail with `installTip: true` also gets the home-screen tip ([MUPP-058](../../specs/MUPP-058-santa-mail-install-tip/solution.md)) after the button and that line: "Tomtenissen tipsar: …" and three steps, as a numbered list in HTML and numbered 1 to 3 in plain text. The tip is one constant, `INSTALL_TIP` in `lib/mail.ts`, with the address taken from `SITE_URL`; callers only set the flag.

## The Secret Santa mails

`lib/santa-mail.ts` ([MUPP-052](../../specs/MUPP-052-santa-mail-texts/solution.md)) holds the nine mails of the Secret Santa series, one function each, returning `{ subject, text }` for `sendMail`. The functions take only the group's name (and, for mails 1 and 8, the name of the group's administrator), so no member name, wish or message text can get in. The subject always starts with "Secret Santa: <group> – ".

| Mail | Function | To | Sent by |
|---|---|---|---|
| 1 Group opened, with how it works | `activatedMail` | every member; also a member added while preparing, right after mail 8 | MUPP-051 |
| 2 Group deactivated | `deactivatedMail` | every member | MUPP-051 |
| 3 Draw done, group started | `startedMail` | every member | MUPP-041 |
| 4 Draw stopped | `stoppedMail` | every member | MUPP-041 |
| 5 The receiver's list changed (one mail an hour) | `listChangedMail` | the giver | MUPP-042 (`lib/santa-changes.ts`, by a scheduled job) |
| 6 A message from the giver (collected over ten minutes) | `messageFromGiverMail` | the receiver | MUPP-043 (`lib/santa-chat.ts`, by the same scheduled job) |
| 7 A message from the receiver (same limit) | `messageFromReceiverMail` | the giver | MUPP-043 (`lib/santa-chat.ts`, by the same scheduled job) |
| 8 Added to a group | `addedMail` | that person | MUPP-051 |
| 9 The giver nags for a list ([MUPP-071](../../specs/MUPP-071-santa-nag-list/solution.md)) | `nagListMail` | the receiver, when their list is empty | MUPP-071 (`lib/santa-nag.ts`, by the same scheduled job) |

Mails 1, 3 and 8 set `installTip`; the other six do not. Mail 9 has the subject "Secret Santa: <group> – Din secret santa vill ha in en lista!" and names nobody.

The same module holds the questions of the status dialogs (`STATUS_CONFIRMATIONS`: activate, deactivate, start, stop; each "Är du säker?" and what happens), which MUPP-051 and MUPP-041 put into their buttons.

## Where a mail goes

| Situation | What happens |
|---|---|
| `RESEND_API_KEY` is set | One POST to Resend's API from `Tomten <tomten@kusinportalen.com>`. An error or no answer gives `{ ok: false }`; nothing is logged. |
| No key, `TURSO_DATABASE_URL` is a `file:` URL (development, the test server) | Nothing leaves the machine; the mail is appended to `mail-outbox.jsonl` in the local data folder (`lib/mail-sink.ts`). Tests read it with `readOutbox()` and empty it with `clearOutbox()` (`tests/mail-outbox.ts`, not in `lib/`: a read from a path known only at run time makes the build trace the whole project into the functions that send mail, [TECH-022](../../specs/TECH-022-ponytail-audit-2/solution.md)). |
| No key on a deployed site | `{ ok: false }`, nothing sent. |

The test server blanks `RESEND_API_KEY` (`scripts/test-server.mjs`), even if `.env.local` has one, so a browser test never sends a real mail and its mails land in the outbox.

## Going live ([TECH-020](../../specs/TECH-020-mail-go-live/solution.md))

- **Domain and DNS.** `kusinportalen.com` is bought at Vercel, which also holds its DNS. Resend has verified the domain: the records `resend._domainkey` (DKIM), `send` and `rsend` are in Vercel DNS, and `_dmarc` is a TXT record `v=DMARC1; p=none;` (monitoring only; without it Outlook reports `dmarc=bestguesspass` instead of `pass`).
- **The key.** `RESEND_API_KEY` exists as a sensitive environment variable in Vercel (Production and Preview; a preview deployment with real members in its database would send real mail, so remove the Preview key if that is not wanted) and, for the owner's own tests, in `.env.local`, where it also makes `npm run dev` send real mail (the test server blanks it). It is read only in `sendMail` (and in `scripts/send-test-mail.mjs`), is never in a `NEXT_PUBLIC_` variable, in a log line or in the repository (`.env*` is in `.gitignore`; only `.env.example` lists the name; Gitleaks scans the whole history in CI). The test server blanks it. Rotating it: create a new key in Resend, replace the variable in Vercel, redeploy, delete the old key ([Security](security.md#rotating-secrets-and-leaks)).
- **A test mail.** `node --env-file=.env.local scripts/send-test-mail.mjs <address>` sends one short mail from `Tomten <tomten@kusinportalen.com>` to that address and nothing else; it touches no database and no member. Run it by hand only.
- **Reading the result.** In Gmail: "Show original" shows `SPF`, `DKIM` and `DMARC` as `PASS`. In Outlook: the `Authentication-Results` header has `spf=pass`, `dkim=pass` and `dmarc=pass`. Resend's dashboard (Emails) shows delivered, bounced and complained mails. The free tier allows about 100 mails a day.

## For callers

`sendMail` returns `{ ok: true }` or `{ ok: false }` and never throws, so a feature can list who did not get a mail and carry on. It does one mail to one address; a feature that mails a whole group calls it once per member.

[System documentation](index.md)
