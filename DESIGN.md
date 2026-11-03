---
type: Guide
title: Design
description: "The design tokens of Muppbarnen: every colour, font, radius, shadow and motion value with its use, and the rules for using them."
resource: app/globals.css
feature: MUPP-001
tags: [design, tokens, accessibility]
---

# Design

A dark, muted, mobile-first look: blue-grey near-black surfaces, thin edges, layered shadows, soft text, and colour used sparingly. The tokens live in `app/globals.css` (`@theme`) and are used through Tailwind (`bg-card`, `text-muted`, …); nothing else in the code has its own colour values. `/design` shows them and the components. A unit test checks that this page and the code list the same values and that their contrast is enough.

## Colours

| Token | Value | Use |
|---|---|---|
| `--color-page` | `#0C1015` | Page background |
| `--color-card` | `#141920` | Cards and the secondary button |
| `--color-edge` | `#272E39` | The 1 px edge of cards and chips (never the only sign of a control) |
| `--color-shadow` | `#05080D` | The hard part of shadows |
| `--color-text` | `#C8D0DC` | Text (soft, not white) |
| `--color-muted` | `#8591A4` | Secondary text, and the border of the secondary and icon buttons |
| `--color-brand` | `#9AA9E0` | The main button and the focus ring (never red: red means cancel or error) |
| `--color-on-brand` | `#0C1015` | Text on the brand colour |
| `--color-danger` | `#E8938F` | Error messages, as text only (never a fill; with the words that say what is wrong) |
| `--color-claimed` | `#E3A15F` | A claimed gift: the "Paxad" mark and the "Paxad av …" line, as text only (with the words that say it), and the undo arrow on a claimed row (MUPP-006) |
| `--color-christmas-green` | `#5F9A73` | The Christmas Eve card: its green night background drawn as shapes behind the content |
| `--color-christmas-red` | `#D8766F` | Lights and berries in the Christmas background (decoration only) |
| `--color-child-coral` | `#D4958B` | Child colour 1 |
| `--color-child-sun` | `#D4B873` | Child colour 2 |
| `--color-child-mint` | `#82BD9F` | Child colour 3 |
| `--color-child-sky` | `#82AAD0` | Child colour 4 |
| `--color-child-lilac` | `#A698D0` | Child colour 5 |
| `--color-child-pink` | `#CD96B8` | Child colour 6 |

A child's colour is only used toned down, mixed with the card colour: the ring of an avatar (65 %), the edge of a highlighted card (60 %), a chip (the colour as text on a tint of 16 %, with an edge of 35 %), and the wish list button (a fill of 85 %, with dark text on it, `--color-on-brand`). It is never a bright fill. Only one card in a list, the one that matters most now, is highlighted.

## Type

| Token | Font | Use |
|---|---|---|
| `--font-heading` | Fredoka (500, 600) | Headings, names and buttons |
| `--font-sans` | Nunito (400, 700) | Running text, at least 16 px |

Both are loaded by `next/font` at build time and served from our own server (`font-display: swap`, Latin subset), so no request goes to a font host. Fallbacks: `ui-rounded`/`system-ui`.

## Shape, shadow and motion

| Token | Value | Use |
|---|---|---|
| `--radius-card` | 1.25 rem | Cards |
| `--radius-control` | 0.875 rem | Buttons |
| `--shadow-card` | layered | A faint light top edge, a short hard offset in the shadow colour, a near and a soft far shadow |
| `--shadow-card-pressed` | layered, flatter | Pressed cards and buttons, which move into their shadow |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | All motion |

Motion is only small feedback (a press, a card fading in, the wish list opening and closing) of at most 300 ms, with transform, opacity and `clip-path`. On a card with one kid the wish list grows out of the "Önskelista" button, moved and scaled while fading in (300 ms), and shrinks back into it the same way as the other cards (MUPP-029); on a card with several kids and on Christmas Eve the kid's view grows out of the pressed button or tile (300 ms). Closing always shrinks back to the button as a whole picture, scaled and fading (300 ms, fully visible for the first 40 %), so it looks as if the list or card unfolds from the button and folds back into it. With reduced motion nothing moves; a pressed control only gets darker.

## Child colours

`childColor(n)` in `lib/child-colors.ts` gives child number `n` one of the six colours in the order above; the same number always gives the same colour, numbers wrap around, and any number (also negative or very large) gives a colour.

## Layout

The page shell (`Page`, `PageContent`) fills the screen (`dvh`, with safe areas), the page itself does not scroll and only the content region does. It is a frame of at most 72 rem, centred, with side padding of 1 rem (2 rem from 640 px). Controls are at least 44 × 44 px; the info button in a wish row is frameless (just the icon, with a round `--color-edge` tint while hovered or pressed), and so is the undo arrow (↺, in `--color-claimed`) that removes a claim on a claimed row, in the same column as the checkbox and the info button, so every row has one control in the same place (MUPP-006; a trash can would read as deleting the wish, and a cross is already the list's close button); the exception is the 32 × 32 px icon buttons in the admin's slim rows (MUPP-010), which pass WCAG 2.2 AA (24 px). The button that folds up an open wish list is a 32 px circle (a cross on every card, MUPP-034) centred on the bottom edge line of the list box, half outside it, with an invisible 44 × 44 px target; "Paxa (n)" is a fixed, centred row between the rows and that button (MUPP-028). The site's name is not shown as a heading: the start page keeps it as a visually hidden `h1`. An open kid view gives the wish list the room (MUPP-030): the date sits on the row of the corner buttons, between them, and under it a 40 px picture with the name (`text-2xl`, shrinking to fit on one line) beside it; the "Nästa" chip and the age are left out, since the closed card showed them. On a card the kid's name leads and the date is a label (TECH-013): on the closed card with one kid the name is `text-3xl` and the date above it `text-xl`, as in the open view. That card's picture is always round and takes the height that is left, from 72 to 192 px; on a narrow phone (under 23 rem) the "Nästa födelsedag" chip has smaller text (`text-sm`) so it stays on one line, and the browse arrows sit at the edge of the deck, clear of the buttons on the card; on a low phone (600 px or lower) the closed card with one kid has less air (padding and gaps), so "Storlekar" stays clear of the wish list button.

## Concept (TECH-006, step 1)

The concept is decided: **the look above stays** (dark blue-grey night, thin edges, layered shadows with a short hard offset, a soft lilac-blue main button, Fredoka and Nunito). Eight proposals in four rounds were tried on a phone in the running site, among them a warm brown, a deep violet, a forest green, a light paper, a wine-red on cream, an arcade look, a graphite with wine-red and leaf-shaped buttons, and a black with gold. None was preferred over the current look, which stays the base for the admin (step 2) and the cards (step 3). Ideas liked from the proposals may be tried inside this concept in those steps, but the tokens above do not change.

Built by [MUPP-001](specs/MUPP-001-design/solution.md).

[Wiki](wiki/index.md)
