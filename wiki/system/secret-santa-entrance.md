---
type: Guide
title: Secret Santa entrance
description: "How visitors get into Secret Santa: the menu entry, the choice of event and name, the sign-in with phone or email, the signed cookie and the rules that keep contact details private."
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
| `app/secret-santa/actions.ts` | `signIn` and `leave`. Site sign-in first, then `guardWrite()`. |
| `app/secret-santa/min-sida/page.tsx` | The own page: "Hej <name>!" and what the event's status shows: a line when inactive, the two cards when preparing ([event status](secret-santa-status.md)). |
| `app/secret-santa/min-sida/onskelista/page.tsx` | The wish list of that event, opened from the card "Min önskelista" ([Secret Santa wish list](secret-santa-wish-list.md)). |
| `lib/santa-auth.ts` | Reads names, compares phone or email, applies the block, reads and sets the cookie. |
| `lib/santa-session.ts` | Signs and checks the cookie value. |

## Rules

- **Names only.** The entrance and the grid read id and name (the event names are public to every visitor). Phone and email are read only inside `checkSantaSignIn`, for the comparison, and are never part of a page, a response or an error.
- **Phone:** spaces, dashes and parentheses are ignored and `+46` is read as a leading 0, so `070-123 45 67` and `+46701234567` match `0701234567`. **Email:** case does not matter.
- **Wrong answer:** always "Det stämde inte", whichever part was wrong or whether the person exists. More than 5 wrong tries in 15 minutes block the address for 20, with the same table as the passwords ([Site password](site-password.md)); a wrong try takes a second (`wrongWait` in `lib/login-block.ts`; the local test server skips it, [Testing](testing.md)).
- **Cookie:** `__Host-santa_session` (without the prefix over local http), `HttpOnly`, `Secure`, path `/`, no `Domain`, one year. Value `<member id>.<signature>`, signed over `santa-member.<id>`; nothing else. It is checked on every request and the member is read from the database, so a removed member is signed out. Cookies from before [MUPP-048](../../specs/MUPP-048-santa-events/solution.md) (signed over `santa.<id>`, a person id) do not pass, so they can never name another member.
- **Own page only:** `/secret-santa/min-sida` has no id; it shows whoever the cookie names. A changed id fails the signature.
- **Leave:** "Byt person" removes the cookie and goes back to the entrance.

Specification: [MUPP-039](../../specs/MUPP-039-secret-santa-entrance/solution.md), [MUPP-048](../../specs/MUPP-048-santa-events/solution.md). More on cookies and limits: [Security](security.md).

[System documentation](index.md)
