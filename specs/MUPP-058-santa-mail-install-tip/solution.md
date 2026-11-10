---
type: Solution
title: "MUPP-058 Install tip in Secret Santa mails: solution"
description: "How the home-screen tip lives as one text in the mail layout and is switched on by mails 1, 3 and 8."
feature: MUPP-058
card: "#176"
depends_on: [MUPP-052, TECH-017]
---

# MUPP-058 Install tip in Secret Santa mails: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 176`.

## Data

None.

## Interface

No page. `lib/mail.ts` has `INSTALL_TIP` (the intro and the three steps, in Swedish) and `Mail` has an optional `installTip: true`. When it is set, `layout` adds the tip after the button and the line "Detta mail går inte att svara på.": in HTML a paragraph and an `<ol>` with the three steps, in plain text the intro and the steps numbered "1." to "3.". In `lib/santa-mail.ts` mails 1 (`activatedMail`), 3 (`startedMail`) and 8 (`addedMail`) set `installTip: true`; the other five do not.

## Decisions

- **One text, one place.** The tip is a constant in the layout, not copied into the three mails; a mail only says that it wants it. This also keeps the tip out of `text`, so the mail text of MUPP-052 is unchanged and stays the same in the outbox and in the tests.
- **The address comes from `SITE_URL`.** The card's text says `kusinportalen.com`; `SITE_URL` is `https://www.kusinportalen.com`, so the host is taken from it without `www.`, and the site's name comes from `SITE_NAME`. If the site moves, the tip follows.
- **A flag on `Mail`, not a second mail function.** `sendMail` passes the whole mail to `layout`, so the three callers (MUPP-051, 041) need no change.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Mail](../../wiki/system/mail.md), [Secret Santa manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
