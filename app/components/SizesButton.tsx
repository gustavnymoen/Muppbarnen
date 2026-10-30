"use client";

import { useId, useRef } from "react";
import type { DeckKid } from "@/lib/deck";
import { Button, IconButton } from "./Button";
import { Dialog } from "./Dialog";
import { MeasureIcon } from "./icons";

const ROWS = [
  ["clothes", "Kläder"],
  ["shoes", "Skor"],
  ["head", "Huvud"],
  ["gloves", "Handskar"],
] as const;

// Knappen som öppnar ett barns storlekar i en dialogruta (MUPP-014). Tre lägen:
// "text" är knappen "Storlekar" på kortet med ett barn, "icon" är ikonknappen bredvid önskelistknappen på kortet med flera barn
// (forKid hänger på barnets namn för skärmläsaren), och "corner" är samma ikonknapp uppe i hörnet av en öppen barnvy.
// Knappen finns även när inga storlekar är inlagda; rutan säger det då. Rutans text är vanlig text, aldrig HTML.
// <dialog> med showModal() håller tangentbordet kvar i rutan, stängs med Esc och ger fokus tillbaka till knappen.
export function SizesButton({ kid, mode, forKid, className = "" }: { kid: DeckKid; mode: "text" | "icon" | "corner"; forKid?: boolean; className?: string }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const rows = ROWS.filter(([key]) => kid.sizes[key] !== "");
  const open = () => dialog.current?.showModal();

  return (
    <>
      {mode === "text" ? (
        <Button variant="secondary" onClick={open} className={className}>
          <MeasureIcon />
          Storlekar
        </Button>
      ) : (
        <IconButton label={forKid ? `Storlekar för ${kid.name}` : "Storlekar"} onClick={open} className={className}>
          <MeasureIcon />
        </IconButton>
      )}
      <Dialog ref={dialog} aria-labelledby={`${id}-titel`}>
        {/* <dialog> centrerar sin text som standard; storlekarna ska stå vänsterställda */}
        <div className="space-y-4 text-left">
          <h2 id={`${id}-titel`} className="font-heading text-xl font-semibold break-words">
            Storlekar för {kid.name}
          </h2>
          {rows.length === 0 ? (
            <p>Inga storlekar inlagda än.</p>
          ) : (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
              {rows.map(([key, label]) => (
                <div key={key} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className="[overflow-wrap:anywhere]">{kid.sizes[key]}</dd>
                </div>
              ))}
            </dl>
          )}
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Stäng
          </Button>
        </div>
      </Dialog>
    </>
  );
}
