---
type: Solution
title: "MUPP-079 Stay signed in to several Secret Santa groups: solution"
description: "How the Secret Santa cookie holds a signed list of memberships, one per group, and how the group in the address picks among them."
feature: MUPP-079
card: "#261"
depends_on: [MUPP-039, MUPP-048, MUPP-055]
---

# MUPP-079 Stay signed in to several Secret Santa groups: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 261`.

## Data

None. The cookie value changes shape: it is a list of the old entries `<member id>.<cleanup year>.<signature>`, joined by `_`, oldest first. An old cookie with one entry is a list of one, so nobody is signed out when this is deployed.

## Interface

- **R1** `lib/santa-session.ts`: `verifySantaSessions(value, secret)` returns every entry whose signature is ours (at most `MAX_SANTA_SESSIONS` = 10 are read), `joinSantaSessions(entries)` keeps the last 10. The signature is the same as before (`santa-member.<id>.<year>`), so the cookie still holds nothing but ids, years and signatures.
- **R2** `lib/santa-auth.ts`: `setSantaCookie(member)` keeps the memberships of the other groups, drops the one of the same group and any stale or removed one, and appends the new one. `signIn` looks the member up (`findMember`) and redirects to `/secret-santa/min-sida?grupp=<group id>`.
- **R3** `signedInMembers()` reads the valid memberships (entry year = cleanup year, member still in the database, one per group); `currentSantaMember(grupp)` picks the one of that group. The own page and its two sub pages read `?grupp=` from the address and redirect to `entranceHref(grupp)` (the names of that group) when there is no membership. Without `?grupp=` the single membership is used, as before. The entrance redirects to the own page when the address names a group the visitor is signed in to, or when there is no group in it and exactly one membership. "Tillbaka" on the own page is now a link to `/secret-santa?val=grupp`; `?val=grupp` switches off the one-membership redirect, so the choice of group can be reached. The server actions get the group from the caller (`eventId` as an argument or a hidden field) and pick among the cookie's memberships the same way. `leave` and `clearSantaCookie` are deleted.
- **R4** `signedInMembers()` filters per entry, so a removed member or an old cleanup year only drops that entry.
- **R5** Each entry is signed and checked on its own; a bad one is ignored and the others stay.
- **R6** No code change: `contactTaken` and `UNIQUE (event_id, phone)` already do it; the unit tests of MUPP-048-R5 are named for MUPP-079-R6 too.

## Decisions

- **One cookie with a list, not one cookie per group.** One cookie name keeps the `__Host-` rules and the code that sets it in one place; 10 entries are under 800 bytes.
- **The group is in the address, not in the cookie.** The card asks for `?grupp=`, so the group is shown and bookmarked in the address and there is no "current group" state to get out of step. It only selects among signed memberships, so a changed id gives nothing.
- **The one-membership redirect stays, with an escape.** The card says one membership still goes straight to its group, as today; `?val=grupp` on the arrow is what lets a visitor with one membership reach the choice of group.
- **"One per group" is kept when writing** (by member, via the database), not by putting the group in the cookie, so the cookie keeps the same entry format.
- **No "Logga ut" per group** (the card's decision); the cookie ends after a year or the yearly cleanup.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Secret Santa manual](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
