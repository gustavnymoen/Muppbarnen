---
type: Solution
title: "MUPP-065 Chat field above the keyboard: solution"
description: "How the chat card is fitted to the visible part of the screen while the iPhone keyboard is up: data, interface and decisions and why."
feature: MUPP-065
card: "#220"
depends_on: [MUPP-043]
---

# MUPP-065 Chat field above the keyboard: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 220`.

## Data

None.

## Interface

`Chat` in `app/secret-santa/min-sida/ChatButton.tsx` has one more effect. While the card is open it listens to `window.visualViewport` (`resize` and `scroll`). When the visible part is more than 100 px shorter than `window.innerHeight` (the keyboard is up; the address bar folding in is less, and a pinch-zoom is counted away with `view.scale`), it sets inline `top` (viewport top + 8 px), `bottom: auto`, `margin-block: 0` and `height` (viewport height - 16 px, at most 75 % of the window) on the `<dialog>`. Otherwise the inline values are empty, so the card is `75dvh` and centred as before. When the card closes (the content, and so the effect, is removed) the listeners and the inline values go. No texts change.

## Decisions

- **Why the card did not shrink:** iOS Safari, in the browser and in a pinned home-screen app, does not resize the page for the keyboard. It covers the bottom of it and only the visual viewport gets smaller. `dvh` follows the layout viewport, so the card kept its height and the field at its bottom ended up under the keyboard.
- **Visual viewport in JavaScript, not `interactive-widget=resizes-content`:** the viewport meta option is not supported by iOS Safari, which is where the bug is. `Dialog` (shared by all cards) is not changed: other cards are short and are scrolled into view by it (MUPP-045).
- **Top anchored while the keyboard is up:** iOS scrolls the visual viewport when a field gets focus; the card follows `offsetTop`, so it stays inside what the user sees. The page behind may scroll; it does not matter, the card is modal.
- **The test fakes the visual viewport:** Playwright cannot open a real iOS keyboard, so the browser test replaces `window.visualViewport` with an object it can shrink and move. The real check is on a phone (see [verification.md](verification.md)).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa chat](../../wiki/system/secret-santa-chat.md). Changes MUPP-043's chat card ([solution](../MUPP-043-secret-santa-questions/solution.md)).

[Specifications](../index.md)
