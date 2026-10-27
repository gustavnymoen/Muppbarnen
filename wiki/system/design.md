---
type: Guide
title: Design system
description: "How Muppbarnen looks and how the look is built: the tokens, the shared components, the style guide page /design and the rules for adding to them."
resource: app/components/
feature: MUPP-001
tags: [design, components, accessibility]
---

# Design system

A dark, muted, mobile-first look (about 90 % of visits come from phones), wide on desktop. The values of every token are in [DESIGN.md](../../DESIGN.md); this page is about how it is built.

## Parts

| Part | Where | What |
|---|---|---|
| Tokens | `app/globals.css` (`@theme`) | Colours, fonts, radii and shadows, used as Tailwind classes (`bg-card`, `text-muted`, `shadow-card`). No colour value is written anywhere else. |
| Fonts | `app/layout.tsx` | Fredoka (headings, names, buttons) and Nunito (text) through `next/font/google`: downloaded at build time and served from our own server, so no request goes to a font host. `font-display: swap` shows the fallback font right away. |
| Page shell | `app/components/Page.tsx` | `Page` fills the screen (`h-dvh`, safe areas), is at most 72 rem wide and centred, and does not scroll; `PageContent` is the one region that scrolls. `Heading` sets the type scale. |
| Card | `Card.tsx` | 1 px edge and a layered shadow. `highlight` gives a child's colour (toned down) on a 2 px edge and shadow; `pressable` makes it move into its shadow when pressed. |
| Buttons | `Button.tsx` | `Button` (primary in the brand colour, secondary), `IconButton` (needs a `label`, which is its accessible name). At least 44 × 44 px. |
| Chip, avatar | `Chip.tsx`, `Avatar.tsx` | Child colour toned down; the avatar shows a picture or the initial and always has the child's name as its accessible name. |
| Child colours | `lib/child-colors.ts` | `childColor(n)`: six colours, the same for the same number, never fails. The class names per colour are in `components/colors.ts`. |
| Style guide | `app/design/page.tsx` | `/design` shows every token and component, with made-up data. |

## Rules

- **Reuse before adding.** A page is built from these components; a second copy of a card or a button is a code-review finding. A new shared component is added to `app/components/` and shown on `/design`.
- **Colour has a purpose.** Only one card in a list is highlighted; a child colour is never a bright fill; red is not used for the main button.
- **Focus** is a 3 px ring in the brand colour on every control (`:focus-visible` in `globals.css`).
- **Motion** is a press and a short entrance (at most 300 ms, transform and opacity), and is dropped with `prefers-reduced-motion`.
- **A browser rounds a border** to whole device pixels; a thin edge on a phone is 1 px and the highlighted one is 2 px.

## Tests

Contrast and `DESIGN.md` against the tokens: `lib/design-tokens.test.ts`; child colours: `lib/child-colors.test.ts`; the look in the browser: `tests/design.spec.ts` ([Testing](testing.md)). After a change to a stylesheet, delete `.next-test` before `npm run test:local`, since the test build may keep the old stylesheet.

## Phone testing

See [Testing on a phone](phone-testing.md).

Built by [MUPP-001](../../specs/MUPP-001-design/solution.md).

[System documentation](index.md)
