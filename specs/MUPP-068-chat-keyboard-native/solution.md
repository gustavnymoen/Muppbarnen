---
type: Solution
title: "MUPP-068 Chat keyboard handled by iOS: solution"
description: "How the chat card avoids opening the phone keyboard by itself and leaves the keyboard handling to iOS, and why the scripted fit of MUPP-065 and MUPP-066 was removed."
feature: MUPP-068
card: "#229"
depends_on: [MUPP-043, MUPP-065, MUPP-066]
---

# MUPP-068 Chat keyboard handled by iOS: solution

What is built and why is in the card: `gh issue view 229`.

## Data

None.

## Interface

- `Dialog` (`app/components/Dialog.tsx`) has a new prop `noAutofocus`: a form card with it does not put focus in its first field when it opens. The chat card (`ChatButton.tsx`) sets it; all other cards are unchanged.
- The `visualViewport` effect and the `touchmove` handling of MUPP-065 and MUPP-066 are removed from `Chat`. The card is `75dvh` and centred, with no inline style. The message list keeps `overscroll-contain`.
- The list scrolls to its end when the messages change, once at once and once in the next animation frame (R3).

## Decisions

- **Why the script was dropped:** on the user's iPhone (Safari, pinned app, Chrome) it made the card jump, squeeze to half height and stay that way after the keyboard closed. iOS moves the visual viewport itself and sends resize events with intermediate heights while the keyboard animates; a script that sizes the card from them cannot be made reliable without a real device to try on.
- **No automatic keyboard:** the first problem (MUPP-065) came when the keyboard opened by itself at the moment the card opened, before iOS had placed the card. A tap on the field is a normal user gesture, and iOS then brings the field into view, as it does on any page. The user suggested this fallback.
- **Newest message in view:** iOS Safari measures the list height after the card is drawn, so scrolling only once left the list a little above its end; the second scroll in the next frame fixes it.
- **Not checked on a phone:** Playwright cannot show a real keyboard; the test covers focus, the absence of inline style and the scroll position.

## Related

- [Verification](verification.md), [Review](review.md), [flow.mmd](flow.mmd). Replaces the scripted parts of [MUPP-065](../MUPP-065-chat-keyboard/solution.md) and [MUPP-066](../MUPP-066-chat-scroll/solution.md). Documentation: [Secret Santa chat](../../wiki/system/secret-santa-chat.md).

[Specifications](../index.md)
