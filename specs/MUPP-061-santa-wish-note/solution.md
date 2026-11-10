---
type: Solution
title: "MUPP-061 Wish note instead of check mark: solution"
description: "How a participant's card in the Secret Santa admin shows the text Önskelista påbörjad with a green check circle in front instead of a lone check mark, and why."
feature: MUPP-061
card: "#188"
depends_on: [MUPP-041]
---

# MUPP-061 Wish note instead of check mark: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 188`.

## Data

None.

## Interface

`MemberCard` in `app/admin/SantaTab.tsx` no longer gives `SlimCard` a `thumb`. Its `note` holds up to two block lines: "Partner: <name>" and, when `member.hasWishes`, "Önskelista påbörjad". `SlimCard` already draws a note as small (14 px) muted text under the name, the same style as the status line of the group card, so no new component or colour was needed. The wish line is a flex row with a new 14 px `CheckCircleIcon` (`app/components/icons.tsx`; `Icon` got an optional `size`) in `text-christmas-green`, drawn as decoration (`aria-hidden`), so a screen reader reads only the text. The old `CheckIcon` is deleted.

## Decisions

- **The text is "Önskelista påbörjad"** (the first wording on the card, "Önskelistan på början", was wrong; changed 2026-11-10 after the user saw it in the running site, who also asked for the green symbol).
- **The green is the existing `--color-christmas-green` token** (#5F9A73, 5.6:1 on the card); no new colour. The symbol is a non-text graphic (at least 3:1 needed).
- **The note style is the existing one.** "Light blue" in the card is the muted text colour of the group card's status line; reusing `note` keeps one look and its contrast (checked in the design test).
- **Partner first, then the wish line**, each in its own `block` span, so a card with both stays two short lines at 320 px.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa draw](../../wiki/system/secret-santa-draw.md), [Admin manual](../../wiki/manual/admin.md); the rule for when it shows is [MUPP-041](../MUPP-041-secret-santa-draw/solution.md).

[Specifications](../index.md)
