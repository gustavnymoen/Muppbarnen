---
type: Solution
title: "MUPP-078 Secret Santa members: partner and top buttons: solution"
description: "How the Partner field in the new-person card and the page reset after a card is closed are built."
feature: MUPP-078
card: "#260"
depends_on: [MUPP-060]
---

# MUPP-078 Secret Santa members: partner and top buttons: solution

What is built and why is in the card: `gh issue view 260`.

## Data

None. The partner is the existing `ss_member.partner_member_id`, set both ways by `setPartner`.

## Interface

- `app/admin/SantaTab.tsx`: the Partner select is the small component `PartnerField`, used by the edit card and, when the group has at least one person, by the "Ny person i <group>" card (label "Partner", first option "Ingen", then the people). In an empty group the field is hidden.
- `app/admin/santa-actions.ts`: `addMember` reads `partnerId` from the form; a missing field (empty group) is "no partner".
- `lib/santa.ts`: `addMember` takes `partnerId` and sets the pair after the insert. The checks that were inline in `saveMember` are now `partnerProblem` (used by both): a value that is not an id, someone outside the group, or the person themself gives "Välj en av de andra i gruppen.".
- `app/components/Dialog.tsx`: `close()` calls `resetPageScroll`, which scrolls the document to the top and once more when the visual viewport changes size (the keyboard going down). No new texts.

## Decisions

- **Partner already paired:** the card first said it should be refused. It follows the edit card instead: choosing someone who has a partner releases the old pair (`setPartner`), so adding and editing behave the same and the select needs no special rules. The card is updated.
- **Why the reset is in `Dialog`:** the page itself never scrolls (`html:has([data-page]) { overflow: hidden }`, the scroll is in `Page`), so the document being above zero is always wrong, and `Dialog` is the one place that opens and closes every card. The cause (iOS pushes the document up when the keyboard of a field in the card opens and does not bring it back) is the likely one from the card; it could not be reproduced in the test suite, only the scroll position after closing is tested. The check on an iPhone is manual (see verification).
- **Not hidden by a flag:** the reset runs for every card on every device; where nothing was scrolled it does nothing.

## Related

- [Verification](verification.md), [Review](review.md), [flow.mmd](flow.mmd).
- Documentation: [Form cards](../../wiki/system/form-cards.md), [Secret Santa status](../../wiki/system/secret-santa-status.md), [Admin manual](../../wiki/manual/admin.md).

[Specifications](../index.md)
