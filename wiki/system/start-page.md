---
type: Guide
title: Start page and menu
description: "How the start page, the shared header and the hamburger menu are built, and how the example cards in the carousel work until the real cards arrive."
resource: app/page.tsx
feature: MUPP-002
tags: [start-page, navigation, accessibility]
---

# Start page and menu

## Parts

| Part | Where | What |
|---|---|---|
| Header | `app/components/SiteHeader.tsx` | The site's name (a link to `/`) and the menu button, without a border. It is inside `Page`, outside the scrolling `PageContent`, so it stays in place. `<Page home>` makes the name the page's `h1`; other pages keep their own `h1`. |
| Menu | `app/components/SiteMenu.tsx` | A hamburger on every screen size. The button "Meny" has `aria-expanded`; the list is a `nav` with "Start" and "Admin", both links; "Admin" (to `/admin`, [Admin page](admin.md)) is last and in the muted text colour, and nothing else on the page points to it. |
| Carousel | `app/page.tsx`, `.carousel` in `app/globals.css` | Three made-up example cards in a row, in plain CSS scroll snapping; no script and no library. |

## How it behaves

- The menu closes with Escape, a choice, a click outside it, or Tab out of it. Escape and a choice return focus to the menu button.
- The row is a focusable group named "Barnens kort, exempel", so the arrow keys move it one card at a time. On a phone one card is shown and the next peeks in; from 640 px all three fit.
- With `prefers-reduced-motion` the row jumps instead of gliding.
- Exactly one example card is highlighted, as the design asks for lists of cards.
- The example cards are removed when the real cards come (MUPP-004 and MUPP-005).

## Tests

`tests/MUPP-002-start-page.spec.ts` (menu, keyboard, carousel, 320 px, axe) and the start-page look in `tests/design.spec.ts` ([Testing](testing.md)).

Built by [MUPP-002](../../specs/MUPP-002-start-page/solution.md); the Swedish version is [Startsidan och menyn](../manual/startsidan.md).

[System documentation](index.md)
