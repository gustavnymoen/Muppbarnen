import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { Heading } from "./Page";

// Ett smalt kort i adminen (MUPP-010-R1): en rad med miniatyr, namn och ikonknappar. Mer innehåll (en lista, en utfälld grupp)
// kommer som children, under raden. Raden är cirka 50 px hög.
export function SlimCard({
  thumb,
  title,
  note,
  level = 3,
  nowrap,
  actions,
  fold,
  children,
}: {
  thumb?: ReactNode;
  title: string;
  note?: ReactNode;
  level?: 2 | 3 | 4;
  // Namnet står på en rad och kortas med ellips i stället för att brytas mitt i ordet (MUPP-063-R1)
  nowrap?: boolean;
  actions: ReactNode;
  // Hela rubrikraden är en knapp som fäller kortet (MUPP-056); kortet som använder den håller själv reda på öppet/stängt
  fold?: { open: boolean; onToggle: () => void };
  children?: ReactNode;
}) {
  return (
    <article className="rounded-control border border-edge bg-card px-3 py-1.5">
      <div className="flex items-center gap-2">
        {thumb}
        {fold ? (
          <div className="min-w-0 flex-1">
            <Heading level={level} small>
              <button type="button" aria-expanded={fold.open} onClick={fold.onToggle} className="flex min-h-11 w-full items-center gap-2 text-left">
                <span className="min-w-0 flex-1 break-words">
                  {title}
                  {note && <span className="block text-sm font-normal leading-4 text-muted">{note}</span>}
                </span>
                <span aria-hidden className={`shrink-0 ${fold.open ? "[&_svg]:rotate-180" : ""}`}>
                  <ChevronDownIcon />
                </span>
              </button>
            </Heading>
          </div>
        ) : (
          <div className="min-w-0 flex-1 break-words">
            <Heading level={level} small>
              {/* truncate vinner över break-words på rutan runt */}
              {nowrap ? <span className="block truncate">{title}</span> : title}
            </Heading>
            {note && <span className="block text-sm leading-4 text-muted">{note}</span>}
          </div>
        )}
        <div className="flex shrink-0 gap-2">{actions}</div>
      </div>
      {children}
    </article>
  );
}
