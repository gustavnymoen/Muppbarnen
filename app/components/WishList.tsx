import type { ComponentProps, CSSProperties } from "react";
import type { ChildColor } from "@/lib/child-colors";
import type { Wish } from "@/lib/deck";
import { Button } from "./Button";

// Knappen som öppnar en önskelista (utseende i globals.css): önskelistan är det viktigaste på sajten, så den är en tydlig knapp
// med "Önskelista" på första raden och "Visa mer" på den andra; den smala varianten (small)
// har en rad. forKid hänger på barnets namn för skärmläsaren när flera barn står på samma kort.
export function WishButton({
  count,
  small,
  forKid,
  color,
  className = "",
  ...props
}: { count: number; color: ChildColor; small?: boolean; forKid?: string } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      {...props}
      style={{ "--child": `var(--color-child-${color})` } as CSSProperties}
      className={`wish-button press inline-flex flex-col items-center justify-center rounded-control leading-tight disabled:opacity-60 ${small ? "min-h-11 px-2" : "min-h-[4.5rem] w-full py-3"} ${className}`}
    >
      {small ? (
        // Den smala knappen på kort med flera barn: en enda rad, med antalet efter namnet
        <span className="font-heading text-base font-semibold">
          Önskelista
          {forKid && <span className="sr-only"> för {forKid}</span>}
          <span className="font-normal"> · {count}</span>
        </span>
      ) : (
        <>
          <span className="font-heading text-xl font-semibold">Önskelista</span>
          <span>
            Visa mer · {count}
            <span aria-hidden="true"> ▾</span>
          </span>
        </>
      )}
    </button>
  );
}

// Önskelistan på ett barnkort (MUPP-004-R7): knappen fäller ut listan med varje önskans rubrik.
// Listan scrollar inuti kortet. Är den öppen styr kortleken, som låser sig då (R9); knappen byts då mot en
// liten Stäng som ligger kvar mitt i botten av listan (MUPP-013-R5).
// MUPP-005 bygger ut den här komponenten med detaljer, markering och paxning.
export function WishList({
  id,
  wishes,
  color,
  open,
  onToggle,
}: {
  id: string;
  wishes: Wish[];
  color: ChildColor;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`flex min-h-0 flex-col gap-3 ${open ? "flex-1" : ""}`}>
      {/* Platsen finns bara medan listan är öppen; den går att scrolla med tangentbordet */}
      {open ? (
        <div id={id} tabIndex={0} aria-label="Önskelista" role="region" className="wish-list flex min-h-0 flex-1 flex-col overflow-y-auto rounded-control border border-edge bg-page/40 px-3 py-1">
          {wishes.length === 0 ? (
            <p className="py-2 text-muted">Inga önskningar än.</p>
          ) : (
            <ul className="divide-y divide-edge">
              {wishes.map((wish) => (
                <li key={wish.id} className="py-2 break-words">
                  {wish.title}
                </li>
              ))}
            </ul>
          )}
          {/* Sitter kvar nere i mitten medan listan scrollar, så att den går att stänga var man än är i den; fokus hamnar här när listan öppnas */}
          <div className="sticky bottom-1 mt-auto flex justify-center pt-2">
            <Button id={`${id}-knapp`} variant="secondary" onClick={onToggle} className="px-4 text-sm">
              Stäng<span className="sr-only"> önskelistan</span>
            </Button>
          </div>
        </div>
      ) : (
        <WishButton id={`${id}-knapp`} aria-expanded={false} aria-controls={id} count={wishes.length} color={color} onClick={onToggle} />
      )}
    </section>
  );
}
