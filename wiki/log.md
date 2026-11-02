# Log

## 2026-11-02

* **Fix** [MUPP-027 Info button without a frame](../specs/MUPP-027-info-button-no-frame/solution.md): the (i) button in a wish row is the icon alone, with a round `edge` tint while hovered or pressed (`IconButton` `frameless`).
* **Fix** [MUPP-023](../specs/MUPP-023-long-wish-titles/solution.md) (follow-up): the arrow of a wish row keeps its size beside a long title (icons are `shrink-0`).
* **Fix** [MUPP-023 Long wish titles wrap](../specs/MUPP-023-long-wish-titles/solution.md): a long wish title, also one long word, wraps inside its row and in the claim dialog, shows at most two lines with an ellipsis (the whole title when the row is opened) and gets smaller text over 24 characters.
* **Fix** [MUPP-025 Close animation visible on iPhone](../specs/MUPP-025-ios-close-animation/solution.md): the closing copy moves in 300 ms and fades only after 40 % of it, so it is seen on a phone; a WebKit test (`npm run test:webkit`, outside the normal suite) checks it.
* **Fix** [MUPP-024 Pictures are cached by the browser](../specs/MUPP-024-picture-cache/solution.md): picture addresses carry a version (`?v=`) and are kept privately for a year, so the small pictures are not fetched again each time a view closes; a replaced picture has a new address.
* **Fix** [MUPP-022 Close animation glitch and focus ring on phone](../specs/MUPP-022-close-animation-glitch/solution.md): closing a kid's view shrinks the whole view (scaled and fading, transform and opacity only) instead of a cut-out that stuttered on a phone, the copy is always removed, and no focus ring is left on the tile after a close with a finger or mouse.
* **Fix** [MUPP-021 Browse forward with a list open](../specs/MUPP-021-browse-focus-scroll/solution.md): going to the next card with a list open no longer scrolls the deck sideways (the focus is moved with `preventScroll`).
* **Creation** [MUPP-017 Browse kids with the wish list open](../specs/MUPP-017-browse-with-open-list/solution.md): the arrow buttons and keys work with a wish list open (next card, or next kid within a card with several kids and on Christmas Eve), and Tillbaka is a return icon.
* **Creation** [MUPP-016 Wish list open transition](../specs/MUPP-016-wishlist-open-transition/solution.md): the wish list slides up on a card with one kid, and the kid's view grows out of the pressed button or tile on cards with several kids and on Christmas Eve; closing runs the same movement backwards (a ghost copy moves while the real view is already closed), and nothing moves with reduced motion.
* **Creation** [MUPP-019 Wish row: info button, labels and order](../specs/MUPP-019-unlimited-gifts-explained-and-sorted/solution.md): a gift that can be bought several times has an info button with the explanation, the list is ordered claimable, unlimited, claimed, the description is labelled "Beskrivning:", and "Paxad" is orange.
* **Creation** [TECH-012 Shrink uploaded pictures](../specs/TECH-012-shrink-pictures/solution.md): a kid's picture is decoded with `sharp` when it is uploaded, turned upright, shrunk to at most 256 px and stored as WebP without metadata, so the start page loads small pictures; a broken file gives the same error message as before, and pictures stored earlier still work.
* **Creation** [MUPP-018 Description max length](../specs/MUPP-018-description-max-length/solution.md): the description of a wish is at most 100 characters, in the form and on the server.

## 2026-11-01

