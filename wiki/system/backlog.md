---
type: Guide
title: Backlog on GitHub
description: "The GitHub Project board that holds the cards: columns, fields, IDs, the card template and the gh commands for working with it."
resource: .github/ISSUE_TEMPLATE/card.md
feature: TECH-004
tags: [workflow, board, github]
---

# Backlog on GitHub

The backlog is a **GitHub Project** (board) in the user's account, linked to the repository: <https://github.com/users/gustavnymoen/projects/3>. The cards are issues. How a card is worked is in [Way of working](way-of-working.md).

- **Columns** (the field Status): **Backlog**, **Specified**, **Ongoing**, **Review**, **Done**. The order of the cards in Backlog is the priority: the top card is next.
- **Fields:** **Work type** (single select: Feature, Fix, Tech) and **Area** (single select: Startsida, Önskelista, Barnkort, Tidslinje, Administration, Shared).
- **IDs:** a card gets its ID when it is created and the ID starts its title: `MUPP-001 Short name` for Feature and Fix, `TECH-001 Short name` for Tech. Requirements are `<ID>-R1`, `<ID>-R2`, …
- **Template:** `.github/ISSUE_TEMPLATE/card.md`: a short explanation, then Goal, Background, Users, Scope (in and out), Requirements with acceptance criteria, Test plan (unit tests, browser tests, smoke test, accessibility, security, code review), Non-functional requirements and Open questions.
- **The board's built-in workflows** (Project → Workflows): "Item closed" and "Pull request merged" set Status to Done, so a merged pull request with "Closes #<card>" moves its card.
- **With the GitHub CLI** (`gh`, signed in with the `project` scope: `gh auth refresh -s project`):
  - read a card: `gh issue view <number>`
  - create one: `gh issue create --title "MUPP-012 …" --body-file <file>`, then `gh project item-add <project number> --owner <user> --url <issue url>`
  - the field and option ids: `gh project field-list <project number> --owner <user> --format json`
  - move a card or set a field: `gh project item-edit --project-id <id> --id <item id> --field-id <field id> --single-select-option-id <option id>`
  - put a card first: GraphQL `updateProjectV2ItemPosition` without `afterId`.

The issue number (`#16`) and the ID (`MUPP-011`) differ; the ID is what specs, branches, tests and commits use.

[System documentation](index.md)
