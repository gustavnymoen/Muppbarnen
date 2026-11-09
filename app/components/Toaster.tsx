"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { calm } from "./transition";

// Meddelandet om att något sparades eller gick fel (MUPP-054): ett kort band överst på skärmen som glider ner uppifrån, i mitten,
// står kvar i 2 sekunder och tonar bort. Det ligger i webbläsarens översta lager (popover), så det syns också framför ett öppet kort,
// och det syns oavsett hur långt sidan är rullad. Bara för ögat (aria-hidden): skärmläsaren hör samma sak via kortets och formulärets egna
// statusrader, som den alltid gjort.
type Message = { id: number; text: string; error: boolean };

const SLIDE_MS = 300;
const VISIBLE_MS = 2000;
const FADE_MS = 300;

let show: ((message: Message) => void) | null = null;
let count = 0;

// Visar ett meddelande; ett nytt tar över det som visas. Gör ingenting om sidan inte har någon Toaster.
export function toast(text: string, error = false) {
  show?.({ id: ++count, text, error });
}

export function Toaster() {
  const el = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    show = setMessage;
    return () => {
      show = null;
      timers.current.forEach(window.clearTimeout);
    };
  }, []);

  // Visas på nytt varje gång: hidePopover + showPopover lägger det överst, också över ett kort som öppnats efter förra meddelandet
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || !message) return;
    timers.current.forEach(window.clearTimeout);
    node.getAnimations().forEach((animation) => animation.cancel());
    if (node.matches(":popover-open")) node.hidePopover();
    node.showPopover();
    const still = calm();
    if (!still) node.animate([{ transform: "translateY(-200%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: SLIDE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    const end = () => {
      node.hidePopover();
      setMessage(null);
    };
    timers.current = [
      window.setTimeout(() => {
        if (!still) node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: "forwards" });
      }, SLIDE_MS + VISIBLE_MS),
      window.setTimeout(end, SLIDE_MS + VISIBLE_MS + (still ? 0 : FADE_MS)),
    ];
  }, [message]);

  return (
    <div
      ref={el}
      popover="manual"
      aria-hidden="true"
      data-toast={message ? (message.error ? "error" : "saved") : undefined}
      className="pointer-events-none fixed inset-auto top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 mx-auto mt-0 mb-0 w-fit max-w-[calc(100vw-1.5rem)] overflow-visible border-0 bg-transparent p-0"
    >
      {message && <p className={`${message.error ? "toast-error" : "toast-saved"} rounded-control border px-4 py-3 text-sm font-bold text-text shadow-card break-words`}>{message.text}</p>}
    </div>
  );
}
