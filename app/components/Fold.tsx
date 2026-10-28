"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, IconButton } from "./Button";

// Hopfällningen i adminen (MUPP-010-R3) på ett enda ställe: en grupp (FoldGroup) vet vilken
// panel som är öppen, så att högst en är det. Knapparna (FoldToggle, FoldButton) öppnar och
// stänger panelen (FoldPanel) med samma id. Formulär i en panel fäller ihop den när de sparats (Form.tsx).

type FoldState = {
  openId: string | null;
  toggle: (id: string, opener: HTMLElement) => void;
  // Stänger den öppna panelen; fokus går tillbaka till knappen som öppnade den
  close: () => void;
};

const FoldContext = createContext<FoldState | null>(null);

// Utanför en grupp finns ingen hopfällning (inloggningen), och då är det här null
export const useFold = () => useContext(FoldContext);

export function FoldGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  // close har alltid samma identitet, så att ett formulär kan lita på den i en effekt
  const close = useCallback(() => {
    setOpenId(null);
    opener.current?.focus();
  }, []);
  const value = useMemo<FoldState>(
    () => ({
      openId,
      toggle: (id, from) => {
        opener.current = from;
        setOpenId((current) => (current === id ? null : id));
      },
      close,
    }),
    [openId, close],
  );
  return <FoldContext value={value}>{children}</FoldContext>;
}

// Esc stänger den öppna panelen (den enda som kan vara öppen), utom när Esc gäller en dialog (ConfirmAction) inne i den
function useEscape() {
  const fold = useFold();
  return (event: KeyboardEvent) => {
    if (event.key === "Escape" && fold?.openId && !(event.target as HTMLElement).closest("dialog")) fold.close();
  };
}

function useToggle(id: string) {
  const fold = useFold();
  return {
    "aria-expanded": fold?.openId === id,
    "aria-controls": id,
    onClick: (event: React.MouseEvent<HTMLElement>) => fold?.toggle(id, event.currentTarget),
    onKeyDown: useEscape(),
  };
}

// Ikonknappen som öppnar och stänger panelen id ("Ändra Otis"). label är det knappen gäller.
export function FoldToggle({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <IconButton compact label={label} {...useToggle(id)}>
      {children}
    </IconButton>
  );
}

// Knappen med text ("Ny önskning") som öppnar och stänger panelen id
export function FoldButton({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <Button variant="secondary" aria-label={label === children ? undefined : label} {...useToggle(id)}>
      {children}
    </Button>
  );
}

// Panelen som knappen med samma id öppnar. Innehållet finns bara medan den är öppen, så att ett
// formulär börjar om varje gång. Esc stänger den, också medan fokus är på knappen.
export function FoldPanel({ id, children }: { id: string; children: ReactNode }) {
  const open = useFold()?.openId === id;
  return (
    <div id={id} hidden={!open} onKeyDown={useEscape()} className="mt-3 space-y-4">
      {open && children}
    </div>
  );
}
