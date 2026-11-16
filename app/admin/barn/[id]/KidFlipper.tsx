"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { IconButton } from "@/app/components/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/icons";
import { neighbours } from "@/lib/kid-neighbours";

// Barnets önskelistor, ett barn i taget: pilarna och svepet byter barn utan att sidan laddas om, och nästa barn glider in (MUPP-085-R2).
// Alla förälderns barns sidor kommer med när sidan öppnas (serverns egen rendering), så nästa barn finns redan. Adressen följer barnet.
export type KidPanel = { id: number; node: ReactNode };

const SWIPE_DISTANCE = 50;
const pathOf = (id: number) => `/admin/barn/${id}/onskelistor`;

export function KidFlipper({ panels, firstId }: { panels: KidPanel[]; firstId: number }) {
  const ids = panels.map((panel) => panel.id);
  const [shown, setShown] = useState({ id: firstId, leaving: null as number | null, dir: 1 });
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  // popstate-lyssnaren sätts upp en gång och läser därför barnen ur en ref
  const idsRef = useRef(ids);
  useEffect(() => {
    idsRef.current = ids;
  });
  const focusAfter = useRef(false);

  // Byter barn direkt, utan att vänta på att Next hinner med adressen; det förra glider ut, utom med minskad rörelse.
  // Utan angiven riktning (bakåtknappen) går det åt det håll som barnen står i listan
  const show = (id: number, dir?: 1 | -1) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShown((now) => (now.id === id ? now : { id, leaving: still ? null : now.id, dir: dir ?? (idsRef.current.indexOf(id) > idsRef.current.indexOf(now.id) ? 1 : -1) }));
  };

  // Bakåtknappen och framåtknappen ändrar adressen: barnet följer den
  useEffect(() => {
    const follow = () => {
      const id = Number(/^\/admin\/barn\/(\d+)\/onskelistor/.exec(location.pathname)?.[1]);
      if (idsRef.current.includes(id)) show(id);
    };
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);

  useEffect(() => {
    if (!focusAfter.current) return;
    focusAfter.current = false;
    stage.current?.querySelector<HTMLElement>("[data-current] h1 > span")?.focus();
  }, [shown.id]);

  const around = neighbours(ids, shown.id);
  const go = (dir: 1 | -1) => {
    if (!around) return;
    const id = dir === 1 ? around.next : around.previous;
    focusAfter.current = true;
    window.history.pushState(null, "", pathOf(id) + window.location.search);
    show(id, dir);
  };

  // Svep åt sidan: inte när det börjar på en knapp eller ett fält, och sidan scrollar uppåt och neråt som vanligt (touch-pan-y)
  const onPointerDown = (event: PointerEvent) => {
    // Ett öppet kort ligger i sidans träd, så en rörelse i det får inte byta barn och ta bort det som är skrivet
    const onControl = (event.target as Element).closest("button, a, input, textarea, select, summary, label, dialog") || document.querySelector("dialog[open]");
    swipeStart.current = around && !onControl && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > 2 * Math.abs(event.clientY - start.y)) go(dx < 0 ? 1 : -1);
  };

  const panel = (id: number, className = "") => (
    <div key={id} data-kid={id} inert={className.includes("slide-out") || undefined} aria-hidden={className.includes("slide-out") || undefined} className={className} style={{ "--slide": `${shown.dir * 100}%` } as CSSProperties}>
      {panels.find((p) => p.id === id)!.node}
    </div>
  );

  return (
    <div className="rounded-card border border-edge bg-card/40 px-5 py-4">
      {around && <Arrows onGo={go} />}
      <div
        ref={stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        className="relative touch-pan-y overflow-x-clip"
      >
        {shown.leaving !== null && panel(shown.leaving, "slide-out pointer-events-none absolute inset-x-0 top-0")}
        <div key={shown.id} data-current className={shown.leaving !== null ? "slide-in" : ""} style={{ "--slide": `${shown.dir * 100}%` } as CSSProperties} onAnimationEnd={(event) => event.target === event.currentTarget && setShown((s) => ({ ...s, leaving: null }))}>
          {panels.find((p) => p.id === shown.id)!.node}
        </div>
      </div>
    </div>
  );
}

// Som pilarna på startsidans kortlek: mitt på höjden vid skärmens kanter, halvt över ramens kant. Ramen är lika bred som sidan och innehållet
// i den är smalare (px-5 + sidans 16 px): bara kortens kanter hamnar under pilarna, raderna (kortets 16 px luft in) går fria (R1).
// fixed: pilarna står kvar när sidan scrollar; en öppen ruta gör sidan inert, så de går då inte att nå
function Arrows({ onGo }: { onGo: (dir: 1 | -1) => void }) {
  return (
    <>
      <div className="fixed left-0 top-1/2 z-10 -translate-y-1/2">
        <IconButton label="Föregående barn" onClick={() => onGo(-1)}>
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <div className="fixed right-0 top-1/2 z-10 -translate-y-1/2">
        <IconButton label="Nästa barn" onClick={() => onGo(1)}>
          <ChevronRightIcon />
        </IconButton>
      </div>
    </>
  );
}
