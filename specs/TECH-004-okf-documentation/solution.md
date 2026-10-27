---
type: Solution
title: "TECH-004 OKF documentation: solution"
description: How the specs and the wiki were turned into Open Knowledge Format bundles, and how the lint check works.
feature: TECH-004
card: "#21"
depends_on: [TECH-003]
---

# TECH-004 OKF documentation: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 21`. The result is described in [Documentation structure](../../wiki/system/documentation.md); this page records how it was done and why.

## Data

None. No tables or migrations change.

## Interface

Visitors see no change. What changed is the documentation and one script:

- **`scripts/lint-docs.mjs`** exports `lintDocs(root)`, which returns a list of problems, and prints them when run as `npm run lint:docs` (R2, R3). CI runs it in the job `check`, right after `npm run lint` (R4). It checks the OKF conformance rules (parseable frontmatter, a non-empty `type`, the structure of `index.md` and `log.md`) and ours (`title`, `description` and a `feature` ID, a known `type`, links that resolve, pages reachable from `README.md`, spec folders linked from the wiki). The flow is in [flow.mmd](flow.mmd). Its unit tests are in `scripts/lint-docs.test.ts` and build small fixture folders in the temp folder.
- **Two bundles**, `wiki/` and `specs/`, each with an `index.md` that has `okf_version: "0.2"`. `wiki/log.md` follows OKF's log format.
- **`PLAYBOOK.md`** holds only links. Its content moved, not copied: the way of working, the backlog, Git and GitHub, security and the project setup became pages in `wiki/system/`; the parts that repeated `pipeline.md`, `testing.md`, `accessibility.md` and `code-review.md` were dropped; the architecture details were merged into `architecture.md`.
- **`specs/overview.md`** was split into `product.md`, `terms.md`, `rules.md` and `features.md`; its "How we work" paragraph became a link to the way-of-working page.
- **Frontmatter:** the fields are `type`, `title`, `description`, `feature` and optionally `resource` and `tags`. `timestamp` was dropped (OKF has no such field and git history shows when a page changed); `id` in the spec files became `feature`.

## Decisions

- **Relative links, not bundle-relative.** OKF recommends links from the bundle root (`/page.md`), but the two bundles link to each other and GitHub renders relative links, so relative ones work everywhere.
- **`type` is checked against a short list** even though OKF allows any text, so that agents can rely on the values. The list is in [Documentation structure](../../wiki/system/documentation.md); adding a type means changing it and `TYPES` in the script.
- **A small frontmatter parser instead of a YAML library.** The fields are flat lines and one-line lists; a dependency for that would be more to keep up than the 12 lines.
- **`CLAUDE.md` stays outside the bundles.** It is instructions to Claude, not knowledge about the site. `README.md` and `PLAYBOOK.md` are only starting points.
- **Historical records are not rewritten.** The old `verification.md` and `review.md` files of TECH-001 to TECH-003 still say `specs/overview.md` where that was true then.
- **`flow.mmd` files are not concepts.** They are linked from `solution.md` so that the links resolve, but they are not checked as pages.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Documentation structure](../../wiki/system/documentation.md), [Way of working](../../wiki/system/way-of-working.md), [Setting up a new project](../../wiki/system/project-setup.md).

[Specifications](../index.md)
