---
type: Solution
title: "MUPP-014 Expose kids sizes on kids card: solution"
description: "How a child's sizes reach the start page deck and are shown in a dialog from the single-kid card, the multi-kid card and every open kid view."
feature: MUPP-014
card: "#43"
depends_on: [MUPP-004, MUPP-005, MUPP-010, MUPP-013]
---

# MUPP-014 Expose kids sizes on kids card: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 43`.

## Data

No migration. The four sizes already live in `child` (`size_clothes`, `size_shoes`, `size_head`, `size_gloves`, MUPP-010). `listDeckInput` in `lib/family.ts` now passes them on (`DeckInput.sizes`, type `Sizes` in `lib/deck.ts`), and `buildDeck` copies them, trimmed, to every `DeckKid.sizes`. Nothing else about the child is added: the birthdate and the day still stay on the server. The sizes are sent to every visitor with the site password, as the wishes are. No new route or server action, so no `guardWrite()`.

## Interface

- `app/components/SizesButton.tsx` (client): one component with three modes. `text` is the "Storlekar" button (secondary button with `MeasureIcon`) on the single-kid card; `icon` is the icon-only button named "Storlekar för {name}" beside the wish button on the multi-kid card; `corner` is the icon-only button named "Storlekar" in the top right corner of an open kid view. It owns a `<dialog>` opened with `showModal()`: heading "Storlekar för {name}", a description list with one row per size that has a value (Kläder, Skor, Huvud, Handskar), or "Inga storlekar inlagda än.", and a "Stäng" button. Values are React text, wrap with `overflow-wrap: anywhere`.
- `app/components/Dialog.tsx`: the `<dialog>` look and behaviour shared by `ConfirmAction`, the claim dialog and the sizes dialog. It stops keydown and pointerdown from bubbling to the deck, so Esc closes only the dialog and not the open wish list behind it (the deck closes the list on Esc).
- `app/components/BirthdayDeck.tsx`: `KidFace` shows the "Storlekar" button under the age when the list is folded; the multi-kid row is a flex row (`max-w-48`) with the wish button growing and the 44 px icon beside it (wish button about 72-75 % of the pair); `DeckCardView` puts the corner icon in every open kid view (`openKid`), absolutely positioned top right.
- Texts (Swedish): "Storlekar", "Storlekar för {name}", "Kläder", "Skor", "Huvud", "Handskar", "Inga storlekar inlagda än.", "Stäng".

## Decisions

- **One component, three modes, instead of three buttons.** They share the dialog, the icon and the name logic; only the button differs.
- **The dialog is shared, not copied.** The three dialogs only differ in content; `Dialog` holds the classes and the event stopping. Fixing Esc there also fixes the same latent problem of the claim dialog.
- **The one-kid picture shrinks with the height** (`SOLO_AVATAR`: 96 px at 568 px high up to 192 px, as `TWIN_AVATAR` does for the multi-kid card) so the new button fits without scroll at 320 × 568.
- **On a phone narrower than 23 rem the month in an open kid view is smaller** (`text-xl`), so the corner icon (and the back button of MUPP-015 on the other side) fits beside it.
- **Text centring.** `<dialog>` centres its text by default; the sizes content is `text-left`.
- **Esc test, not an Esc handler.** The focus return to the opening button is the browser's own behaviour for `showModal()`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md) (system), [Startsidan och menyn](../../wiki/manual/startsidan.md) (manual).

[Specifications](../index.md)
