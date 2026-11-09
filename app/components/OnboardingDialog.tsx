"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { markOnboardingSeen } from "@/app/actions";
import { Button } from "./Button";
import { Dialog, useCard, type DialogHandle } from "./Dialog";
import { ChevronDownIcon } from "./icons";

// Rutan "Så funkar listorna" (MUPP-035): två flikar med korta texter. Texterna är fasta och godkända på kortet.
const TABS = [
  {
    id: "besokare",
    label: "Besökare",
    intro: "Här samlar vi barnens önskelistor och storlekar i ett försök att underlätta födelsedagar och jul!",
    parts: [
      ["Önskelistor", <>Hitta barnet och öppna önskelistan. Varje rad kan innehålla mer information, till exempel specifika storlekar och länkar. Du hittar barnets storlekar på kortet.</>],
      [
        "Paxa en present",
        <>
          Hittat något du vill köpa? Markera och tryck <b>Paxa</b> så att andra ser vad som är taget. <b>Paxad</b> betyder att någon redan ska köpa den. <b>Kan köpas flera gånger</b> betyder att flera kan ge den.
        </>,
      ],
      ["Ångrat dig eller klickat fel?", <>Tryck på den orangea pilen vid en paxad present, så blir den ledig igen. Ta bara bort din egen paxning.</>],
    ],
  },
  {
    id: "foralder",
    label: "Förälder",
    intro: "Som förälder fyller du i barnens storlekar och önskelistor.",
    parts: [
      [
        "Hitta dina barn",
        <>
          Gå till <b>Admin</b> i menyn, logga in med lösenordet och välj dig själv.
        </>,
      ],
      [
        "Vad du kan göra",
        <>
          För varje barn kan du fylla i storlekar och skriva önskelistorna, en för födelsedagen och en för julen. Välj <b>Obegränsad</b> om flera får ge samma sak.
        </>,
      ],
      ["Arkiverade", <>Här hittar du gamla önskningar som du kan lägga till igen.</>],
    ],
  },
] satisfies { id: string; label: string; intro: string; parts: [string, ReactNode][] }[];

// Öppnas av SiteMenu (ref) och, om autoOpen, av sig själv första gången. Varje sätt att stänga (OK, Esc, tryck utanför)
// minns att rutan är sedd. Rutan är ett kort (Dialog.tsx), och dess innehåll börjar om varje gång det öppnas.
export function OnboardingDialog({ ref, autoOpen }: { ref: Ref<DialogHandle>; autoOpen?: boolean }) {
  // defaultOpen gäller bara vid första visningen: när kakan sätts ritas sidan om med autoOpen av, och rutan ska inte öppnas igen
  return (
    <Dialog ref={ref} title="Så funkar listorna" backdropClose defaultOpen={autoOpen} className="max-h-[85dvh] flex-col open:flex" onClose={() => autoOpen && void markOnboardingSeen()}>
      <OnboardingTabs />
    </Dialog>
  );
}

function OnboardingTabs() {
  const id = useId();
  const card = useCard();
  const [tab, setTab] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  // Finns det mer text under det som syns? Då är knappen längst ner en pil (MUPP-036), annars OK
  const [more, setMore] = useState(false);

  function checkMore() {
    const el = panel.current;
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
  }

  // ResizeObserver ger besked när panelen får sin storlek (och vid vridning av telefonen)
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const observer = new ResizeObserver(checkMore);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // En ny flik börjar överst
  useEffect(() => {
    panel.current?.scrollTo(0, 0);
    checkMore();
  }, [tab]);

  function arrow(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (tab + step + TABS.length) % TABS.length;
    setTab(next);
    document.getElementById(`${id}-${TABS[next].id}`)?.focus();
  }

  const current = TABS[tab];
  return (
    <>
      <div role="tablist" aria-label="Läs som" className="flex gap-2" onKeyDown={arrow}>
        {TABS.map((t, i) => (
          <Button
            key={t.id}
            id={`${id}-${t.id}`}
            role="tab"
            aria-selected={i === tab}
            aria-controls={`${id}-panel`}
            tabIndex={i === tab ? 0 : -1}
            variant={i === tab ? "primary" : "secondary"}
            onClick={() => setTab(i)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div ref={panel} onScroll={checkMore} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${current.id}`} tabIndex={0} className="mt-4 min-h-0 space-y-3 overflow-y-auto">
        <p>{current.intro}</p>
        {current.parts.map(([title, text]) => (
          <section key={title}>
            <h3 className="font-heading font-semibold">{title}</h3>
            <p className="text-muted">{text}</p>
          </section>
        ))}
      </div>
      {/* En pil tills slutet syns: iPhones scrollist är dold, så annars ser texten avkapad ut. Samma knapp blir OK. */}
      <Button
        className="mt-4 self-start"
        aria-label={more ? "Läs vidare" : undefined}
        onClick={() => {
          if (!more) return card?.close();
          const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
          panel.current?.scrollBy({ top: panel.current.clientHeight * 0.8, behavior: smooth ? "smooth" : "auto" });
        }}
      >
        {more ? <ChevronDownIcon /> : "OK"}
      </Button>
    </>
  );
}
