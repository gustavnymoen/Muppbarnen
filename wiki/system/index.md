# System documentation

## How we work

* [Way of working](way-of-working.md) - Specification-driven development in Muppbarnen: the roles, the steps for every card, technical tasks, how Claude and the user work together, code quality and languages.
* [Backlog on GitHub](backlog.md) - The GitHub Project board that holds the cards: columns, fields, IDs, the card template and the gh commands for working with it.
* [Git and GitHub](git-and-github.md) - Branches, commit messages, pull requests, branch protection on main and what must never be committed.
* [Documentation structure](documentation.md) - How the specs and the wiki are organised as Open Knowledge Format bundles: concepts, frontmatter, links, index and log files, and the check that keeps them true.
* [Setting up a new project](project-setup.md) - What the project kit contains, how to start a new project from it, the skills and tools used, and the pitfalls learned in Gurras Flyg.

## How the site is built and run

* [Architecture](architecture.md) - The parts of Muppbarnen and how they fit: framework, data, hosting and the databases per environment.
* [Pipeline](pipeline.md) - How a change goes from a branch to the live site: the GitHub workflows, Vercel's deploys, which checks run where, and the branch protection on main.
* [Security](security.md) - How security is handled: review points, /security-review, the CI scans, Dependabot, and the planned admin sign-in design.

## Quality

* [Testing](testing.md) - How Muppbarnen is tested: which kind of check verifies what, when it is written, where it runs, and the rules and time budgets for the tests.
* [Accessibility](accessibility.md) - How the site is kept at WCAG 2.2 level AA: the axe check in the tests, the manual checklist, and when a feature must go through it.
* [Code review](code-review.md) - Why and how every feature and technical task is reviewed before it is done, what the reviewer looks for and how strict the review is.

## Up

* [Wiki](../index.md) - Entry point to the system documentation, the manual and the specifications.
