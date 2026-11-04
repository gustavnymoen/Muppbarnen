"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { markOnboardingSeen } from "@/app/actions";
import { Button, IconButton } from "./Button";
import { Dialog } from "./Dialog";
import { CrossIcon } from "./icons";

// Rutan "Så funkar sajten" (MUPP-035): två flikar med korta texter. Texterna är fasta och godkända på kortet.
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

// Öppnas av SiteMenu (ref) och, om autoOpen, av sig själv första gången. Varje sätt att stänga (OK, Stäng, Esc, tryck utanför)
// ger onClose, som då minns att rutan är sedd. <dialog> med showModal() håller fokus inne och lämnar tillbaka det när den stängs.
export function OnboardingDialog({ ref, autoOpen }: { ref: Ref<HTMLDialogElement>; autoOpen?: boolean }) {
  const id = useId();
  const [tab, setTab] = useState(0);
  // Trycket började på bakgrunden: ett tryck inne i rutan som släpps utanför (markera text) ska inte stänga den
  const pressedBackdrop = useRef(false);
  const [node, setNode] = useState<HTMLDialogElement | null>(null);

  useEffect(() => {
    // Bara vid första visningen: när kakan sätts ritas sidan om med autoOpen av, och rutan ska inte öppnas igen
    if (autoOpen && node && !node.open) node.showModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  function arrow(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (tab + step + TABS.length) % TABS.length;
    setTab(next);
    document.getElementById(`${id}-${TABS[next].id}`)?.focus();
  }

  const current = TABS[tab];
  return (
    <Dialog
      ref={(element) => {
        setNode(element);
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      aria-labelledby={`${id}-titel`}
      className="max-h-[85dvh] flex-col text-left open:flex"
      onClose={() => {
        setTab(0);
        if (autoOpen) void markOnboardingSeen();
      }}
      onMouseDown={(event) => (pressedBackdrop.current = event.target === event.currentTarget)}
      onClick={(event) => {
        // Ett tryck på den mörka bakgrunden landar på <dialog> självt, utanför rutan
        const box = event.currentTarget.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (pressedBackdrop.current && (x < box.left || x > box.right || y < box.top || y > box.bottom)) event.currentTarget.close();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-titel`} className="font-heading text-xl font-semibold">
          Så funkar sajten
        </h2>
        <IconButton label="Stäng" onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
          <CrossIcon />
        </IconButton>
      </div>
      <div role="tablist" aria-label="Läs som" className="mt-3 flex gap-2" onKeyDown={arrow}>
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
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${current.id}`} tabIndex={0} className="mt-4 min-h-0 space-y-3 overflow-y-auto">
        <p>{current.intro}</p>
        {current.parts.map(([title, text]) => (
          <section key={title}>
            <h3 className="font-heading font-semibold">{title}</h3>
            <p className="text-muted">{text}</p>
          </section>
        ))}
      </div>
      <Button className="mt-4 self-start" onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
        OK
      </Button>
    </Dialog>
  );
}
