"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";
import { PlusIcon } from "./icons";

// Knappen som öppnar ett formulär som ett kort (MUPP-045): kortet växer ur knappen, har ett kryss och fokus i första fältet (Dialog.tsx).
// Knappen är en ikonknapp (icon), en rund plusknapp (add, MUPP-053: en ny rad i en lista eller ram) eller en knapp med text (ett nytt objekt på översta nivån).
// big: ikonknappen är 44 px i stället för 32 px (en knapp i en utfälld rad, MUPP-070). label är det knappen gäller för skärmläsaren ("Ändra Otis"), title rubriken på kortet.
export function FormCard({ title, label, icon, add, big, text, onClose, children }: { title: string; label: string; icon?: ReactNode; add?: boolean; big?: boolean; text?: string; onClose?: () => void; children: ReactNode }) {
  const card = useRef<DialogHandle>(null);
  const open = (event: MouseEvent<HTMLElement>) => card.current?.open(event.currentTarget);
  return (
    <>
      {add ? (
        <IconButton round label={label} onClick={open}>
          <PlusIcon />
        </IconButton>
      ) : icon ? (
        <IconButton compact={!big} label={label} text={text} onClick={open}>
          {icon}
        </IconButton>
      ) : (
        <Button variant="secondary" aria-label={label === text ? undefined : label} onClick={open}>
          {text}
        </Button>
      )}
      <Dialog ref={card} form title={title} onClose={onClose}>
        {children}
      </Dialog>
    </>
  );
}

// Raden längst ner i en lista eller ram där plusknappen (och eventuella andra knappar) står
export function AddRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>;
}
