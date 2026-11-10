---
type: Solution
title: "MUPP-056 Foldable groups in Secret Santa admin: solution"
description: "How the groups on the Secret Santa tab fold open and closed: which groups start open, and how the open state is kept."
feature: MUPP-056
card: "#173"
depends_on: [MUPP-048, MUPP-051, MUPP-053]
---

# MUPP-056 Foldable groups in Secret Santa admin: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 173`.

## Data

None.

## Interface

- `lib/santa-groups.ts`: `arrangeEvents(events, adminId)` is the one rule (a pure function, unit tested). It returns the groups in order with `foldable` and `open` for each: a single own group is open and has no fold (R1); own groups come first, open only when there is exactly one (R2, R3); the groups of other parents come last, ordered by the administrator's name and then the group's, always closed.
- `app/admin/EventFold.tsx` (client): `EventFold` is the card of one group and keeps its open state; `EventFoldList` is the list around the cards and tells them whether the page is still drawing for the first time.
- `app/components/SlimCard.tsx`: an optional `fold` (`open`, `controls`, `onToggle`) turns the title and the note into one button inside the heading (`<h3><button aria-expanded aria-controls>`), at least 44 px high, with an arrow that turns up when open. The heading stays a heading, so the cards are still found by their `h3`.
- `app/admin/SantaTab.tsx` builds the cards from `arrangeEvents`. The note of a card that folds says status, number of participants and, for another parent's group, "administreras av <name>"; a card without fold keeps "N deltagare" as before.

## Decisions

- **A closed card renders nothing of its content** (`open && <div>`), so nothing is focusable or readable by a screen reader (R4), without `inert` or `hidden`. The buttons to rename and remove the group stay in the header row, next to the header button, not inside it (a button cannot hold buttons).
- **The open state lives in the card's own `useState`**, so it survives the redraw that follows every server action (the component stays mounted) and is forgotten on a reload (R5). Nothing is stored.
- **A new group opens by itself:** `EventFoldList` holds a ref that is true while the page draws the first time and false after its first effect; a card that mounts later starts open. No ids to compare, no stored state.
- **The same component for both cases** (`foldable` false for one group), so a card that goes from one group to two keeps its state instead of being replaced.
- The existing tests that look for a group by its heading use `eventCard` in `tests/santa.ts`: the heading of a card that folds also holds the note, so the name is matched as the start of the heading.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin](../../wiki/system/admin.md), the manual [Admin](../../wiki/manual/admin.md).
