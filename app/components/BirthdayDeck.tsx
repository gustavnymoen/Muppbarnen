"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { MONTHS, type DeckCard, type DeckKid } from "@/lib/deck";
import { Avatar } from "./Avatar";
import { Button, IconButton } from "./Button";
import { Card } from "./Card";
import { FitName } from "./FitName";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { ChristmasBackdrop } from "./ChristmasBackdrop";
import { SizesButton } from "./SizesButton";
import { WishButton, WishList } from "./WishList";

// Kortleken på startsidan (MUPP-004). Korten ligger på varandra: det valda överst, nästa och
// föregående tittar fram bakom. Den går att bläddra i med svep, knappar och piltangenter, och
// den är låst medan en önskelista är utfälld (R9).

const SWIPE_DISTANCE = 50;
const SIDE_OFFSET = 94; // % av kortets bredd som korten på sidorna ligger vid sidan om det valda
const SIDE_SCALE = 0.84;
// Bilden på kort med flera barn växer med skärmens höjd: 72 px på en låg telefon (667 px), upp till 104 px
const TWIN_AVATAR = "clamp(72px, calc(72px + (100dvh - 667px) * 0.2), 104px)";
// Bilden på kortet med ett barn: 192 px på en hög telefon, och krymper med skärmens höjd så att knappen Storlekar får plats (96 px på 568 px)
const SOLO_AVATAR = "clamp(96px, calc(100dvh - 527px), 192px)";
const TILE_AVATAR = 56; // barnen på julkortet

const cardLabel = (card: DeckCard) => (card.kind === "christmas" ? "Julafton" : `${card.kids.map((k) => k.name).join(" och ")}, ${MONTHS[card.month! - 1].toLowerCase()}`);
const ageText = (kid: DeckKid, month: number | null) => (kid.expected ? `Beräknad ${MONTHS[month! - 1].toLowerCase()}` : kid.age === null ? null : `Fyller ${kid.age} år`);
const picture = (kid: DeckKid) => (kid.hasPicture ? `/bilder/${kid.id}` : undefined);

// Vilket barns lista som är utfälld, på vilket kort
type OpenList = { cardKey: string; kidId: number } | null;

