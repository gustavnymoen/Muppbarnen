"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SlimCard } from "@/app/components/SlimCard";

// Sant medan sidan först ritas: en grupp som dyker upp efteråt är nyskapad och ska vara öppen (MUPP-056-R5)
const FirstRender = createContext({ current: true });

export function EventFoldList({ children }: { children: ReactNode }) {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return (
    <FirstRender value={first}>
      <ul className="space-y-2">{children}</ul>
    </FirstRender>
  );
}

// En grupp som kort (MUPP-056): ett kort som fälls ut och in. Utan fällning (en enda grupp) är det öppet och rubriken en vanlig rubrik.
// Öppet eller stängt sparas bara i kortet, så det består när sidan ritas om efter en ändring och glöms vid nästa besök.
export function EventFold({ title, note, actions, foldable, startsOpen, children }: { title: string; note: string; actions: ReactNode; foldable: boolean; startsOpen: boolean; children: ReactNode }) {
  const first = useContext(FirstRender);
  const [open, setOpen] = useState(startsOpen || !first.current);
  if (!foldable) return <SlimCard title={title} note={note} actions={actions}>{children}</SlimCard>;
  return (
    <SlimCard title={title} note={note} actions={actions} fold={{ open, onToggle: () => setOpen(!open) }}>
      {open && children}
    </SlimCard>
  );
}
