---
type: Solution
title: "MUPP-071 Secret Santa: nag the match for a list: solution"
description: "How the button 'Tjata in en lista' queues a mail to a match with an empty list, how the scheduled job sends it, and how the button is locked."
feature: MUPP-071
card: "#241"
depends_on: [MUPP-042, MUPP-052]
---

# MUPP-071 Secret Santa: nag the match for a list: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 241`.

## Data

Migration `db/migrations/013_santa_nag.sql`: two columns on `ss_member`, kept on the row of the person who is nagged (the receiver), because a started group gives a person exactly one giver. `nag_requested_at` is the time of the press while the mail waits (NULL = nothing waits); `nag_mailed_at` is the time of the last nag mail. Starting or stopping the draw (`clearListChanges` in `lib/santa-changes.ts`) and the yearly cleanup clear both.

## Interface

- `lib/santa-nag.ts`: `requestNag(giverId)` is one SQL statement that finds the receiver in the latest draw of a started group and sets `nag_requested_at` only if nothing waits, no mail went out in the last hour and the receiver has no wish; two simultaneous presses give one nag. `nagState` turns the two columns into `free`, `queued` or `recent`. `sendNagMails` is called by the same route as the change mails (`app/api/santa-mails/route.ts`), but it mails only requests that have waited an hour (`NAG_DELAY_MS`), so a nag does not go out right after the press (the giver may be sitting with the match). It: it drops requests that are no longer needed (a wish was written, the group is not started), claims each remaining one before sending (like `sendListChangeMails`) and puts it back if the mail fails.
- `lib/santa-match.ts`: `matchOf` also returns `nag`, the state for the page.
- `app/secret-santa/nag-actions.ts`: `nagForList()` takes no argument: site cookie, `guardWrite()`, the signed-in member from the cookie, then `requestNag`. A refusal says only "Du kan inte tjata just nu."
- `app/secret-santa/min-sida/NagButton.tsx`, shown on `/secret-santa/min-sida/matchning` under "Inga önskningar ännu.": "Tjata in en lista" (free), "Tjatet är på väg" (queued, disabled), "Du har tjatat nyss" (an hour after the mail, disabled). The new `red` variant of `Button` has the red border and red text; `AngryTomteIcon` (`app/components/icons.tsx`) is the angry santa, drawn like `TomteIcon` with slanted brows and a downturned mouth, never an emoji.
- Mail 9, `nagListMail(group)` in `lib/santa-mail.ts`: subject "Secret Santa: <group> – Din secret santa vill ha in en lista!", the text from the card, no heading, no home-screen tip, no name.

## Decisions

- **The lock replaces the one-hour rule of the job.** The button is locked while the mail waits and for an hour after it was sent, so the job needs no hour check, and the giver never sees "on its way" for an hour. The server checks the same hour, so a direct call is refused too.
- **State on the receiver's row**, not a table: the same shape as `list_changed_at`, nothing to join or delete.
- **The direct-call refusal is tested in unit tests**, not in the browser: React ignores a click on a button whose `disabled` prop is true, so a browser test cannot get past the disabled button.
- **Design:** red is `--color-christmas-red` (text and border, 5.7:1 on the card), not `--color-danger`, which DESIGN.md keeps for error text. The look is chosen with the user (see the card's Design section and DESIGN.md).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa match and change mails](../../wiki/system/secret-santa-match.md), [Mail](../../wiki/system/mail.md), [manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