export function BirthdayDeck({ cards }: { cards: DeckCard[] }) {
  const [index, setIndex] = useState(0);
  const [openList, setOpenList] = useState<OpenList>(null);
  const [announcement, setAnnouncement] = useState("");
  const [dx, setDx] = useState(0);
  const swipeStart = useRef<number | null>(null);
  // Elementet som ska få fokus när listan öppnats eller stängts (knappen som tryckts kan ha försvunnit)
  const refocus = useRef<string | null>(null);
  const count = cards.length;
  const locked = openList !== null;

  useEffect(() => {
    if (refocus.current) {
      document.getElementById(refocus.current)?.focus();
      refocus.current = null;
    }
  }, [openList]);

  if (count === 0) return <Card as="section" className="mt-3">Inga barn har lagts till än.</Card>;

  const go = (delta: number) => {
    if (locked || count < 2) return;
    const next = (index + delta + count) % count;
    setIndex(next);
    setAnnouncement(`Kort ${next + 1} av ${count}: ${cardLabel(cards[next])}`);
  };

  const open = (card: DeckCard, kid: DeckKid) => {
    // Önskelistans Stäng-knapp har samma id som önskelistknappen, så fokus hamnar på den när listan öppnas
    refocus.current = `lista-${card.key}-${kid.id}-knapp`;
    setOpenList({ cardKey: card.key, kidId: kid.id });
    setAnnouncement("Kortleken är låst. Stäng önskelistan för att bläddra.");
  };
  const close = () => {
    if (!openList) return;
    const card = cards.find((c) => c.key === openList.cardKey)!;
    // Ett kort med flera barn går tillbaka till barnets knapp, annars stannar fokus på listknappen
    refocus.current = card.kids.length > 1 ? `barn-${card.key}-${openList.kidId}` : `lista-${card.key}-${openList.kidId}-knapp`;
    setOpenList(null);
    setAnnouncement("Kortleken är upplåst.");
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "Escape") close();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!locked && count > 1 && event.button === 0) swipeStart.current = event.clientX;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const moved = event.clientX - swipeStart.current;
    if (Math.abs(moved) > 8) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDx(moved);
    }
  };
  const onPointerEnd = () => {
    if (swipeStart.current === null) return;
    swipeStart.current = null;
    if (dx <= -SWIPE_DISTANCE) go(1);
    else if (dx >= SWIPE_DISTANCE) go(-1);
    setDx(0);
  };

  // Läge i leken: 0 överst, 1 nästa, -1 föregående; övriga ritas inte
  const slots = cards.flatMap((card, i) => {
    const rel = (i - index + count) % count;
    const offset = rel === 0 ? 0 : rel === 1 ? 1 : rel === count - 1 ? -1 : null;
    return offset === null ? [] : [{ card, offset, position: i }];
  });

  return (
    <div role="group" aria-label="Födelsedagskort" aria-roledescription="karusell" onKeyDown={onKeyDown} className="flex h-full flex-col gap-2">
      {/* Karusell: alla kort är lika stora och ligger mitt på ytan; kortet före och efter skymtar på sidorna, och knapparna sitter på kortets kanter */}
      <div className="relative mx-auto min-h-0 w-full max-w-md flex-1">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)] touch-pan-y overflow-hidden px-8 py-4"
        >
          {slots.map(({ card, offset }) => {
            const style: CSSProperties =
              offset === 0
                ? { transform: `translateX(${dx}px)`, zIndex: 2 }
                : { transform: `translateX(calc(${offset * SIDE_OFFSET}% + ${dx}px)) scale(${SIDE_SCALE})`, zIndex: 1 };
            return (
              <div
                key={card.key}
                data-dragging={dx !== 0}
                aria-hidden={offset !== 0 || undefined}
                inert={offset !== 0}
                style={style}
                className="deck-card col-start-1 row-start-1 h-full max-h-[40rem] min-h-0 self-center"
              >
                <DeckCardView card={card} first={card.next} openList={openList?.cardKey === card.key ? openList : null} onOpen={(kid) => open(card, kid)} onClose={close} />
              </div>
            );
          })}
        </div>
        <div className="absolute inset-y-0 left-2 z-10 flex items-center pointer-events-none">
          <IconButton className="pointer-events-auto" label="Föregående kort" disabled={locked || count < 2} onClick={() => go(-1)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <div className="absolute inset-y-0 right-2 z-10 flex items-center pointer-events-none">
          <IconButton className="pointer-events-auto" label="Nästa kort" disabled={locked || count < 2} onClick={() => go(1)}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </div>
      {locked && <p className="text-center text-sm text-muted">Stäng önskelistan för att bläddra.</p>}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

// Märket på det närmaste kortet, med en stjärna på var sida; alltid gult, oavsett barnets färg (MUPP-013-R4)
function NextMark({ children }: { children: string }) {
  return (
    <span className="chip-child inline-flex items-center gap-2 rounded-full px-4 py-1 font-heading text-base font-semibold" style={{ "--child": "var(--color-child-sun)" } as CSSProperties}>
      <span aria-hidden="true">✦</span>
      <span>{children}</span>
      <span aria-hidden="true">✦</span>
    </span>
  );
}

function DeckCardView({ card, first, openList, onOpen, onClose }: { card: DeckCard; first: boolean; openList: OpenList; onOpen: (kid: DeckKid) => void; onClose: () => void }) {
  const christmas = card.kind === "christmas";
  // Ett barn visas som hela kort; flera visas som miniatyrer tills ett öppnas
  const single = card.kids.length === 1 ? card.kids[0] : card.kids.find((k) => k.id === openList?.kidId);
  const openKid = single && (card.kids.length > 1 || openList?.kidId === single.id) ? single : null;
  // Med knappen Tillbaka uppe till vänster och ikonen uppe till höger får rubriken en egen rad under dem (MUPP-015-R4)
  const hasBack = openKid !== null && card.kids.length > 1;
  const nextMark = first ? (christmas ? "Nästa: Julafton" : "Nästa födelsedag") : null;

  return (
    <Card
      as="article"
      highlight={first ? card.kids[0].color : undefined}
      className={`relative isolate flex h-full flex-col gap-4 overflow-hidden px-6 ${christmas ? "christmas-card pb-8" : single ? "pb-8" : "pb-4"} ${hasBack ? "pt-16" : christmas ? "pt-12" : single ? "pt-8" : "pt-4"}`}
    >
      {christmas && <ChristmasBackdrop />}
      {/* Tillbaka till alla barn uppe till vänster, först i tabbordningen (MUPP-015); på kortet med ett barn finns inget att gå tillbaka till */}
      {hasBack && (
        <Button variant="secondary" onClick={onClose} aria-label={christmas ? "Tillbaka till Julafton" : "Tillbaka till alla barn"} className="absolute left-3 top-3 z-10 gap-1 px-3 text-base">
          <ChevronLeftIcon />
          Tillbaka
        </Button>
      )}
      {/* Ikonen för storlekar i hörnet av varje öppen barnvy (MUPP-014-R4) */}
      {openKid && <SizesButton kid={openKid} mode="corner" className="absolute right-3 top-3 z-10" />}
      <header className="flex flex-col items-center gap-2 text-center">
        {/* På en smal telefon krymper månaden på kortet med ett barn när ikonen i hörnet ligger bredvid den; med Tillbaka har rubriken en rad för sig */}
        <h2 className={`font-heading text-3xl font-semibold ${openKid && !hasBack ? "max-[23rem]:text-xl" : ""}`}>{christmas ? "Julafton" : MONTHS[card.month! - 1]}</h2>
        {nextMark && <NextMark>{nextMark}</NextMark>}
      </header>

      {single ? (
        <KidFace
          cardKey={card.key}
          month={card.month}
          kid={single}
          solo={card.kids.length === 1}
          open={card.kids.length === 1 ? openList?.kidId === single.id : true}
          onToggle={() => (openList?.kidId === single.id ? onClose() : onOpen(single))}
        />
      ) : (
        <ul className={`min-h-0 overflow-y-auto ${christmas ? "my-auto max-h-full grid grid-cols-2 gap-3" : "flex flex-1 flex-col gap-3"}`}>
          {card.kids.map((kid) =>
            christmas ? (
              // Julkortet har alla barnen: rutor två och två med bilden över namnet
              <li key={kid.id}>
                <button
                  type="button"
                  id={`barn-${card.key}-${kid.id}`}
                  onClick={() => onOpen(kid)}
                  className="press flex h-full min-h-11 w-full flex-col items-center gap-1 rounded-control border border-edge bg-page/50 px-2 py-3 hover:bg-edge"
                >
                  <Avatar name={kid.name} color={kid.color} src={picture(kid)} size={TILE_AVATAR} decorative />
                  <span className="sr-only">Öppna&nbsp;</span>
                  <FitName className="font-heading text-lg font-semibold">{kid.name}</FitName>
                </button>
              </li>
            ) : (
              // Barn med samma födelsedag ligger över varandra, var och en som en liten version av barnkortet och mitt i sin del av kortet (R1)
              <li key={kid.id} className="divider-short flex flex-1 flex-col items-center justify-center gap-0.5 text-center">
                <Avatar name={kid.name} color={kid.color} src={picture(kid)} size={TWIN_AVATAR} decorative />
                <h3 className="max-w-full">
                  <FitName className="font-heading text-lg font-semibold">{kid.name}</FitName>
                </h3>
                {ageText(kid, card.month) && <p className="text-muted">{ageText(kid, card.month)}</p>}
                <div className="mt-2 flex w-full max-w-48 gap-1.5">
                  <WishButton id={`barn-${card.key}-${kid.id}`} color={kid.color} small forKid={kid.name} onClick={() => onOpen(kid)} className="min-w-0 flex-1" />
                  <SizesButton kid={kid} mode="icon" forKid />
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

// Ett barn som hela kort: stor bild, namn, ålder och önskelistan
// cardKey ingår i id:na: samma barn finns på flera kort, och korten bredvid ritas också
function KidFace({ cardKey, month, kid, solo, open, onToggle }: { cardKey: string; month: number | null; kid: DeckKid; solo: boolean; open: boolean; onToggle: () => void }) {
  return (
    <>
      <div className={`flex flex-col items-center justify-center gap-2 text-center ${open ? "" : "min-h-0 flex-1"}`}>
        <Avatar name={kid.name} color={kid.color} src={picture(kid)} size={open ? 72 : SOLO_AVATAR} decorative />
        <h3 className="mt-2 font-heading text-3xl font-semibold break-words">{kid.name}</h3>
        {ageText(kid, month) && <p className="text-lg text-muted">{ageText(kid, month)}</p>}
        {!open && <SizesButton kid={kid} mode="text" className="mt-2" />}
      </div>
      <WishList id={`lista-${cardKey}-${kid.id}`} wishes={kid.wishes} color={kid.color} solo={solo} open={open} onToggle={onToggle} />
    </>
  );
}
