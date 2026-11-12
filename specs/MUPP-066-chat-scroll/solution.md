---
type: Solution
title: "MUPP-066 Chat scroll with the keyboard up: solution"
description: "How a drag in the chat card behaves while the phone keyboard is up: the keyboard lowers when the list is dragged and the page behind never moves."
feature: MUPP-066
card: "#223"
depends_on: [MUPP-065]
---

# MUPP-066 Chat scroll with the keyboard up: solution

What is built and why is in the card: `gh issue view 223`.

## Data

None.

## Interface

In the visual viewport effect of `Chat` (`app/secret-santa/min-sida/ChatButton.tsx`) the card gets a non-passive `touchmove` listener, removed with the other listeners. With the keyboard up (the same test as the fit): a drag on the message field is left alone, a drag in the message list blurs the field (the keyboard goes down), and any other drag is cancelled with `preventDefault`. The message list has `overscroll-contain` so a drag past its end does not scroll the page behind. No texts change.

## Decisions

- **Why it hopped:** with the keyboard up iOS scrolls the visual viewport when a drag chains out of the list or starts outside it; the card follows `offsetTop` on each scroll event, so the card and the page behind moved together. Cancelling those drags and stopping the chaining removes the cause; the follow logic of MUPP-065 stays for the moment iOS moves the viewport by itself when the field gets focus.
- **Keyboard down instead of scrolling behind it:** the user's choice (like iMessage). The whole conversation is then readable, and the card returns to full size.
- **Limit:** in a short conversation the list does not scroll, so a drag in it is not cancelled; the blur still lowers the keyboard, so nothing is left behind it.
- **Test:** the browser test dispatches `touchmove` events with the faked visual viewport; the real gesture is the manual check on a phone.

## Related

- [Verification](verification.md), [Review](review.md), [flow.mmd](flow.mmd); built on [MUPP-065](../MUPP-065-chat-keyboard/solution.md). Documentation: [Secret Santa chat](../../wiki/system/secret-santa-chat.md).

[Specifications](../index.md)