* **Creation** [TECH-011 Ponytail audit and tidy-up](../specs/TECH-011-ponytail-audit/solution.md): the ponytail audit of the repository ([report](../specs/TECH-011-ponytail-audit/audit.md)) and its fixes: the unit tests no longer pick up other checkouts under `.claude/`, pictures are answered with an `ETag` and `304`, two unused database helpers and the unused `export` keywords are gone, and the wish row mapping and the `ÅÅÅÅ-MM-DD` date text each live in one place. Shrinking the pictures became [TECH-012](https://github.com/gustavnymoen/Muppbarnen/issues/63).

## 2026-10-30

* **Creation** [MUPP-015 Back button on kids card](../specs/MUPP-015-back-button/solution.md): an open kid view on a card with several kids or on Christmas Eve has a "Tillbaka" button in the top left corner that does what "Stäng" does; the heading gets a row of its own below the two corner buttons.
* **Creation** [TECH-009 Settled boxes in the feature tests](../specs/TECH-009-settled-boxes-in-feature-tests/solution.md): the feature tests of the start page, the birthday card, the admin and the parent picker read every box with `settledBox`, as the design tests do, and boxes that are compared are read together.
* **Creation** [MUPP-014 Expose kids sizes on kids card](../specs/MUPP-014-kid-sizes/solution.md): visitors can open a child's sizes in a dialog from a "Storlekar" button on the single-kid card, an icon beside "Önskelista" on the multi-kid card and an icon in the top right corner of every open kid view; the dialog markup is shared by the three dialogs of the site.
* **Creation** [TECH-008 Flaky box measurements](../specs/TECH-008-flaky-box-measurements/solution.md): the design tests read every box with `settledBox`, which waits until the element is visible and its box has stopped changing, so a read during an animation or a re-render no longer fails a pull request.
* **Creation** [MUPP-005 Kid card and claiming gifts](../specs/MUPP-005-kid-card-and-claiming/solution.md): the wish list has rows with marks ("Paxad", "Kan köpas flera gånger"), details that unfold, checkboxes and a "Paxa" button with a dialog that claims gifts in the visitor's name through a checked server action; the wish list button has no "Visa mer" and no number, a card with one kid folds with an arrow, a card with several kids and Christmas Eve with "Stäng" (R6–R8).

## 2026-10-29

* **Creation** [MUPP-013 Multi-kid birthday card fixes](../specs/MUPP-013-multi-kid-card-fixes/solution.md): the kids on a shared birthday card are spread over the card with a clearer line, a name always stays on one line (smaller, down to 12 px, then "…"), the "next" mark is yellow, and an open wish list swaps its button for a small sticky "Stäng".
* **Creation** [TECH-007 Flaky admin tests](../specs/TECH-007-flaky-admin-tests/solution.md): the list picker no longer lets a resting mouse pointer override the keyboard (its active option follows pointer moves, not pointer entry), and the admin test waits for the saved kid before axe runs.
* **Creation** [MUPP-012 Parent picker in mobile mode](../specs/MUPP-012-parent-picker-mobile/solution.md): the parent is chosen in the site's own accessible list under the field (a select-only combobox) instead of the browser's pop-up, which opened in the corner in mobile mode.
* **Creation** [MUPP-011 Future birthdate](../specs/MUPP-011-future-birthdate/solution.md): a birthdate can be up to ten months ahead, and a child who is not born yet is shown as "Beräknad {månad}" without an age until the day; a born child never gets age 0.

## 2026-10-29

* **Creation** [TECH-006 Design skills and a design pass](../specs/TECH-006-design-skills/solution.md): the design skills (Impeccable, taste, Emil Kowalski) are part of the workflow with `PRODUCT.md`; the look stays (step 1), the admin gets narrow lists and text beside icons on wide screens (step 2), and the cards get filled wish buttons, bigger pictures and a divider for kids sharing a birthday, Christmas tiles and a rolling wish list (step 3); the site name is no longer shown as a heading.

## 2026-10-28

* **Creation** [MUPP-004 Birthday card](../specs/MUPP-004-birthday-card/solution.md): the start page shows a deck of birthday cards (and Christmas Eve), nearest first, browsed by swipe, buttons and arrow keys, with a compact wish list that locks the deck while open; the example cards are gone and the day of birth never reaches the browser.

* **Creation** [MUPP-010 Compact admin](../specs/MUPP-010-compact-admin/solution.md): the admin pages are slim cards that fold open one at a time, with icon buttons (pencil, trash can, picture, list) instead of large buttons, the sizes as a card of their own, and removal of a kid's picture.

* **Creation** [MUPP-003 Admin page](../specs/MUPP-003-admin-page/solution.md): the admin page behind a second password, where parents fill in sizes and wish lists and the master admin manages kids, parents and private pictures; the first tables (parent, child, wishlist, wishlist item) and `/bilder/<child id>`.

* **Creation** [TECH-005 Security hardening](../specs/TECH-005-security-hardening/solution.md): a test that every route and server action checks the sign-in, a request limit for writes, a 20-minute block after repeated wrong passwords, a Content-Security-Policy and `__Host-` cookies, and the rules written into the specs and the code review.

## 2026-10-27

* **Creation** [MUPP-009 Site password](../specs/MUPP-009-site-password/solution.md): the whole site is behind one shared password with a signed cookie, a password page, `proxy.ts`, a limit of 5 attempts per 15 minutes, and tests that sign in once.

* **Creation** [MUPP-002 Start page](../specs/MUPP-002-start-page/solution.md): the shared header with the site name, a hamburger menu, and a swipeable row of three example cards.

* **Creation** [MUPP-001 Design](../specs/MUPP-001-design/solution.md): a dark, muted, mobile-first look as tokens and shared components, the style guide page `/design`, and `npm run dev:https`.

* **Creation** [TECH-004 OKF documentation](../specs/TECH-004-okf-documentation/solution.md): the specs and the wiki follow the Open Knowledge Format and are checked by `npm run lint:docs`; `PLAYBOOK.md` is split into wiki pages.

## 2026-10-26

* **Creation** [TECH-003 Pipeline and branch protection](../specs/TECH-003-pipeline-and-branch-protection/solution.md): `main` is protected (pull requests with green checks only, also for the owner), and the first pull request runs the whole pipeline.
* **Creation** [TECH-002 Repository and hosting](../specs/TECH-002-repository-and-hosting/solution.md): the code is on GitHub, Vercel publishes `main` to muppbarnen.vercel.app, Turso databases for production and preview, Vercel Blob store.
* **Creation** [TECH-001 Project setup](../specs/TECH-001-project-setup/solution.md): Next.js project with the database, tests and documentation, running locally.
