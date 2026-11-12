---
type: Verification
title: "MUPP-052 Secret Santa: mail texts: verification"
description: "How each requirement of Secret Santa mail texts was checked, the test suite before and after, and the requirements as built."
feature: MUPP-052
---

# Verification of MUPP-052

How each requirement was checked. Dates are 2026-11-09. "Not checked" means the check was not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-052-R1 | Unit tests `MUPP-052-R1 …` in `lib/santa-mail.test.ts`: all eight mails against the card's exact subject and text, the event in every subject, the shared layout at the end, no member name, wish or message text, and only mails 1 and 8 name the administrator | local | Pass | 2026-11-09 |
| MUPP-052-R2 | Unit test `MUPP-052-R2 …` in `lib/santa-mail.test.ts`: the four dialog texts. The dialogs themselves do not exist yet (MUPP-051 and MUPP-041 build the buttons); not checked in a browser | local | Pass (texts only) | 2026-11-09 |
| MUPP-052-R3 | Unit tests `MUPP-052-R3 …` in `lib/mail.test.ts`: paragraphs and line breaks, the button with the site's colours and radius, the line under it, the plain-text version. How it looks in real mail clients: not checked (no mail is sent until TECH-020) | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-mail.test.ts` (18 tests) and the layout tests in `lib/mail.test.ts` | local, CI | Pass | 2026-11-09 |
| Browser tests | Not applicable: the plan says none | | | |
| Smoke test | Not applicable: the plan says none | | | |
| Accessibility | Not applicable: no page or state changes | | | |
| Security | Security points in the review; `/security-review` not needed (no route, action or sign-in; the cards that send are reviewed) | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured on its own; `main` was already over budget (TECH-019) | | |
| After | 262 unit (0.4 s) + 130 browser | 262.8 s (budget 180 s, over: TECH-019, not fixed here) | 6.7 s (MUPP-038-R2 …, over the 5 s budget, not touched) |

The change adds no browser test. A first full run after rebasing onto `main` had 54 failing browser tests that I did not investigate; the same code passed all 130 in the next run, so I take it as a transient problem on the machine, but the cause is not known.

## Definition of Done

- [x] Tests: every requirement is tested; `npm run test:unit` (262) and `npm run test:local` (130) pass
- [x] Test suite: the browser suite is over its budget since before this change (TECH-019); this change adds no browser test; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit bf46b72 passed (2026-11-09)
- [x] Accessibility: not applicable (visitors see no change)
- [x] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual: `wiki/manual/secret-santa.md` (Mejlen du får), `wiki/system/mail.md` and `wiki/log.md` updated
- [x] No leftovers (the mail functions are unused until MUPP-051, 041, 042 and 043 call them, by design)
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none

## Requirements as built

### MUPP-052-R1 The mails

The series shall send exactly these eight mails, to the recipients and at the times below. `<grupp>` is the event's name; each text is followed by the shared layout (R3: a button to kusinportalen.com and, under it, "Detta mail går inte att svara på.").

#### Mail 1

- **When:** Event activated (MUPP-051); also to a member added while preparing, right after mail 8
- **To:** every member (that member)
- **Subject:** Secret Santa: <grupp> – Nu kan du skriva din önskelista
- **Text:**

  Ho-Ho! Nu har gruppen <grupp> öppnat. Gå in på sajten, välj Secret Santa och din grupp, logga in med ditt telefonnummer eller din e-post och skriv din önskelista. Senare dras lottningen, och du ser vem du ska handla åt. 
Du kan inte matchas med din partner, dig själv eller den du hade förra året!
Du kan fylla i din önskelista från och med nu och ändra fram till julafton, men var snäll mot din matchning och bestäm dig i tid!
Allt är hemligt: ingen får veta vem som drar vem. Är det här inte du, eller vill du inte vara med, hör av dig till <administratörens namn>.

#### Mail 2

- **When:** Event deactivated (MUPP-051)
- **To:** every member
- **Subject:** Secret Santa: <grupp> – är avaktiverad!
- **Text:**

  Gruppen <grupp> är avaktiverad. Det går inte att skriva önskelistor just nu. Du får ett nytt mail om den öppnas igen. Något kan ha gått fel i admin-joxandet!

#### Mail 3

- **When:** Draw done, event started (MUPP-041)
- **To:** every member
- **Subject:** Secret Santa: <grupp> – nu har du fått en secret santa!
- **Text:**

  Ho ho ho! Dragningen i <grupp> är gjord. Gå in och se vem du ska handla åt. Du kan fortfarande ändra din önskelista, och du kan skicka och ta emot frågor utan att någon får veta vem du är. I din önskelista kan du få frågor från din matchning om din önskelista. Du kan också meddela om det är något dom vill framföra!
