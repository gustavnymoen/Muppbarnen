import type { ComponentProps } from "react";

// Den modala dialogrutan (<dialog> med showModal()) som ConfirmAction, paxa-fönstret och storleksfönstret delar:
// utseendet, och att tangenttryck och svep inuti den inte når kortleken bakom (Esc ska stänga rutan, inte önskelistan).
// onKeyDown och onPointerDown går inte att ersätta utifrån, för då slutar stoppet fungera. Rutan öppnas och stängs av den som äger ref:en.
export function Dialog({ className = "", ...props }: ComponentProps<"dialog">) {
  return (
    <dialog
      {...props}
      onKeyDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={`m-auto w-[min(92vw,28rem)] rounded-card border border-edge bg-card p-5 text-text shadow-card backdrop:bg-black/70 ${className}`}
    />
  );
}
