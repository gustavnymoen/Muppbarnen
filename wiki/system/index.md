# System documentation

## How we work

* [Way of working](way-of-working.md) - Specification-driven development in Muppbarnen: the roles, the steps for every card, technical tasks, how Claude and the user work together, code quality and languages.
* [Backlog on GitHub](backlog.md) - The GitHub Project board that holds the cards: columns, fields, IDs, the card template and the gh commands for working with it.
* [Git and GitHub](git-and-github.md) - Branches, commit messages, pull requests, branch protection on main and what must never be committed.
* [Documentation structure](documentation.md) - How the specs and the wiki are organised as Open Knowledge Format bundles: concepts, frontmatter, links, index and log files, and the check that keeps them true.
* [Setting up a new project](project-setup.md) - What the project kit contains, how to start a new project from it, the skills and tools used, and the pitfalls learned in Gurras Flyg.

## How the site is built and run

* [Architecture](architecture.md) - The parts of Muppbarnen and how they fit: framework, data, hosting and the databases per environment.
* [Design system](design.md) - How Muppbarnen looks and how the look is built: the tokens, the shared components, the style guide page /design and the rules for adding to them.
* [Start page and menu](start-page.md) - How the start page, the shared header and the hamburger menu are built, and the birthday deck of cards.
* [Form cards](form-cards.md) - How every dialog and form is one card that grows out of its button: the shared Dialog, focus on open, Enter between fields, the confirmation after a new wish and the announcement after a save.
* [Site password](site-password.md) - How the whole site is put behind one shared password: the proxy, the signed cookie, the attempt limit, the settings, the private picture store and how the tests get past it.
* [Secret Santa entrance](secret-santa-entrance.md) - How visitors get into Secret Santa: the menu entry, event and name choice, the sign-in with phone or email, the signed cookie and the rules that keep contact details private.
* [Secret Santa event status](secret-santa-status.md) - How an event's status (inactive, preparing, started) is stored, changed and enforced: who may change it, what each status allows, and what members see.
* [Secret Santa yearly cleanup](secret-santa-cleanup.md) - How the yearly cleanup works: the daily cron route and its secret, the once-a-year rule, what is deleted and what stays, and how sign-ins end.
* [Secret Santa draw](secret-santa-draw.md) - How the draw works: the rules and their fallback order, the draw table that is both result and history, start and stop, the mails and what keeps the result secret.
* [Secret Santa chat](secret-santa-chat.md) - How a giver and their receiver chat without the receiver learning who the giver is, the unread notice and the message mails collected over ten minutes.
* [Secret Santa match and change mails](secret-santa-match.md) - How a member sees the person they drew and that person's list, why nobody sees their own giver, the hourly change mails sent by a scheduled job, and the button that nags a match for a list.
* [Secret Santa wish list](secret-santa-wish-list.md) - How a Secret Santa member's own wish list works: one list per member, the form and limits shared with the kids' lists, and the owner check on the server.
* [Mail](mail.md) - How the site sends mail: sendMail with a shared layout, the provider call behind RESEND_API_KEY, and the outbox file that development and tests use instead.
* [Admin page](admin.md) - How the admin page is built: the admin sign-in and cookie, choosing who you are, the pages for parents and the master admin, the rules per kid, the tables and the private pictures.
* [Testing on a phone](phone-testing.md) - How to look at the site on a real phone over HTTPS: the Vercel preview of a pull request, and npm run dev:https locally.
* [Pipeline](pipeline.md) - How a change goes from a branch to the live site: the GitHub workflows, Vercel's deploys, which checks run where, and the branch protection on main.
* [Security](security.md) - How security is handled: review points, /security-review, the CI scans, Dependabot, the site password, the hardening rules and the admin sign-in.

## Quality

* [Testing](testing.md) - How Muppbarnen is tested: which kind of check verifies what, when it is written, where it runs, and the rules and time budgets for the tests.
* [Accessibility](accessibility.md) - How the site is kept at WCAG 2.2 level AA: the axe check in the tests, the manual checklist, and when a feature must go through it.
* [Code review](code-review.md) - Why and how every feature and technical task is reviewed before it is done, what the reviewer looks for and how strict the review is.

## Up

* [Wiki](../index.md) - Entry point to the system documentation, the manual and the specifications.
