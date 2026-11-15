---
type: Solution
title: "MUPP-076 Secret Santa mail: partner sentence: solution"
description: "How Secret Santa mail: partner sentence is built: data, interface and decisions and why."
feature: MUPP-076
card: "#258"
depends_on: [MUPP-052]
---

# MUPP-076 Secret Santa mail: partner sentence: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 258`.

## Data

None.

## Interface

Mail 1 (`activatedMail` in `lib/santa-mail.ts`) says: "Du kan inte matchas med dig själv eller den du hade förra året! Har admin även satt partners på deltagarna får du inte din partner." The text is static, the same in every group, whether or not any member has a partner. The contact sentence of mails 1 and 8 ends "hör av dig till den som skapade gruppen.", and mail 8 reads "Du har lagts till i Secret Santa-gruppen <group>." with no name; `activatedMail` and `addedMail` take only the group.

## Decisions

- A generic, static sentence instead of one that depends on the group's partners (chosen by the user on the card): no new data goes into the mail, so it still holds only the group's name.
- MUPP-075 was merged into this card (R3–R5): `contact` is a constant, mail 8 has no "av <admin>", and the mail functions take only the group. `adminName` and `ownerName` in `lib/santa.ts` only served the mails and are removed.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: the texts are quoted in [MUPP-052 verification](../MUPP-052-santa-mail-texts/verification.md); the manual and `wiki/system/mail.md` do not quote the sentence.

[Specifications](../index.md)
