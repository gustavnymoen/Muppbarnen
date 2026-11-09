"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";

// Knappen som öppnar ett formulär som ett kort (MUPP-045): kortet växer ur knappen, har ett kryss och fokus i första fältet (Dialog.tsx).
// Knappen är en ikonknapp (icon, med text på bred skärm om text finns) eller en knapp med text. label är det knappen gäller för skärmläsaren ("Ändra Otis"), title rubriken på kortet.
export function FormCard({ title, label, icon, text, children }: { title: string; label: string; icon?: ReactNode; text?: string; children: ReactNode }) {
  const card = useRef<DialogHandle>(null);
  const open = (event: MouseEvent<HTMLElement>) => card.current?.open(event.currentTarget);
  return (
    <>
      {icon ? (
        <IconButton compact label={label} text={text} onClick={open}>
          {icon}
        </IconButton>
      ) : (
        <Button variant="secondary" aria-label={label === text ? undefined : label} onClick={open}>
          {text}
        </Button>
      )}
      <Dialog ref={card} form title={title}>
        {children}
      </Dialog>
    </>
  );
}
