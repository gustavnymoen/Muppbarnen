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
| `--color-child-coral` | `#D4958B` | Child colour 1 |
| `--color-child-sun` | `#D4B873` | Child colour 2 |
| `--color-child-mint` | `#82BD9F` | Child colour 3 |
| `--color-child-sky` | `#82AAD0` | Child colour 4 |
| `--color-child-lilac` | `#A698D0` | Child colour 5 |
| `--color-child-pink` | `#CD96B8` | Child colour 6 |

A child's colour is only used toned down, mixed with the card colour: the ring of an avatar (65 %), the edge of a highlighted card (60 %), and a chip (the colour as text on a tint of 16 %, with an edge of 35 %). It is never a bright fill. Only one card in a list, the one that matters most now, is highlighted.

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

Motion is only small feedback (a press, a card fading in) of at most 300 ms, with transform and opacity only. With reduced motion nothing moves; a pressed control only gets darker.

## Child colours

`childColor(n)` in `lib/child-colors.ts` gives child number `n` one of the six colours in the order above; the same number always gives the same colour, numbers wrap around, and any number (also negative or very large) gives a colour.

## Layout

The page shell (`Page`, `PageContent`) fills the screen (`dvh`, with safe areas), the page itself does not scroll and only the content region does. It is a frame of at most 72 rem, centred, with side padding of 1 rem (2 rem from 640 px). Controls are at least 44 × 44 px.

Built by [MUPP-001](specs/MUPP-001-design/solution.md).

[Wiki](wiki/index.md)
