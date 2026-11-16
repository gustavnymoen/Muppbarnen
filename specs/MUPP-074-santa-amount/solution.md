---
type: Solution
title: "MUPP-074 Amount on Secret Santa groups: solution"
description: "How the amount of a Secret Santa group is built: data, interface and decisions and why."
feature: MUPP-074
card: "#256"
depends_on: [MUPP-048]
---

# MUPP-074 Amount on Secret Santa groups: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 256`.

## Data

Migration `db/migrations/014_santa_amount.sql` adds `ss_event.amount INTEGER` with `CHECK (amount IS NULL OR amount > 0)`; NULL means no amount, and existing groups get NULL. `lib/form-input.ts` has `parseAmount`: empty or missing gives none, a text of one to six digits above 0 gives the number, and everything else (letters, decimals, minus, a range, a non-text value) is refused with "Skriv ett helt antal kronor, till exempel 200." The server checks it in `saveEvent` (`lib/santa.ts`), which writes the amount with the name in the same statement, so clearing the field removes it.

## Interface

- Admin: the group form (`EventForm` in `app/admin/SantaTab.tsx`, used for both new and edit) has the field "Belopp (kr)" with the hint "Valfritt. Hela kronor, till exempel 200." The group's card note adds "200 kr" after the status and number of participants, so it shows on the closed and the open card alike.
- Members: `app/secret-santa/min-sida/page.tsx` shows the amount as a `Chip` ("200 kr") to the right of "Hej <name>!" on the same line; it sits beside the heading, not in it, so the heading's name stays "Hej <name>!". With a long name on a narrow phone the line wraps and the chip goes under the heading. No amount, no chip and no space.
- Mail 3 (`startedMail(group, amount)` in `lib/santa-mail.ts`) ends with "Beloppet är 200 kr." when the group has an amount. The amount reaches it through `StatusChange`/`DrawStart` (`amount` next to `eventName`) and `NewMember`, so a new address in a started group gets the same text. `SantaMember` (`lib/santa-auth.ts`) carries the amount to the own page.

## Decisions

- One column and no new table: the amount belongs to the group and is read wherever the group is.
- `type="number"` on the field (a numeric keypad on phones); the browser stops letters but not a minus or a decimal, so the server is the check, as the card says.
- The amount can be changed at any time and nobody is mailed when it changes (card).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Administration (system)](../../wiki/system/admin.md), [Mail](../../wiki/system/mail.md), [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), the manuals [Administration](../../wiki/manual/admin.md) and [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
