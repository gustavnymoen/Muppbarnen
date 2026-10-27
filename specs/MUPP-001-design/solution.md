---
type: Solution
title: "MUPP-001 Design: solution"
description: How the look of Muppbarnen is built as tokens, shared components and a style guide page, and the decisions behind it.
feature: MUPP-001
card: "#9"
depends_on: [TECH-001]
---

# MUPP-001 Design: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 9`. The values are in [DESIGN.md](../../DESIGN.md) and the structure in [Design system](../../wiki/system/design.md).

## Data

None. No tables or migrations change.

## Interface

- **Tokens** in `app/globals.css` (`@theme`), the page background, `lang="sv"` and the fonts in `app/layout.tsx` (R1, R2).
- **Components** in `app/components/`: `Page`, `PageContent`, `Heading`, `Card`, `Button`, `IconButton`, `Chip`, `Avatar` and `colors.ts` (the child colour class names). `lib/child-colors.ts` has `childColor` (R6).
- **`/design`** (`app/design/page.tsx`), in Swedish, with made-up children and an inline SVG as the picture (R8).
- **`npm run dev:https`** runs `next dev --experimental-https` after the same database step as `npm run dev` (R9). [Testing on a phone](../../wiki/system/phone-testing.md) tells how to use it and the Vercel previews.
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **The look was revised on a phone, before the tests.** The card was written with a night-indigo palette, thick edges and hard shadows. In the browser it felt simple and loud, so it became a darker blue-grey, 1 px edges, layered shadows, soft text, muted child colours and a periwinkle main button (red reads as "cancel"). The card was updated first, as the workflow says.
- **Child colours are toned down with `color-mix` against the card** (CSS classes `.chip-child`, `.ring-child`, `.card-highlight` in `globals.css`, fed by a `--child` variable), not with a second set of tokens. One set of six colours, and the unit test calculates the contrast of the mixed result.
- **A highlighted card has a 2 px edge, not 1.5 px.** The card first said 1.5 px, but a browser rounds a border to whole device pixels and the test saw 1 px; 2 px is the same on every screen.
- **Fonts through `next/font/google`.** Next downloads and self-hosts them at build time, so no request goes to Google when a page is viewed, and a fallback font with matching metrics is generated, which limits layout jumps. Two families, four weights in all (Fredoka 500 and 600, Nunito 400 and 700); the card said three weights, and the extra one is the bold of running text.
- **The shell does not scroll the page.** `Page` is `h-dvh` with `overflow-hidden`, and `PageContent` is the scrolling region. The shell is wide (72 rem) on desktop, since the card asks for a wide site there although 90 % of visits are on phones.
- **The test build can keep an old stylesheet.** After a change to `globals.css`, `.next-test` is deleted before `npm run test:local` (noted in [Design system](../../wiki/system/design.md)).
- **`mkcert` is not installed on this computer,** so `npm run dev:https` was added but could not be run here; see [Verification](verification.md).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md), [Testing on a phone](../../wiki/system/phone-testing.md), [Titta på sajten på telefonen](../../wiki/manual/telefon.md).

[Specifications](../index.md)
