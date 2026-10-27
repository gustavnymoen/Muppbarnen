---
type: Verification
title: "MUPP-001 Design: verification"
description: How each requirement of Design was checked, the test suite before and after, and the requirements as built.
feature: MUPP-001
---

# Verification of MUPP-001

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-001-R1 | Unit tests `MUPP-001-R1 …` in `lib/design-tokens.test.ts` (contrast of text, muted, brand, chips, rings, edges and buttons calculated from the tokens in `app/globals.css`; `DESIGN.md` lists every token with the value in the code) | local, CI | Pass | 2026-10-27 |
| MUPP-001-R2 | Browser test `MUPP-001-R2 R3 R4 R5 R8 …` in `tests/design.spec.ts` (Fredoka and Nunito in use, running text at least 16 px, no request to another host). `font-display: swap` and the fallback font are `next/font`'s settings, read in code review; layout jump not measured | local, CI | Pass; swap and layout jump by code review only | 2026-10-27 |
| MUPP-001-R3 | Same test (1 px edge, layered shadow, highlighted card with a toned-down edge of at least 3:1, only one highlighted) and test `MUPP-001-R3 R7 …` (a pressed card gets a transform and another shadow, nothing moves with reduced motion) | local, CI | Pass | 2026-10-27 |
| MUPP-001-R4 | Same test (the focus ring and shadows not clipped by the content region, every button at least 44 × 44 px, 3 px focus ring in the brand colour with at least 3:1, avatar names and initial in Fredoka, picture avatar, chip text). Hover is not checked | local, CI | Pass; hover not checked | 2026-10-27 |
| MUPP-001-R5 | Same test at 390 × 844 and 320 × 568 (page does not scroll, content region does, no sideways scroll) and test `MUPP-001-R5 R8 …` at 1280 px (frame wider than 1000 px, at most 1152 px, centred). A phone with a notch: **not checked** (no device); the safe-area padding is read in code review | local, CI | Pass; notch not checked | 2026-10-27 |
| MUPP-001-R6 | Unit tests `MUPP-001-R6 …` in `lib/child-colors.test.ts` | local, CI | Pass | 2026-10-27 |
| MUPP-001-R7 | Test `MUPP-001-R3 R7 …` (entrance at most 300 ms with only transform and opacity; no animation and no transform with reduced motion) | local, CI | Pass | 2026-10-27 |
| MUPP-001-R8 | Tests `MUPP-001-R2 R3 R4 R5 R8 …` and `MUPP-001-R5 R8 …` (one `h1`, headings in order, axe at phone, 320 px and desktop width). That the page shows everything and only made-up data: read in code review | local, CI | Pass | 2026-10-27 |
| MUPP-001-R9 | Preview over HTTPS on a phone: **not checked yet** (needs the pull request). `npm run dev:https`: the script is added but **not run**, since mkcert is not installed on this computer. `Strict-Transport-Security` on production: **not checked** | - | Not checked | - |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/design-tokens.test.ts` (6 tests) and `lib/child-colors.test.ts` (3 tests) | local, CI | Pass | 2026-10-27 |
| Browser tests | `tests/design.spec.ts`, 3 tests: phone and 320 px, desktop, motion | local, CI | Pass | 2026-10-27 |
| Smoke test | Not applicable: `/design` is not a main page or flow; the existing smoke test still passes | local | Pass | 2026-10-27 |
| Accessibility | axe on `/design` at three widths. The checklist on the live site (keyboard, VoiceOver, 200 % zoom, text spacing, contrast of borders and focus ring by hand, target sizes, reduced motion): **not done yet**, after the deploy | local | axe pass; checklist not done | 2026-10-27 |
| Security | `/security-review` not needed: no sign-in, admin, API, database or personal data | - | n/a | 2026-10-27 |
| Code review | [review.md](review.md) | local | See review.md | 2026-10-27 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in [Testing](../../wiki/system/testing.md)).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 15 unit + 3 browser | 0.5 s | 0.3 s |
| After | 24 unit + 6 browser | 2.4 s (unit 0.0 s) | 0.9 s |

The browser time grew because the three new tests load `/design` and run axe on it; every test is well under the 5 s budget and the total under 180 s. The growth is the new feature's tests, not slow existing ones.

## Definition of Done

- [ ] Tests: every check in the card's test plan is done (the manual R9 check and the live checklist are not)
- [x] Test suite: within the time budgets; the new tests follow the quality rules (combined by journey, no fixed waits)
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet
- [ ] Accessibility: axe passes; the checklist on the live site is not done yet
- [ ] Requirements in the card match what was built, no open questions left; copied below as built (after the last change)
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [ ] No leftovers: `.claude/launch.json` (temporary) removed before commit
- [x] Clean code: `npm run lint`, `npm run typecheck` pass (`npm run build` runs inside `npm run test:local`)
- [x] Code review done, no must-fix findings left (run 1 stopped with one, fixed; run 2 passed); see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none)

## Requirements as built

Copied from the card (as revised during the build).

### MUPP-001-R1 Dark colour tokens

The site shall define its colours once, as design tokens, and use only those.

Tokens: page background `#0C1015`, card `#141920`, card edge `#272E39`, shadow `#05080D`, text `#C8D0DC` (soft, not white), muted text `#8591A4`, brand `#9AA9E0` (muted periwinkle, with `#0C1015` text on it), and six toned-down child colours: coral `#D4958B`, sun `#D4B873`, mint `#82BD9F`, sky `#82AAD0`, lilac `#A698D0`, pink `#CD96B8`. The values may be adjusted during the build to meet R2, and `DESIGN.md` is then updated.

Acceptance criteria:

