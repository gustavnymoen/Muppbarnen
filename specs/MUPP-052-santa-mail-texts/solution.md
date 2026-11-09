---
type: Solution
title: "MUPP-052 Secret Santa: mail texts: solution"
description: "How the Secret Santa mail texts and the status confirmations live in one module, and how the shared mail layout got paragraphs and a button."
feature: MUPP-052
card: "#154"
depends_on: [TECH-017]
---

# MUPP-052 Secret Santa: mail texts: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 154`.

## Data

None.

## Interface

No page. `lib/santa-mail.ts` has one function per mail (`activatedMail`, `deactivatedMail`, `startedMail`, `stoppedMail`, `listChangedMail`, `messageFromGiverMail`, `messageFromReceiverMail`, `addedMail`), each returning `{ subject, text }` for `sendMail`, and `STATUS_CONFIRMATIONS` with the title and text of the four status dialogs. `lib/mail.ts` has the layout of every mail: logo, the text in paragraphs, a button to the site and "Detta mail går inte att svara på." under it; the plain-text version has the same text, the address and the same line.

## Decisions

- **Functions take only the group and, for mails 1 and 8, the administrator.** A member name, a wish or a message cannot get into a text because there is nowhere to pass it; the unit test checks it anyway.
- **No heading.** The card's mails have a subject and a text, so the `heading` of TECH-017 is gone from `Mail`, the layout and the outbox; the subject says what the mail is about. This stacks on [TECH-017](../TECH-017-sending-email/solution.md) (PR #169).
- **Texts are stored as the card has them**: a single line break between lines, which the layout shows as a line break inside the paragraph (R3). A blank line would start a paragraph.
- **The button is a styled link**, with the colours of the primary button (`DESIGN.md`) and its radius, so it stays a link where a client blocks styles. Fredoka is not available in mail, so it uses a rounded system font.
- **The dialog texts are constants, not dialogs.** The Aktivera, Avaktivera, Starta and Stoppa buttons do not exist yet (MUPP-051 and MUPP-041 build them); R2 settles what they say, in the same module as the mails.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Mail](../../wiki/system/mail.md), [Secret Santa manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
