# Log

## 2026-10-30

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
