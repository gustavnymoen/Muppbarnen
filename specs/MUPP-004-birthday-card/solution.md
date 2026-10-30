---
type: Solution
title: "MUPP-004 Birthday card: solution"
description: "How the birthday deck on the start page is built: the deck logic, the data sent to the browser, the client component, and the decisions behind them."
feature: MUPP-004
card: "#10"
depends_on: [MUPP-002, MUPP-003]
---

# MUPP-004 Birthday card: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 10`.

## Data

None. No tables or migrations change. `lib/family.ts` gets one read, `listDeckInput()`: the kids (id, parent, name, birthdate, whether they have a picture) and the headlines of their wishes per occasion, in the order of the admin page.

## Interface

- **Deck logic** (`lib/deck.ts`, plain functions, unit tested in `lib/deck.test.ts`): `nextOccurrence` (the next time a month and day comes, today counting, 29 February falling on the 28th in years without one), `buildDeck` (one card per date, plus Christmas Eve, nearest first; kids grouped by parent and oldest first) and `swedishToday` (today's date in Sweden whatever the server's time zone). `buildDeck` returns only what the browser may see: month, age, colour, whether there is a picture and the wishes (R6).
- **Start page** (`app/page.tsx`): checks the site session, reads the kids, builds the deck and hands it to the client component. The made-up example cards are gone.
- **The deck** (`app/components/BirthdayDeck.tsx`, a client component): the selected card in the middle and the previous and next at its sides, dimmed and smaller (`SIDE_OFFSET`, `SIDE_SCALE`; the stage clips them, so a strip of each shows; the others are not drawn). It holds the state: which card, which kid's list is open (`openList`), the sentence for the live region and the swipe distance. Browsing is by the buttons "Föregående kort" and "Nästa kort" (44 px, disabled while locked), the arrow keys and a pointer swipe that the top card follows. The cards at the sides are `aria-hidden` and `inert`.
- **Cards**: a header (the month or "Julafton", and the mark "Nästa födelsedag" or "Nästa: Julafton" on the first card); one kid is shown as a large picture, name, age and the wish list; several kids on a birthday card are shown as miniatures of the single card, one above the other (picture, name, age and a narrow wish list button "Önskelista för Vera"); on the Christmas card, which has all the kids, they are narrow rows (a small picture, the name beside it, a button "Öppna Vera"). The button or row opens that kid as an ordinary card with the list unfolded.
- **Wish list** (`app/components/WishList.tsx`): folded, only the button (`WishButton`: "Önskelista" with an arrow down, no number of wishes (MUPP-005-R6), in the kid's colour (`.wish-button`, a tint with the colour as text, as the label chip but with a stronger edge) because the wish list is what the site is for); unfolded, the list of headlines above the button, which scrolls inside the card. It is controlled by the deck, so it can lock it. MUPP-005 builds on it.
- **Layout**: every card is as high as the stage up to 40 rem and centred (`h-full max-h-[40rem] self-center`), so cards are equally big with one kid or four; the single card gets a 192 px picture and the extra room goes between the texts, with the month a little way down from the top (`pt-8`) and the button lifted from the bottom edge (`pb-8`). The browse buttons sit on the left and right edges of the middle card, at its middle (their wrappers have `pointer-events-none` so that they do not block the swipe), and the stage has 32 px of padding on each side, which is the strip of the side cards that shows.
- **Header**: month (or "Julafton") centred, the mark "✦ Nästa födelsedag ✦" under it in the first kid's colour (`NextMark`).
- **Christmas look** (`app/components/ChristmasBackdrop.tsx`): one inline SVG behind the content of the card (`-z-10` in the card's own stacking context, `aria-hidden`): a dark green night gradient, a garland with lights across the top, four-point stars, snow, two rows of fir trees and a snow bank at the bottom. It is drawn as shapes from the design's tokens (`--color-christmas-green`, `--color-christmas-red`, the child colours), no emoji and no pictures, so the Content-Security-Policy needs nothing. The garland is kept inside the top 40 px so that it does not run through "Julafton".
- **Look**: `.deck-card` (the slide, no motion with reduced motion), `.christmas-card` in `app/globals.css`; the side cards are darkened (`.deck-card[inert]`). The old `.carousel` styles are removed.
- **Texts** (Swedish): "Inga barn har lagts till än.", "Inga önskningar än.", "Stäng önskelistan för att bläddra.", and for the screen reader "Kort 2 av 5: Alma och Vera, mars", "Kortleken är låst. Stäng önskelistan för att bläddra." and "Kortleken är upplåst.".
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **The deck is built on the server, and the browser gets the result.** The day of birth is needed to order the cards, so it must never reach the client. Building the cards in `lib/deck.ts` and sending only month and age makes R6 true by construction. A test caught that a card key made from the date (`f-3-17`) leaked the day; the keys are now the card's place in the deck.
- **Today counts in Swedish time.** `swedishToday` uses `Intl` with `Europe/Stockholm`, since Vercel runs in UTC and a birthday would otherwise change a few hours early or late.
- **The lock is one piece of state.** `openList` says whether and which list is open; the buttons, swipe and arrow keys all check it. Focus is handled in one place: after a list opens, focus goes to its button (the pressed kid button disappears), and after it closes, back to the kid's button on a card with several kids, or to the list button.
- **A carousel, not a stack.** The first version laid the next cards behind the middle one; it looked odd, and a carousel with cards at the sides, as in the visitor's sketch, shows more clearly that there is more to browse.
- **Only three cards are drawn,** with the others not in the page at all. That keeps the page light and means hidden cards cannot be reached; with two cards the next and the previous are the same card, drawn once.
- **Swipe with pointer events,** not a library: after 8 px of movement the pointer is captured, the top card follows, and 50 px or more changes card. `touch-action: pan-y` keeps vertical scrolling of a list working.
- **"för Vera" is hidden text** in each miniature's wish list button (`sr-only`), so the accessible name ("Önskelista för Vera") starts with the visible text (axe rule `label-content-name-mismatch`) and says whose list it is; an `aria-label` would not.
- **With a single card the buttons cannot be reached:** a deck with any kid always has at least two cards (the birthday and Christmas Eve), and with no kids there are no buttons. The "disabled with one card" part of R8 is therefore only the code path in `go()`.
- **The smoke test is the existing one:** the whole site is behind the password and smoke tests start without it, so they cannot see the deck. The deck is checked by the browser tests and the live accessibility checklist.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
