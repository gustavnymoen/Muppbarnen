import type { ComponentProps } from "react";

// En av/på-knapp (MUPP-051): en knapp med role="switch", så att skärmläsaren säger "på" eller "av". Läget syns på två sätt, i
// reglagets läge (vänster eller höger) och i färgen. Knappen byter inget själv: den som använder den bestämmer vad ett tryck gör
// (här öppnas en fråga) och skickar in det nya läget när det är gjort. Minst 44 px hög.
export function SwitchButton({ label, checked, className = "", ...props }: Omit<ComponentProps<"button">, "role" | "children"> & { label: string; checked: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`press inline-flex min-h-11 items-center gap-3 rounded-control px-2 font-heading font-medium disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {label}
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full border border-muted/75 ${checked ? "bg-brand" : "bg-edge"}`}>
        <span className={`absolute left-px top-px size-5 rounded-full transition-transform motion-reduce:transition-none ${checked ? "translate-x-5 bg-page" : "bg-muted"}`} />
      </span>
    </button>
  );
}