I din secret santas önskelista kan du skicka frågor och få svar om hens lista! 
Det är alltså två chattar, en i din lista om DIN önskelista, samt en i din matchnings lista!

#### Mail 4

- **When:** Event stopped (MUPP-041)
- **To:** every member
- **Subject:** Secret Santa: <grupp> – dragningen är stoppad
- **Text:**

  Oh no! Dragningen i <grupp> är stoppad, till exempel för att någon saknades. Din tilldelning och dina samtal är borttagna och en ny dragning görs. Din önskelista finns kvar. Du får ett nytt mail när den är klar.

#### Mail 5

- **When:** The receiver's list changed while started (MUPP-042), collected into one mail an hour
- **To:** the giver
- **Subject:** Secret Santa: <grupp> – din matchning har uppdaterat sin önskelista
- **Text:**

  Nu händer det grejer! Din matchning har uppdaterat sin önskelista.
- **Note (not part of the mail):** one change or ten gives the same mail.

#### Mail 6

- **When:** A message from the giver (MUPP-043), collected over ten minutes per conversation
- **To:** the receiver
- **Subject:** Secret Santa: <grupp> – nytt meddelande från din Secret Santa
- **Text:**

  Ay caramba! Du har fått ett nytt meddelande från din Secret Santa (den som ska handla åt dig). Det kan vara en fråga om något i din lista, så in och kika!

#### Mail 7

- **When:** A message from the receiver (MUPP-043), same limit
- **To:** the giver
- **Subject:** Secret Santa: <grupp> – nytt meddelande från din matchning
- **Text:**

  Whooop! Du har fått ett nytt meddelande från din matchning (den du ska köpa till). Det kan vara ett svar på en fråga du ställde, eller allmänt gnäll, in och kolla!

#### Mail 8

- **When:** A person is added to an event (MUPP-051), in any status where adding is allowed
- **To:** that person
- **Subject:** Secret Santa: <grupp> – välkommen
- **Text:**

  Du har lagts till i Secret Santa-gruppen <grupp> av <administratörens namn>. Är det här inte du, eller vill du inte vara med, hör av dig till <administratörens namn>. När gruppen öppnar får du ett nytt mail som berättar hur det går till!


Acceptance criteria:

- **Given** each mail, **then** its subject and text are exactly those above (with the group name filled in) plus the shared layout (R3).
- **Given** any mail, **then** it holds no member name, wish, message text or answer; mails 1 and 8 name only the event's administrator.

The name in mails 1 and 8 is the administrator of the event (the parent who created it), not a member; they are the only mails that name a person, and hold no wishes or draw. Mail 1 carries the explanation of how it works and the contact line, because it goes out every year when the event is activated, also to people who were added in an earlier year and so never get mail 8 again; mail 8 only says that you were added.

### MUPP-052-R2 The confirmations

The confirmation dialogs of the status changes shall say what happens, in Swedish.

Acceptance criteria:

- **Given** Aktivera, **then** the dialog asks "Är du säker?" and says that everyone in the group gets a mail and can start writing wish lists. Avaktivera: that everyone gets a mail and that the wish lists are kept. Starta (MUPP-041): that everyone is assigned a person, gets a mail, and that no one can be added, changed or removed after. Stoppa: that the draw and all conversations are deleted, the wish lists are kept, and everyone gets a mail.

### MUPP-052-R3 Layout of every mail

Every mail shall be laid out the same way: the text in paragraphs, a button to the site and, under the button, a line that the mail can not be answered.

Acceptance criteria:

- **Given** a mail text, **then** it can have several paragraphs; a blank line in the text starts a new paragraph and a single line break stays a line break inside the paragraph (in the HTML mail and in the plain-text version).
- **Given** any mail, **then** it has a link to kusinportalen.com shown as a button in the same style as the buttons on the site (same colours, rounded corners and font as far as mail clients allow; a plain link as fallback where buttons are not shown).
- **Given** any mail, **then** under the button it says "Detta mail går inte att svara på."
- **Given** the plain-text version of a mail, **then** it holds the same text, the address of the site and the same line.

## Notes

- The `heading` of TECH-017's `sendMail` was removed: the card's mails have only a subject and a text.
- The mail functions and the dialog texts are not used yet; MUPP-051, 041, 042 and 043 must use them and not copy the texts.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
