import type { ComponentProps, CSSProperties } from "react";
import type { ChildColor } from "@/lib/child-colors";
import type { Wish } from "@/lib/deck";


// Knappen som öppnar en önskelista: önskelistan är det viktigaste på sajten, så den är en tydlig knapp
// med "Önskelista" på första raden och "Visa mer" (eller "Dölj") på den andra. forKid hänger på
// barnets namn för skärmläsaren när flera barn står på samma kort.
export function WishButton({
  count,
  open,
  small,
  forKid,
  color,
  className = "",
  ...props
}: { count: number; color: ChildColor; open?: boolean; small?: boolean; forKid?: string } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      {...props}
      style={{ "--child": `var(--color-child-${color})` } as CSSProperties}
      className={`wish-button press inline-flex w-full flex-col items-center justify-center rounded-control leading-tight disabled:opacity-60 ${small ? "min-h-12 px-2 py-1" : "min-h-[4.5rem] py-3"} ${className}`}
    >
      <span className={`font-heading font-semibold ${small ? "text-base" : "text-xl"}`}>
        Önskelista
        {forKid && <span className="sr-only"> för {forKid}</span>}
      </span>
      <span className={small ? "text-sm" : ""}>
        {open ? "Dölj" : `Visa mer · ${count}`}
        {!small && <span aria-hidden="true">{open ? " ▴" : " ▾"}</span>}
      </span>
    </button>
  );
}

// Önskelistan på ett barnkort (MUPP-004-R7): knappen fäller ut listan med varje önskans rubrik.
// Listan scrollar inuti kortet. Är den öppen styr kortleken, som låser sig då (R9).
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
      {open && (
        <div id={id} tabIndex={0} aria-label="Önskelista" role="region" className="min-h-0 flex-1 overflow-y-auto rounded-control border border-edge bg-page/40 px-3 py-1">
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
        </div>
      )}
      <WishButton id={`${id}-knapp`} aria-expanded={open} aria-controls={id} count={wishes.length} color={color} open={open} onClick={onToggle} />
    </section>
  );
}
