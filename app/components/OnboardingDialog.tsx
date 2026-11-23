"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { markOnboardingSeen } from "@/app/actions";
import { Button } from "./Button";
import { Dialog, useCard, type DialogHandle } from "./Dialog";
import { ChevronDownIcon } from "./icons";
import { TabBar } from "./Tabs";

// Rutan "Så funkar det" (MUPP-035, MUPP-050): två guider, var och en med två flikar med korta texter. Texterna är fasta och godkända på korten.
type Part = [string, ReactNode];
type GuideTab = { id: string; label: string; intro?: string; parts: Part[] };

const GUIDES: { id: string; label: string; tabs: GuideTab[] }[] = [
  {
    id: "listor",
    label: "Barnens listor",
    tabs: [
      {
        id: "besokare",
        label: "Besökare",
        intro: "Här samlar vi barnens önskelistor och storlekar i ett försök att underlätta födelsedagar och jul!",
        parts: [
          ["Välj familj", <>Välj de familjer du tillhör, så får du bara upp relevanta barn och Secret Santa-grupper. Du hittar filtret uppe i vänstra hörnet.</>],
          ["Önskelistor", <>Hitta barnet och öppna önskelistan. Varje rad kan innehålla mer information, till exempel specifika storlekar och länkar. Du hittar barnets storlekar på kortet.</>],
          [
            "Paxa en present",
            <>
              Hittat något du vill köpa? Markera och tryck <b>Paxa</b> så att andra ser vad som är taget. <b>Paxad</b> betyder att någon redan ska köpa den. <b>Kan köpas flera gånger</b> betyder att flera kan ge den.
            </>,
          ],
          ["Ångrat dig eller klickat fel?", <>Tryck på den orangea pilen vid en paxad present, så blir den ledig igen. Ta bara bort din egen paxning.</>],
          ["Lägg till egna presenter", <>Du kan i barnens önskelista lägga till egna presenter om du kommer på något som inte finns i önskelistan. Du kan sedan ta bort den om du ångrat dig.</>],
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
    ],
  },
  {
    id: "santa",
    label: "Secret Santa",
    tabs: [
      {
        id: "deltagare",
        label: "Deltagare",
        parts: [
          ["Logga in", <>Hitta din grupp och logga in med hjälp av ditt namn + telefonnummer eller e-post.</>],
          ["Skriv din önskelista", <>Du kan fylla på din önskelista från och med att Secret Santa aktiveras till julafton. Fyll gärna i storlek, beskrivning och eventuell länk.</>],
          ["Lottningen", <>När Secret Santa startas lottas du ihop med en person att ge present till! Du får ett mejl om detta.</>],
          [
            "Din och din matchnings lista",
            <>
              När du loggat in ser du din egen och din matchnings lista. I din önskelista kan du skriva med personen som ska handla till dig. I din matchnings önskelista kan du ställa frågor och få svar om hens önskelista. Tar det tid för din matchning att fylla på sin lista kan du klicka på tjat-knappen!
            </>,
          ],
          [
            "Mejl från tomten",
            <>Du får mejl från tomten@kusinportalen.com vid förändring i eventet, i din matchnings önskelista eller vid nya meddelanden. Se till att det inte hamnar i skräpposten.</>,
          ],
        ],
      },
      {
        id: "admin",
        label: "Admin",
        parts: [
          [
            "Skapa gruppen",
            <>Du som admin kan skapa en Secret Santa-grupp samt lägga till och ändra personer. Vill du att par inte ska få varandra, ange då partner på personerna.</>,
          ],
          [
            "Aktivera och Starta",
            <>
              När du aktiverar gruppen får deltagarna mejl och kan fylla på sina önskelistor! I denna status kan du lägga till och ta bort personer. När du startar eventet matchas personerna. Deltagare kan fortsätta redigera sina listor efter att eventet startat. Du kan välja att aktivera och starta på samma gång, men tänk på att personer inte kan läggas till eller tas bort efter att eventet startat.
            </>,
          ],
          ["Följ upp", <>Du kan se om alla fyllt i minst en sak i sin lista, så du vet vem du ska tjata på (men aldrig VAD de fyllt i).</>],
          [
            "Stoppa och rensa",
            <>
              Du kan stoppa och avaktivera Secret Santa om du missat något. Matchningar görs dock om vid ny start. En månad efter julafton rensas chattar och önskelistor och gruppen avaktiveras, men personerna är kvar tills nästa år. Du behöver inte göra något.
            </>,
          ],
        ],
      },
    ],
  },
];

// Öppnas av SiteMenu (ref) och, om autoOpen, av sig själv första gången. Varje sätt att stänga (OK, Esc, tryck utanför)
// minns att rutan är sedd, på vilken guide som än visas. Rutan är ett kort (Dialog.tsx), och dess innehåll börjar om varje gång det öppnas.
// guide: vilken guide som visas först (MUPP-050-R5).
export function OnboardingDialog({ ref, autoOpen, guide = "listor" }: { ref: Ref<DialogHandle>; autoOpen?: boolean; guide?: "listor" | "santa" }) {
  // defaultOpen gäller bara vid första visningen: när kakan sätts ritas sidan om med autoOpen av, och rutan ska inte öppnas igen
  return (
    <Dialog ref={ref} title="Så funkar det" backdropClose defaultOpen={autoOpen} className="max-h-[85dvh] flex-col open:flex" onClose={() => autoOpen && void markOnboardingSeen()}>
      <OnboardingGuides first={GUIDES.findIndex((g) => g.id === guide)} />
    </Dialog>
  );
}

function OnboardingGuides({ first }: { first: number }) {
  const id = useId();
  const card = useCard();
  const [guideIndex, setGuideIndex] = useState(first);
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
  }, [guideIndex, tab]);

  function arrow(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (tab + step + guide.tabs.length) % guide.tabs.length;
    setTab(next);
    document.getElementById(`${id}-${guide.tabs[next].id}`)?.focus();
  }

  const guide = GUIDES[guideIndex];
  return (
    <>
      <TabBar
        label="Välj guide"
        base={id}
        tabs={GUIDES.map((g) => ({ id: g.id, title: g.label }))}
        selected={guideIndex}
        onSelect={(i) => {
          setGuideIndex(i);
          setTab(0);
        }}
      />
      {/* flex-auto och inte flex-1 (basis 0%): rutans höjd är bara begränsad av max-h, och iOS gör då 0% till 0 så att pilen ritas över flikarna (MUPP-069) */}
      <div id={`${id}-${guide.id}-panel`} role="tabpanel" aria-labelledby={`${id}-${guide.id}`} className="mt-4 flex min-h-0 flex-auto flex-col">
        <div role="tablist" aria-label="Läs som" className="flex gap-2" onKeyDown={arrow}>
          {guide.tabs.map((t, i) => (
            <Button
              key={t.id}
              id={`${id}-${t.id}`}
              role="tab"
              aria-selected={i === tab}
              aria-controls={`${id}-${t.id}-panel`}
              tabIndex={i === tab ? 0 : -1}
              variant={i === tab ? "primary" : "secondary"}
              onClick={() => setTab(i)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        {/* Alla fyra texterna ligger i samma ruta, den valda synlig och de andra dolda men med kvar sin höjd, så att rutan
            får höjden av den längsta och inte hoppar när man byter flik (MUPP-050-R4) */}
        <div ref={panel} onScroll={checkMore} className="mt-4 grid min-h-0 flex-auto overflow-y-auto">
          {GUIDES.flatMap((g) => g.tabs.map((t) => ({ g, t }))).map(({ g, t }) => {
            const shown = g === guide && t === guide.tabs[tab];
            return (
              <div
                key={t.id}
                id={`${id}-${t.id}-panel`}
                role="tabpanel"
                aria-labelledby={`${id}-${t.id}`}
                tabIndex={shown ? 0 : -1}
                inert={!shown}
                className={`col-start-1 row-start-1 space-y-3 ${shown ? "" : "invisible"}`}
              >
                {t.intro && <p>{t.intro}</p>}
                {t.parts.map(([title, text]) => (
                  <section key={title}>
                    <h3 className="font-heading font-semibold">{title}</h3>
                    <p className="text-muted">{text}</p>
                  </section>
                ))}
              </div>
            );
          })}
        </div>
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
