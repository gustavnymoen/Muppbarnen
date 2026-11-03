---
type: Solution
title: "TECH-013 Birthday card hierarchy and small phones: solution"
description: "How the closed single-kid card lets the name lead, keeps the picture round and fits at 320 × 568, how the arrows clear a three-kid card, and how FitName grows back."
feature: TECH-013
card: "#96"
depends_on: [MUPP-004, MUPP-013, MUPP-014, MUPP-020, MUPP-030]
---

# TECH-013 Birthday card hierarchy and small phones: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 96`.

## Data

None.

## Interface

No texts change. All of it is in `app/components/BirthdayDeck.tsx` and `app/components/FitName.tsx`:

- `DeckCardView`: the date heading (`h2`) is `text-xl` on the closed card with one kid (`single && !openKid`), below the name's `text-3xl` (R1). The cards with several kids and Christmas Eve keep `text-3xl` (R7). On a phone 600 px high or lower the closed card with one kid has `py-6` instead of `pt-8 pb-8` (R3).
- `NextMark`: under 23rem the chip's text is `text-sm` with `px-3` and `gap-1.5`, and it never wraps, so "✦ Nästa födelsedag ✦" is one line (171 px in the 176 px a 320 px card has) (R2).
- `KidFace` (closed): the picture is in a box that takes the height left in the column (`flex-1 basis-0`), from 72 to 192 px (`min-h-18 max-h-48`). The box is a size container (`container-type: size`) and the `Avatar` is `100cqmin`, the box's shortest side, so it is always round (R4). On a tall phone the box stops at 192 px and the column is centred as before. On a phone 600 px high or lower the column's gaps are `gap-1` and the name and "Storlekar" lose their `mt-2` (R3). `SOLO_AVATAR` (the `clamp` on the screen's height) is gone.
- The browse arrows are `left-0` / `right-0` instead of `left-2` / `right-2` under 23rem (R5): 16 px from the screen's edge at 320 px, 13 px clear of the buttons on the card instead of 5.
- `FitName`: its `ResizeObserver` watches `document.documentElement` as well as its own span (R6).

Measured at 320 × 568 (Chromium, Mac): the date 28 px high, the chip 30 px (was 58, on two lines), the picture 78 × 78 (was 96 × 69), and "Storlekar" ends 16 px above the wish list button (was 18 px under its top). At 375 × 667 everything below the chip is where it was; the picture is 129 × 129 (was 140 × 121, an oval).

## Decisions

- **The picture's size comes from the room, not the screen's height.** The old `clamp(96px, 100dvh - 527px, 192px)` guessed the room from the screen's height; it was too big at both 568 and 667 px, so the flex column squeezed the picture's height and left its width (the oval). A size container measures the room that is really left, and `cqmin` keeps width and height equal. `Avatar` is unchanged: it already takes a CSS length as `size`.
- **Less air on low phones, not a smaller picture alone.** At 320 × 568 the column was 90 px too tall. A one-line chip and a smaller date give 32 px and the 72 px floor 24 px more; the remaining ~20 px (plus margin for Linux fonts) come from `py-6` and smaller gaps, only at 600 px high or lower (an arbitrary `@media (max-height: 600px)` variant), so 375 × 667 is unchanged (R7).
- **The arrows only move under 23rem.** At 320 px the arrows were 5 px from the three-kid card's buttons; with a scroll bar or a wider font they would touch. 8 px closer to the edge gives 13 px. At 375 px and wider they are where they were.
- **`FitName` watches the screen, not its parent.** In the open kid view and on the cards with several kids the parent is as wide as the name (`min-w-0` in a centred flex row, `max-w-full` in a centred column), so the parent does not get wider either when the name has room to grow. The screen's size is what changes when the phone is turned; one more `observe` covers it.
- **The tests are a new test per phone size.** The card's test plan put the checks into the existing MUPP-014 design test, but there they took it to about 7 s, over the 5 s budget for one test. As their own test (one page load, three cards) they take about 2 s, and the MUPP-014 test is unchanged. `disjoint` and `inside` moved from that test to `tests/helpers.ts` so both tests use them.
- **Impeccable critique:** no must-fix; see [Verification](verification.md).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page](../../wiki/system/start-page.md), `DESIGN.md`, [Startsidan](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
