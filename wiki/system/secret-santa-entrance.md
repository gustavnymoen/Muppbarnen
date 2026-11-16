---
type: Guide
title: Secret Santa entrance
description: "How visitors get into Secret Santa: the menu entry, the choice of event and name, the sign-in with phone or email, the signed cookie with one sign-in per group and the rules that keep contact details private."
resource: lib/santa-auth.ts
feature: MUPP-039
tags: [secret-santa, sign-in, cookie, security]
---

# Secret Santa entrance

Secret Santa knows who a visitor is, but only lightly: nobody is expected to cheat. The site password still gets you in; on top of that a visitor picks an event (a "grupp" in Swedish) and their own name and types the phone number or email saved for them. Events and members are made on the admin page ([MUPP-038](../../specs/MUPP-038-secret-santa-families/solution.md), [MUPP-048](../../specs/MUPP-048-santa-events/solution.md)); a member belongs to one event, so the same person in two events is two members.

## Parts

| Part | What it does |
|---|---|
| `app/secret-santa/page.tsx` | The entrance: event choice (skipped with one event), the grid of names, the sign-in form. From the names step "Tillbaka" (an `IconLink` in the page header's `back` slot) leads to the list of events, or to the start page when there is one event; from the sign-in step it leads back to the names. The steps are in the address (`?grupp=`, `&person=<member id>`). |
| `app/secret-santa/SignInForm.tsx` | Radio buttons phone/email and the field with the right keyboard and focus ([MUPP-047](../../specs/MUPP-047-santa-back-button/solution.md)). |
| `app/secret-santa/EscBack.tsx` | Esc goes where Tillbaka goes, on the names and the sign-in step ([MUPP-047](../../specs/MUPP-047-santa-back-button/solution.md), [MUPP-048](../../specs/MUPP-048-santa-events/solution.md)). |
| `app/secret-santa/actions.ts` | `signIn`. Opens with `openSiteAction()` (site sign-in, then `guardWrite()`). |
| `app/secret-santa/min-sida/page.tsx` | The own page of the group in the address (`?grupp=<group id>`): "Hej <name>!" and what the event's status shows: a line when inactive, the two cards when preparing ([event status](secret-santa-status.md)). |
| `app/secret-santa/min-sida/onskelista/page.tsx` | The wish list of that event, opened from the card "Min önskelista" ([Secret Santa wish list](secret-santa-wish-list.md)). |
| `lib/santa-auth.ts` | Reads names, compares phone or email, applies the block, reads (`signedInMembers`, `currentSantaMember`) and sets the cookie. |
| `lib/santa-session.ts` | Signs and checks the cookie's entries and joins and splits the list. |

## Rules

- **Names only.** The entrance and the grid read id and name (the event names are public to every visitor). Phone and email are read only inside `checkSantaSignIn`, for the comparison, and are never part of a page, a response or an error.
- **Phone:** spaces, dashes and parentheses are ignored and `+46` is read as a leading 0, so `070-123 45 67` and `+46701234567` match `0701234567`. **Email:** case does not matter.
- **Wrong answer:** always "Det stämde inte", whichever part was wrong or whether the person exists. More than 5 wrong tries in 15 minutes block the address for 20, with the same table as the passwords ([Site password](site-password.md)); a wrong try takes a second (`wrongWait` in `lib/login-block.ts`; the local test server skips it, [Testing](testing.md)).
- **Cookie:** `__Host-santa_session` (without the prefix over local http), `HttpOnly`, `Secure`, path `/`, no `Domain`, one year. Value: a list of entries `<member id>.<cleanup year>.<signature>`, oldest first, joined by `_`, at most 10 ([MUPP-079](../../specs/MUPP-079-santa-several-groups/solution.md)); each entry is signed over `santa-member.<id>.<year>` and nothing else is in it. A member id belongs to one group, so the list holds one entry per group: signing in to another group adds an entry, signing in again to the same group replaces its entry, and the 11th entry drops the oldest. Every entry is checked on every request and its member is read from the database, so a removed member or a cleanup only ends that one sign-in; an entry with a bad signature is ignored and the others stay. Cookies from before [MUPP-048](../../specs/MUPP-048-santa-events/solution.md) (signed over `santa.<id>`, a person id) do not pass, so they can never name another member.
- **Own page only:** `/secret-santa/min-sida` has no member id, only the group in `?grupp=<group id>`; it shows the member the cookie names in that group. The group id only selects among the signed entries, so it never gives access to anyone else: a group without an entry sends the visitor to that group's names. Without `?grupp=` the single entry is used. The same goes for the wish list and match pages, and the server actions get the group as an argument or a hidden field and pick the same way. A changed member id fails the signature.
- **Switching groups:** the own page has no "Byt person" and no sign-out. With several groups the back arrow ("Tillbaka", a link to `/secret-santa?val=grupp`) shows the choice of group and keeps every sign-in; a group already signed in to opens its own page at once. `?val=grupp` stops the entrance from sending a visitor with exactly one sign-in straight back to it. With one group a cross ("Stäng", a plain link) goes to the start page, since nobody should switch to another person's page ([MUPP-055](../../specs/MUPP-055-santa-back-arrow/solution.md), [MUPP-079](../../specs/MUPP-079-santa-several-groups/solution.md)).

Specification: [MUPP-039](../../specs/MUPP-039-secret-santa-entrance/solution.md), [MUPP-048](../../specs/MUPP-048-santa-events/solution.md), [MUPP-079](../../specs/MUPP-079-santa-several-groups/solution.md). More on cookies and limits: [Security](security.md).

[System documentation](index.md)
