---
type: Solution
title: "MUPP-002 Start page: solution"
description: How the header, the hamburger menu and the carousel of example cards are built, and the decisions behind them.
feature: MUPP-002
card: "#8"
depends_on: [MUPP-001]
---

# MUPP-002 Start page: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 8`.

## Data

None. No tables or migrations change.

## Interface

- **Header** (`app/components/SiteHeader.tsx`): the site's name "Muppbarnens önskelistor" (a link to `/`) on the left and the menu on the right, without a border. It sits inside `Page` (`app/components/Page.tsx`) but outside `PageContent`, so every page that uses the shell gets it and it stays in place while only the content region scrolls (R1). `<Page home>` makes the name the page's `h1`; other pages leave it a plain paragraph and keep their own `h1`.
- **Menu** (`app/components/SiteMenu.tsx`, a client component, the only script of the page): an `IconButton` named "Meny" with `aria-expanded` and `aria-controls`, and a `nav` ("Huvudmeny") with "Start" (a `Link`) and "Admin" (a plain button that only closes the menu). Escape, a choice and a click outside close it; Escape and a choice put focus back on the button; Tab out of the menu closes it (R2).
- **Start page** (`app/page.tsx`): a `div role="group"` named "Barnens kort, exempel" with `tabIndex={0}`, holding three `Card as="article"` with made-up children (Alma, Otto, Vera), an `Avatar`, the name as `h2`, a line of text and the chip "Exempel". Otto's card is the one highlighted (R3).
- **Carousel look** (`.carousel` in `app/globals.css`): CSS scroll snapping (`scroll-snap-type: x mandatory`, each card `scroll-snap-align: start`), smooth scrolling, and `scroll-behavior: auto` with reduced motion. A card is 85 % of the width on a phone so the next one peeks in, and a third of the row from 640 px, so all three show on a desktop (R3).
- **Name and title:** "Muppbarnens önskelistor" in the page title (`app/layout.tsx`); the style guide's title follows it.
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **The header lives in `Page`, not in the root layout.** The shell is what fixes the header while the content scrolls (the page itself never scrolls), so putting the header in the shell gives R1 without sticky positioning. The price is that every page must use `Page`, which the design system already asks for.
- **A carousel without script.** CSS scroll snapping gives swiping, the pointer and the arrow keys for free, and a scrollable region that can take focus (`tabIndex={0}`) is what makes the keyboard work and what axe asks for. No carousel library.
- **"Admin" is a button, not a link,** so that it does not promise a page that does not exist; MUPP-003 makes it a link.
- **The menu is not a `role="menu"`.** It is a disclosure: a button that shows a `nav` with a list of links. `role="menu"` would ask for arrow-key handling and promise a desktop-menu behaviour that the plain list does not need.
- **`IconButton` takes a `ref`** (React 19 passes it as a prop), so the menu can return focus to its button.
- **The example cards are temporary.** MUPP-004 and MUPP-005 replace them with the real cards.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Design system](../../wiki/system/design.md), [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
