---
type: Solution
title: "MUPP-045 Form cards with focus and Enter: solution"
description: "How the shared card is built: one Dialog that grows out of its button, the form behaviour (focus, Enter, confirmation, announcement), what was removed, and the decisions and why."
feature: MUPP-045
card: "#143"
depends_on: [MUPP-016, MUPP-029, MUPP-037]
---

# MUPP-045 Form cards with focus and Enter: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 143`.

## Data

None. No migration, no server action added or changed: every form calls the same action as before (`hasSiteSession()`, the admin check and `guardWrite()` unchanged).

## Interface

- **One card, `app/components/Dialog.tsx`** (R1). It owns the `<dialog>`, opens it with `showModal()`, plays the motion from `transition.ts` and closes it. Its handle (`ref`) has `open(from)` and `close(announce?)`; a user of the card calls `card.current?.open(event.currentTarget)` from the click of the button. Props: `title` (the card's heading, which also names the dialog), `form` (a form card: a cross in the top right corner, placed at the top of the screen, focus in the first field, a tap on the dark area does nothing), `backdropClose` (a tap on the dark area closes it, the "Så funkar sajten" card, [MUPP-035](../MUPP-035-onboarding-card/solution.md)), `defaultOpen` (opens by itself the first time, with nothing to grow from) and `onClose`. The content (`children`) exists only while the card is open, so a form starts over every time.
  - **Open:** `open()` renders the content with `flushSync` and the layout effect calls `showModal()`, starts `growScale` (the card is moved and scaled from the button's box, as the wish list is) and, for a form card, focuses the first field, all before `open()` returns, so the focus is set in the press itself and not after the motion (iOS Safari shows the keyboard only then). Without a button to grow from (or a button that is gone) the card only fades in (`growFade`).
  - **Close:** the same function for the cross, Esc (`cancel`), "OK", "Avbryt" and a saved form: `makeGhost` copies the card, the real card is closed at once, focus goes to the button, and `shrinkTo` moves and scales the copy onto the button while the content fades first ([MUPP-037](../MUPP-037-close-motion-surface/solution.md)). The copy is removed by the animation's end, its cancel or the safety timer in `transition.ts`; a new open or close removes it first. Without a button the copy only fades (`fadeAway`) and focus goes to the heading of the section the card is in (`tabindex="-1"`), never the top of the page. With `prefers-reduced-motion` the helpers do nothing and no copy is made.
  - **Announcement:** `close(text)` puts the text in a `role="status"` paragraph (`sr-only`) next to the `<dialog>`, which is not inside the card (a closed card is `display: none`, where nothing is announced) and is emptied when the next card opens.
  - **Context:** content inside a card finds it with `useCard()` (`close`, `confirm` for the line at the top, `focusFirst`); it is `null` on a page.
- **`FormCard.tsx`:** the button (an icon button, an icon button with a text from 640 px, or a button with text) and the `Dialog` with `form`. Used wherever a form was a `Fold` panel: `app/admin/hantera/page.tsx` (new and edit parent, new and edit kid, the kid's picture, in `PictureCard`), `app/admin/barn/[id]/WishlistSection.tsx`, `app/admin/SantaTab.tsx`, `app/secret-santa/min-sida/WishLists.tsx` and, new, the kid's sizes in `app/admin/ChildCard.tsx`.
- **`Form.tsx`** (inside a card): `says` (what a screen reader hears when it is saved: a fixed text, or the name typed in a field, `{ field: "name", added: true }` → "Otis lades till") and `again` (a new wish: the card stays). Enter in a text, phone, e-mail, date or password field moves on and sends from the last (R5, `lib/form-card.ts` `enterAction`, which skips lists, checkboxes and files and leaves a text area alone and a word being composed alone); `enterkeyhint` says "next" or "done" on a phone; a failed save keeps the card and the typed values and focuses the first field with an error or the alert at the bottom (R7); a saved wish with `again` empties the fields (React resets the form), focuses the first field and shows "fotboll lades till" at the top for 3 seconds (`confirm`, R6). Outside a card (the password pages) it works as before, including "Sparat.".
- **`ListPicker.tsx`:** the list is drawn in the card's `<dialog>` when the field is in one (otherwise in `body`), so it is in front of the card (R8). Esc closes the list: the card ignores a `cancel` while a list is open.
- **`lib/form-card.ts`:** `shortTitle` (24 characters and an ellipsis over 25), `savedMessage` and `enterAction`, unit tested in `lib/form-card.test.ts`.
- **Question and information cards** use the same `Dialog` (`ConfirmAction`, "Ta bort paxningen", `CopyItem`, `SizesButton`, `OnboardingDialog`, the claim window): the buttons are as before, no cross, focus on the first button, so "Avbryt" and "Enter never removes anything" ([MUPP-006](../MUPP-006-unclaim-gifts/solution.md)). The claim window is a form card and lost its "Avbryt". "Så funkar sajten" opens from the menu button (`SiteMenu` passes it) and, the first time, with nothing to grow from.
- **Sizes:** `/admin` has a "Storlekar" button per kid (an `IconButton` with a text from 640 px, as the link had) that opens a card with the four fields; `app/admin/barn/[id]/storlekar/` and `Fold.tsx` are removed. The arkiv rows are opened by `ArchiveGroupCard.tsx`, a small button with `aria-expanded`, since the only other use of `FoldToggle` was an expander.
- **Page:** while a card is open the page behind does not scroll (`body:has(dialog:modal) main` in `globals.css`) and the backdrop fades in.
- **Texts (Swedish):** "Stäng" (the cross), "{namn} lades till", "{namn} sparades", "Storlekarna för {namn} sparades", "Bilden för {namn} sparades", "Personen lades till i {familj}".

## Decisions

- **One card with a handle, not state in every user.** The five `<dialog>` users and the form cards used to call `showModal()` themselves. Now `Dialog.tsx` is the only place; the others hold a `ref` and call `open(button)`. The handle is imperative on purpose: the press must open and focus synchronously, which a `useState(open)` in the parent would do a render later.
- **`flushSync` for the focus.** React flushes a click's update in a microtask, which is after the handler returns. `flushSync` inside `open()` makes the card appear, show and take focus before `open()` returns. WebKit (`tests/MUPP-045-form-cards.webkit.spec.ts`) checks that the active element is the field right after `click()`; that the keyboard comes up is checked by hand on a phone.
- **The content is mounted only while open**, as the fold panel's was (`{open && children}`): a form starts empty or with the current values, and the page has no hidden form fields (the tests' `getByLabel` finds one card's fields, not a hundred).
- **The confirmation is in the card, at the top.** The page cannot show anything in front of a modal card, and a phone's keyboard covers the bottom. It fades with a CSS transition the last 300 ms (not a Web Animation that lasts three seconds, which `pageAnimationsDone` in the tests would wait for); with reduced motion it just goes after 3 s. The two timers are cleared by the next save and by closing.
- **The hidden announcement is outside the card.** The same text is not shown to the eye ([MUPP-045-R7](https://github.com/gustavnymoen/Muppbarnen/issues/143)); a status inside a closed card is not read.
- **A new object after each save** in `Form`: the actions answer with the constant `saved`, so an effect on the state would see only the first save of a card that stays open.
- **Not changed:** the page forms (password pages, admin sign-in, the master admin, the Secret Santa sign-in) keep `Form` without a card; the card code is only active when `useCard()` is not `null`.
- **Not on `/design`:** the card needs a server action to show a working form, and it is used on six pages; the rule "shown on `/design`" ([Design system](../../wiki/system/design.md)) is met by the pages that use it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Form cards](../../wiki/system/form-cards.md), [Admin page](../../wiki/system/admin.md), [Design system](../../wiki/system/design.md), [Testing on a phone](../../wiki/system/phone-testing.md); for the visitor [Administration](../../wiki/manual/admin.md).
- The motion this builds on: [MUPP-016](../MUPP-016-wishlist-open-transition/solution.md), [MUPP-022](../MUPP-022-close-animation-glitch/solution.md), [MUPP-025](../MUPP-025-ios-close-animation/solution.md), [MUPP-029](../MUPP-029-single-kid-close-motion/solution.md), [MUPP-037](../MUPP-037-close-motion-surface/solution.md).

[Specifications](../index.md)
