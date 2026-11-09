---
type: Guide
title: Form cards
description: "How every dialog and form on the site is one card that grows out of its button: the shared Dialog, focus on open, Enter between fields, the confirmation after a new wish, the announcement after a save, and the lists inside a card."
resource: app/components/Dialog.tsx
feature: MUPP-045
tags: [forms, dialog, motion, accessibility]
---

# Form cards

Every dialog and form on the site is the same component, `Dialog` (`app/components/Dialog.tsx`). It opens by growing out of the button that was pressed and folds back into it when it is closed, the way the wish list does ([Design system](design.md)). A **form card** is the card for a form: a cross in the top right corner, the first field focused, Enter between the fields.

## Which is which

| Card | Examples | Cross | Tap outside | Focus on open |
|---|---|---|---|---|
| Form card (`form`) | Edit parent, kid, picture, sizes, wish, family, person, member; the claim window | "Stäng" | nothing | the first field (its text selected when editing); a list's button when the first field is a list |
| Question | "Ta bort …?", "Ta bort paxningen", "Lägg till … igen" | no | nothing | the first button (the safe one, "Avbryt") |
| Information | "Så funkar sajten", the kid's sizes on the start page | no | closes "Så funkar sajten" (`backdropClose`) | the first control |

The page forms (the password pages, the admin sign-in, the Secret Santa sign-in) are not cards and work as before.

## Opening and closing

- A button calls `card.current?.open(event.currentTarget)`. `FormCard.tsx` is the button and the card in one for the forms; the others hold a `ref` to `Dialog` themselves.
- The content exists only while the card is open, so a form starts empty (or with the current values) each time.
- `open()` renders the content with `flushSync`, shows the card (`showModal()`), grows it from the button (`growScale` in `transition.ts`) and focuses the first field before it returns, so the focus is set **in the press**: iOS Safari shows the keyboard only then. Nothing waits for the motion.
- `close()` (the cross, Esc, a button inside, a saved form) copies the card, closes the real one at once, puts focus on the button and moves and scales the copy onto the button while its content fades first ([MUPP-037](../../specs/MUPP-037-close-motion-surface/solution.md)). The copy is removed when the motion ends, is cancelled or after a safety time, and a new open or close removes it first. A card with no button (the first visit's "Så funkar sajten", or a button that is gone) only fades, and focus goes to the heading of the section it was in.
- With `prefers-reduced-motion` nothing moves or fades and no copy is made. While a card is open the page behind does not scroll and the card scrolls inside itself.

## Inside a form card (`Form.tsx`)

- **Enter** in a text, phone, e-mail, date or password field moves to the next one and sends from the last; in a text area it is a new line; a list, a checkbox and a file do what they always did; a word being composed with an input method is left alone. The decision is the pure function `enterAction` in `lib/form-card.ts`. `enterkeyhint` makes a phone's Enter key say "Nästa" and, in the last field, "Klar".
- **A new wish** (`again`) keeps the card open: the fields are empty, focus is in the first, and a toast says "fotboll lades till" (a title over 25 characters is cut to 24 and "…", `shortTitle`; the next save replaces it). For a screen reader the card has a hidden status line with the same words.
- **Every other save** closes the card, a toast says the same and a screen reader hears "Otis sparades", "Otis lades till", "Storlekarna för Otis sparades" or "Bilden för Otis sparades" from a hidden status next to the card (`says` on `Form`). The typed text is only ever text, never HTML.
- **A failed save** keeps the card and what was typed (not passwords or files), shows the message at the field or in the alert (a server error also in a red toast), and moves focus to the first field with an error or to the alert.
- **A list** (`ListPicker`) is drawn inside the card's `<dialog>`, so it is in front of the card and not behind it; Esc closes the list, not the card.

## The toast (`Toaster.tsx`, MUPP-054)

After every save (a card that closes, a card that stays open, a form on a page) a green band slides down from above, centred at the top of the screen, stays 2 seconds and fades out; an error of the server shows a red one with its message; a field that is missing or wrong only has its error at the field, no toast. It is a `popover` in the browser's top layer, so it is in front of an open card and always at the top of the visible screen. `toast(text, error?)` is called from `Form`, the copy dialog and the question card (errors only). It is `aria-hidden`: screen readers hear the announcements above. See [the solution](../../specs/MUPP-054-toaster/solution.md).

## Tests

`tests/MUPP-045-form-cards.spec.ts` (one journey per surface), `tests/MUPP-045-form-cards.webkit.spec.ts` (the focus in the press, on an iPhone profile, `npm run test:webkit`) and `lib/form-card.test.ts`; the look in `tests/design.spec.ts`. The keyboard coming up on a real iPhone and VoiceOver are checked by hand ([Testing](testing.md), [Accessibility](accessibility.md)).

Built by [MUPP-045](../../specs/MUPP-045-form-cards/solution.md).

[System documentation](index.md)
