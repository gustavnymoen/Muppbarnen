"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./Button";

const item = "press flex min-h-11 w-full items-center rounded-control px-3 text-left font-heading font-medium hover:bg-edge";

// Hamburgermenyn: en riktig knapp som öppnar en lista. "Admin" är sist och i dämpad färg:
// länken ska finnas men inte dra uppmärksamhet.
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Stänger och lämnar fokus på menyknappen, så att tangentbordsanvändaren inte tappar bort sig
  function close() {
    setOpen(false);
    button.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    // Ett klick utanför stänger menyn; fokus är då redan där användaren klickade
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) close();
      }}
      // Tab ut ur menyn stänger den, så att den inte ligger kvar över sidan. Utan känt
      // nästa mål (Safari ger inget fokus vid klick) stänger bara klicket utanför.
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (open && next && !root.current?.contains(next)) setOpen(false);
      }}
    >
      <IconButton ref={button} label="Meny" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </IconButton>
      {open && (
        <nav id="site-menu" aria-label="Huvudmeny" className="enter absolute right-0 top-full z-10 mt-2 w-48 rounded-card border border-edge bg-card p-2 shadow-card">
          <ul className="space-y-1">
            <li>
              <Link href="/" className={item} onClick={close}>
                Start
              </Link>
            </li>
            <li>
              <Link href="/admin" className={`${item} text-muted hover:text-text`} onClick={close}>
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