- **Given** the tokens, **when** their contrast is calculated, **then** text and muted text on the page background and on the card are at least 4.5:1, and the text on the brand colour, and each child colour as text on its chip tint (the colour at 16 % over the card), is at least 4.5:1.
- **Given** a child colour, **when** it is used as a ring or border (toned down: at 65 % for the ring and 60 % for the highlight edge, over the card), **then** it is at least 3:1 against the card.
- **Given** a button or icon button, **when** it is shown, **then** it is recognised by its fill, or by its border in the muted colour, at least 3:1 against what is behind it, never by the card-edge colour alone.
- **Given** `DESIGN.md`, **when** it is read, **then** it lists every token with its value and use, and matches the tokens in the code.

### MUPP-001-R2 Typography

The site shall use Fredoka for headings, names and buttons and Nunito for running text, loaded from our own server (no request to a font service when a page is viewed), with `lang="sv"` and a fallback font.

Acceptance criteria:

- **Given** a page, **when** it loads, **then** no request goes to a font host, and headings render in Fredoka and text in Nunito.
- **Given** running text, **when** measured, **then** it is at least 16 px.
- **Given** the fonts have not loaded yet, **then** text is shown in the fallback font right away (no invisible text) and the layout does not jump more than needed.

### MUPP-001-R3 Card

The site shall have a shared card with a 1 px edge in the card-edge colour, rounded corners and a layered shadow (a short hard offset, a near and a soft far shadow, and a faint light top edge). A highlighted card instead has a 2 px edge in the child's colour (toned down) and a hard shadow part in the same tone.

Acceptance criteria:

- **Given** a normal card, **when** rendered, **then** it has the 1 px edge and the layered shadow above.
- **Given** a highlighted card for a child, **when** rendered, **then** its edge and shadow are in that child's colour (toned down), and it is the only coloured card in a list where only one is highlighted.
- **Given** a card that is a link or button, **when** it is pressed, **then** it moves into its shadow (the shadow shrinks as the card moves); with reduced motion it only changes colour.

### MUPP-001-R4 Controls

The site shall have a button (primary in the brand colour, secondary neutral), an icon button, a chip and an avatar, each with hover, pressed, focus and disabled states where they apply.

Acceptance criteria:

- **Given** any button or icon button, **when** measured, **then** its touch target is at least 44 × 44 px.
- **Given** keyboard focus on any control, **then** a focus ring of at least 3:1 contrast is visible and not hidden by other content.
- **Given** an avatar with no picture, **then** it shows the child's initial in the heading font, and with a picture it shows the picture; both have a ring in the child's colour and an accessible name.
- **Given** a chip, **then** it is shown as the child's colour on a faint tint of the same colour with a thin edge, and it always has text (never a colour alone).

### MUPP-001-R5 Mobile-first page shell

The site shall have a page shell that fills the screen (`dvh`, with safe areas for notches), where the page itself does not scroll and only regions inside cards scroll, and that works from 320 px up.

Acceptance criteria:

- **Given** a screen from 320 × 568 to 430 × 932 px, **when** the shell holds more content than fits, **then** the page does not scroll and only the content region does.
- **Given** a width of 320 px, **then** there is no sideways scrolling.
- **Given** a desktop width, **then** the content sits in a wide centred frame (at most 72 rem) and the style guide uses several columns, with the same look.
- **Given** a phone with a notch or home bar, **then** content is not hidden behind it.

### MUPP-001-R6 Child colours

The site shall give each child one of the six child colours through a single function, which always returns the same colour for the same child and never fails.

Acceptance criteria:

- **Given** the same child number, **when** asked twice, **then** the colour is the same.
- **Given** child numbers 0 to 5, **then** six different colours are returned; with a larger number the colours repeat in order.
- **Given** any number (including negative or very large), **then** a colour is always returned.

### MUPP-001-R7 Motion

The site shall use motion only for small feedback (press, a short entrance of cards) and drop the movement under reduced motion.

Acceptance criteria:

- **Given** reduced motion is on, **when** a card is pressed or enters, **then** nothing moves or slides; only colours may change.
- **Given** reduced motion is off, **then** a motion takes at most 300 ms and uses only transform and opacity.

### MUPP-001-R8 Style guide page

The site shall have a page `/design`, in Swedish, that shows every token and every component in every state at phone width, so the look can be judged in one place.

Acceptance criteria:

- **Given** `/design`, **when** opened, **then** it shows the colours, the type scale, the card (normal and highlighted), buttons, icon button, chip, avatar (with and without picture), and the page shell example.
- **Given** `/design`, **then** it passes axe and has one `h1` and a sensible heading order.
- **Given** `/design`, **then** it contains only made-up data (no real names or pictures).

### MUPP-001-R9 HTTPS for phone testing

The site shall be testable on a phone over HTTPS without a browser warning.

Acceptance criteria:

- **Given** a pull request, **when** its Vercel preview is opened on the phone, **then** it loads over HTTPS with a valid certificate, and `wiki/system/` and `wiki/manual/` tell how to open it (including the sign-in Vercel asks for on previews).
- **Given** `npm run dev:https`, **when** it is run, **then** the app is served on `https://localhost:3000` with a certificate trusted on the computer (mkcert), and the local database setup still runs first as for `npm run dev`.
- **Given** the production address, **then** it keeps sending `Strict-Transport-Security` (already true; checked, not built).

Note for the wiki: a phone does not trust the local certificate unless the mkcert root certificate is installed on it. The simple route for the phone is the Vercel preview; `dev:https` is for the computer, and for the phone only with that extra step (documented as optional).

## Notes

- The look was revised twice on a phone-sized browser before the tests were written; the card was updated first (see [Solution](solution.md)).
- The browser tests can use an old stylesheet if `.next-test` is not deleted after a change to `globals.css`.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
