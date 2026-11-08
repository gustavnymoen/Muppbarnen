---
type: Guide
title: Secret Santa entrance
description: "How visitors get into Secret Santa: the menu entry, the choice of family and name, the sign-in with phone or email, the signed cookie and the rules that keep contact details private."
resource: lib/santa-auth.ts
feature: MUPP-039
tags: [secret-santa, sign-in, cookie, security]
---

# Secret Santa entrance

Secret Santa knows who a visitor is, but only lightly: nobody is expected to cheat. The site password still gets you in; on top of that a visitor picks a family and their own name and types the phone number or email saved for them ([MUPP-038](../../specs/MUPP-038-secret-santa-families/solution.md)).

## Parts

| Part | What it does |
|---|---|
| `app/secret-santa/page.tsx` | The entrance: family choice (skipped with one family), the grid of names, the sign-in form. The steps are in the address (`?familj=`, `&person=`). |
| `app/secret-santa/SignInForm.tsx` | Radio buttons phone/email, the field with the right keyboard and focus. |
| `app/secret-santa/actions.ts` | `signIn` and `leave`. Site sign-in first, then `guardWrite()`. |
| `app/secret-santa/min-sida/page.tsx` | The own page, empty for now. |
| `lib/santa-auth.ts` | Reads names, compares phone or email, applies the block, reads and sets the cookie. |
| `lib/santa-session.ts` | Signs and checks the cookie value. |

## Rules

- **Names only.** The entrance and the grid read id and name. Phone and email are read only inside `checkSantaSignIn`, for the comparison, and are never part of a page, a response or an error.
- **Phone:** spaces, dashes and parentheses are ignored and `+46` is read as a leading 0, so `070-123 45 67` and `+46701234567` match `0701234567`. **Email:** case does not matter.
- **Wrong answer:** always "Det stämde inte", whichever part was wrong or whether the person exists. More than 5 wrong tries in 15 minutes block the address for 20, with the same table as the passwords ([Site password](site-password.md)); a wrong try takes a second.
- **Cookie:** `__Host-santa_session` (without the prefix over local http), `HttpOnly`, `Secure`, path `/`, no `Domain`, one year. Value `<person id>.<signature>`; nothing else. It is checked on every request and the person is read from the database, so a removed person is signed out.
- **Own page only:** `/secret-santa/min-sida` has no id; it shows whoever the cookie names. A changed id fails the signature.
- **Leave:** "Byt person" removes the cookie and goes back to the entrance.

Specification: [MUPP-039](../../specs/MUPP-039-secret-santa-entrance/solution.md). More on cookies and limits: [Security](security.md).

[System documentation](index.md)
