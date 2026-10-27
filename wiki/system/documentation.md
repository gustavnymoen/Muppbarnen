---
type: Guide
title: Documentation structure
description: "How the specs and the wiki are organised as Open Knowledge Format bundles: concepts, frontmatter, links, index and log files, and the check that keeps them true."
resource: scripts/lint-docs.mjs
feature: TECH-004
tags: [documentation, okf, workflow]
---

# Documentation structure

The documentation follows the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) (OKF v0.2): a tree of markdown files on disk, one **concept** (one thing) per file, connected with ordinary markdown links. There is no search index; a person or an agent starts at [README.md](../../README.md) and follows links.

## Bundles

| Bundle | Holds | Language |
|---|---|---|
| [`specs/`](../../specs/index.md) | What is built and how: the product, its terms and rules, the feature list, and one folder per card with `solution.md`, `verification.md` and `review.md` | English |
| [`wiki/system/`](index.md) | How the site works: architecture, pipeline, testing, review, accessibility, security, the way of working | English |
| [`wiki/manual/`](../manual/index.md) | How to use the site | Swedish |

The card on the GitHub board holds the requirements while the work is open; `verification.md` keeps them as built ([Way of working](way-of-working.md)). `CLAUDE.md` is instructions to Claude, not knowledge about the site, and is not a concept. `README.md` (layout, getting started, conventions) and `PLAYBOOK.md` (links to the pages that carry the kit's way of working) are starting points, and `DESIGN.md` and `PRODUCT.md` (written by the design skills when the design arrives) hold the design and the product's voice.

## Concepts

Every markdown file except `index.md` and `log.md` is a concept with frontmatter:

```yaml
---
type: Guide
title: Short name
description: One sentence, reused in the index.
resource: the main file or folder it describes (leave out for an abstract concept)
feature: TECH-004
tags: [short, words]
---
```

| Field | Rule |
|---|---|
| `type` | Required by OKF. One of `Guide`, `Manual`, `Product`, `Terms`, `Rules`, `Feature list`, `Solution`, `Verification`, `Review` |
| `title`, `description` | Required by us. The description is one line and is what the index shows |
| `feature` | Required by us: the ID of the card the page was written or last changed for (`MUPP-007`, `TECH-004`) |
| `resource`, `tags` | Optional |

When did a page change? Git's history and `log.md` say; there is no timestamp field to keep up to date.

## Links

- A concept links to the concepts it depends on or explains, with relative markdown links (`[Testing](testing.md)`). The surrounding sentence says how they relate.
- A feature's `solution.md` links to the wiki pages it created or changed; each such wiki page links back to the feature's folder in `specs/`.
- Every page is reachable from `README.md` through links and index pages. Every folder in `specs/` is linked from a wiki page.
- One subject lives in one file. Other pages link to it instead of repeating it.

## Index and log

- `index.md` in each folder lists its entries as `* [Title](link) - description`. The bundle roots (`wiki/index.md`, `specs/index.md`) have the frontmatter `okf_version: "0.2"`; no other index has frontmatter.
- `log.md` (in `wiki/`) starts with a `#` title, then one `## YYYY-MM-DD` heading per day, newest first, and one bullet per finished card linking to its folder in `specs/`.

## The check

`npm run lint:docs` ([scripts/lint-docs.mjs](../../scripts/lint-docs.mjs)) checks all of the above and runs in CI as part of `check`: parseable frontmatter with the required fields, a valid `feature` ID, the structure of index and log files, links that resolve, pages reachable from `README.md`, and spec folders linked from the wiki. It does not check that a link to a folder has an `index.md` in it, or that a `#anchor` exists, and it catches the common unquoted-YAML mistakes (`: ` or ` #` in a value) but not every one (for example a value starting with `*` or `&`). Adding a `type` means changing the list above and `TYPES` in the script. It was added by [TECH-004](../../specs/TECH-004-okf-documentation/solution.md).

[System documentation](index.md)
