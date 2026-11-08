---
type: Solution
title: "MUPP-039 Secret Santa: entrance and sign-in: solution"
description: "How the Secret Santa entrance is built: the menu entry, family and name choice, the sign-in with phone or email, the signed cookie and the own page, and the decisions and why."
feature: MUPP-039
card: "#137"
depends_on: [MUPP-009, MUPP-038]
---

# MUPP-039 Secret Santa: entrance and sign-in: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 137`.

## Data

None. It reads `ss_family`, `ss_person` and `ss_member` from [MUPP-038](../MUPP-038-secret-santa-families/solution.md). Wrong tries use the existing `login_attempts` and `login_blocks` tables.

## Interface

- **Menu** (`app/components/SiteMenu.tsx`): "Secret Santa", before "Admin" (R1).
- **`/secret-santa`** (`app/secret-santa/page.tsx`): three steps kept in the address, so the back button works and nothing is lost on a reload: the families (`?familj=<id>`, skipped with one family), the names of the family (`?familj=…&person=<person id>`) and the sign-in form. A signed-in visitor is sent on to the own page (R5). Family choice is a column of links; the members are a two-column grid of links, each at least 48 px high, so eight fit a 375 x 667 phone (R2, R3).
- **`SignInForm`** (`app/secret-santa/SignInForm.tsx`, client): radio buttons "Telefon" (selected) and "E-post"; the field is `type="tel"`/`inputmode="tel"` or `type="email"`/`inputmode="email"`, is emptied and focused on every change, and is focused again after a wrong answer (R4, R4b). A wrong answer says "Det stämde inte", a block "För många försök. Försök igen om en stund."
- **`/secret-santa/min-sida`:** "Hej <name>!" and the button "Byt person". An empty page for the later cards. It has no id in the address: who you are comes only from the cookie (R6).
- **Server actions** (`app/secret-santa/actions.ts`): `signIn` and `leave`. Both start with `requireSiteSession()` and `guardWrite()`.
- **`lib/santa-auth.ts`** (server only): what the entrance reads (names only), the comparison, the sign-in check with the block, and the cookie helpers. **`lib/santa-session.ts`** (pure): signing and checking the cookie.

## Decisions

- **The cookie** is `__Host-santa_session` in production (`santa_session` over local http, the same rule as the other cookies): `HttpOnly`, `Secure`, path `/`, no `Domain`, `SameSite=Lax`, one year (until the yearly wipe). Its value is `<person id>.<HMAC-SHA256 of "santa.<id>">`, signed with the site's session key; the `santa.` prefix keeps the signature apart from the other cookies'. It holds nothing but the id.
- **The cookie names the person, not the family.** One person can be in several families (MUPP-038), and the own page and later cards belong to the person's memberships.
- **Who you are is read from the database on every request** (`currentSantaPerson`): if the person has been removed, the cookie is worth nothing.
- **Phone or email is compared on the server only.** `normalizePhone` drops spaces, dashes and parentheses and reads `+46` as a leading 0; the email is compared ignoring case. Phone and email never leave `lib/santa-auth.ts`; the pages get names and ids.
- **The block is the existing one** (`beginAttempt`, `registerWrong`, `clearAttempt` in `lib/login-block.ts`), shared with the passwords: more than 5 wrong tries in 15 minutes block the address for 20. A wrong try costs a second. An unknown person, a wrong kind and a wrong value all give the same answer.
- **Known limit:** the block is per IP address and a phone number has 10^8 possibilities, so a determined guesser with many addresses could get through. That is accepted: nobody is expected to cheat, and the site password comes first.
- **SQL is fixed text** (the CI scan rejects SQL built from text).
- **Person ids in the address** are fine: names and ids show to anyone who has the site password, and the ids give no access (the check needs the saved phone or email).
- **Leaving** sets the cookie again with the same attributes and `Max-Age=0`; a `__Host-` cookie without `Secure` is not accepted even to be cleared.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
