---
type: Guide
title: Accessibility
description: "How the site is kept at WCAG 2.2 level AA: the axe check in the tests, the manual checklist, and when a feature must go through it."
resource: tests/helpers.ts
feature: TECH-001
tags: [workflow, accessibility, wcag, quality]
---

# Accessibility

The site meets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA ([rules for all features](../../specs/rules.md)). It is checked in two ways, because tools find only part of the problems (roughly a third):

1. **Automatically, in the tests,** with axe.
2. **By hand,** with the checklist below, for what a tool can't judge: whether the keyboard order makes sense, whether a screen reader says the right thing, whether a message helps.

## The axe check

`expectNoA11yViolations(page)` in `tests/helpers.ts` runs [axe](https://github.com/dequelabs/axe-core) with the WCAG 2.0, 2.1 and 2.2 A and AA rules on the page as it is, and fails the test with the rule, its description and the elements. Call it once the state to check is visible, for example with a list open or an error shown. Something that is only decoration and hidden from screen readers can be left out with `.exclude(…)` in the helper, with a comment saying why.

Every page or state that a feature adds or changes gets one call, in that feature's tests. A state already checked by another feature's test is not checked again. Today these are checked:

| Page | States | Tests |
|---|---|---|
| `/design` | Phone width (and 320 px), desktop width | `tests/design.spec.ts` |
| … | (each feature adds a row for the pages and states it checks) | … |

## The manual checklist

| # | Check | WCAG | How |
|---|---|---|---|
| 1 | Everything works with the keyboard only, in a logical order, without getting stuck | 2.1.1, 2.1.2, 2.4.3 | Put the mouse away. Press Tab and Shift+Tab through the whole page, and use every control: Enter and Space on buttons, the arrow keys in lists and the carousel, Escape in lists and dialogs. The order follows the page from top to bottom, and focus never gets stuck. |
| 2 | Keyboard focus is always visible and not hidden behind other content | 2.4.7, 2.4.11 | While tabbing, every focused element has the focus ring, and no part of it is fully hidden by the header, a list or a dialog. |
| 3 | A screen reader (VoiceOver) reads headings, landmarks, field names, states and messages | 1.3.1, 2.4.6, 4.1.2, 4.1.3 | Turn on VoiceOver (Cmd+F5) in Safari. Move with VO+Right arrow, open the rotor (VO+U) for headings, landmarks and form controls. Every field says its name, a button its action, a switch or a fold-out its state, and messages (errors, "sparades") are read when they appear. |
| 4 | The page works at 200 % zoom, and at 320 px width without sideways scrolling | 1.4.4, 1.4.10 | Zoom to 200 % (Cmd+plus) in a 1280 px window, and make the window 320 px wide (or use the browser's device mode). Nothing is cut off or overlaps, and only tables may scroll sideways. |
| 5 | Text still fits with larger line, letter and word spacing | 1.4.12 | Apply the [text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html) (line height 1.5, paragraph spacing 2, letter spacing 0.12, word spacing 0.16 times the font size). No text is cut off or overlaps. |
| 6 | Text has a contrast of at least 4.5:1 (3:1 for large text); field borders, the focus ring and icons at least 3:1 | 1.4.3, 1.4.11 | axe checks text on plain backgrounds. Check by hand any text over photos and the parts axe doesn't measure: borders, the focus ring, icons. Compare the colour with the background behind it (the tokens in `DESIGN.md` give the values). |
| 7 | Buttons and other targets are at least 24 × 24 px | 2.5.8 | Measure the clickable area of small controls (icon buttons, checkboxes, arrows) in the browser's inspector. Smaller is fine only if there is 24 px of space around it. |
| 8 | Content shown on hover or focus (menus, tooltips) can be closed with Escape and stays while the pointer is over it | 1.4.13 | Open the menu or tooltip, press Escape: it closes, and focus stays in the field. Open it again and move the pointer over it: it stays open. |
| 9 | Errors are shown in text, say how to fix them, and every field has a visible label | 3.3.1, 3.3.2, 3.3.3 | Make every error the form can give. Each is in text next to the field, says what to do, and the field has a label that stays visible while typing. |
| 10 | Each page has a title and the language Swedish; images have alt text or are marked decorative | 2.4.2, 3.1.1, 1.1.1 | The tab shows a title that names the page; `<html lang="sv">`; every image has an `alt` that says what it shows, or `alt=""` if it is decoration. |
| 11 | Motion stops with reduced motion | 2.3.3 (AAA, done anyway) | Turn on Reduce motion (System Settings → Accessibility → Display). Nothing slides or moves; only colours change. |

## When a feature goes through the checklist

- **A feature that adds or changes what visitors or the administrator see** goes through the checklist on the pages it changed, on the live site after the deploy, and records each item per page in its `verification.md`, with the result and the date. Items the change can't affect are written as "not affected" with the reason, for example "no new images" for item 10.
- **A feature that changes nothing on the pages** (a technical task, a data import) skips it, and says so in its `verification.md`.
- Anything that fails level AA is fixed in the same feature. If it is in a page the feature didn't touch, it goes to the board as a fix.

[System documentation](index.md)
