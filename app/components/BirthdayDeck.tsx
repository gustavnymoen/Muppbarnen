"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { dayAndMonth, type DeckCard, type DeckKid } from "@/lib/deck";
import { Avatar } from "./Avatar";
import { IconButton } from "./Button";
import { Card } from "./Card";
import { FitName } from "./FitName";
import { ChevronLeftIcon, ChevronRightIcon, ReturnIcon } from "./icons";
import { ChristmasBackdrop } from "./ChristmasBackdrop";
import { SizesButton } from "./SizesButton";
import { dropGhost, growFrom, growScale, makeGhost, originOf, shrinkTo } from "./transition";
import { WishButton, WishList } from "./WishList";

// Kortleken på startsidan (MUPP-004). Korten ligger på varandra: det valda överst, nästa och
// föregående tittar fram bakom. Den går att bläddra i med svep, knappar och piltangenter. Med en
// önskelista utfälld går knapparna och piltangenterna vidare med listan öppen (MUPP-017); svepet
// är avstängt så att det inte krockar med att scrolla listan.

const SWIPE_DISTANCE = 50;
const SIDE_OFFSET = 94; // % av kortets bredd som korten på sidorna ligger vid sidan om det valda
const SIDE_SCALE = 0.84;
// Bilden på kort med flera barn växer med skärmens höjd: 72 px på en låg telefon (667 px), upp till 104 px
const TWIN_AVATAR = "clamp(72px, calc(72px + (100dvh - 667px) * 0.2), 104px)";
// Bilden på kortet med ett barn: 192 px på en hög telefon, och krymper med skärmens höjd så att knappen Storlekar får plats (96 px på 568 px)
const SOLO_AVATAR = "clamp(96px, calc(100dvh - 527px), 192px)";
const TILE_AVATAR = 56; // barnen på julkortet

const cardLabel = (card: DeckCard) => (card.kind === "christmas" ? "Julafton" : `${card.kids.map((k) => k.name).join(" och ")}, ${dayAndMonth(card.day!, card.month!)}`);
// Datumet står i kortets rubrik; på miniatyrerna (utan date) står bara "Beräknad"
const ageText = (kid: DeckKid, date = "") => (kid.expected ? `Beräknad ${date}`.trim() : kid.age === null ? null : `Fyller ${kid.age} år`);

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
  // Rörelsen runt öppna och stäng (MUPP-016, MUPP-029): hur det som öppnas ska växa, och om det stängda ska krympa till knappen
  const growing = useRef<(() => void) | null>(null);
  const leaving = useRef(false);
  // Om det senaste som hände var en tangent eller ett tryck (MUPP-022)
  const byKeyboard = useRef(false);
  const count = cards.length;
  // Med flera barn på kortet byter knapparna barn på kortet, så de fungerar även om leken bara har ett kort
  const openCard = openList && cards.find((c) => c.key === openList.cardKey);
  const canGo = count > 1 || (openCard?.kids.length ?? 0) > 1;

  useLayoutEffect(() => {
    const target = refocus.current ? document.getElementById(refocus.current) : null;
    if (openList) growing.current?.();
    else if (leaving.current) shrinkTo(target);
    growing.current = refocus.current = null;
    leaving.current = false;
    // Utan preventScroll scrollar webbläsaren leken åt sidan för att visa ett kort som ännu glider in
    target?.focus({ preventScroll: true });
    // Efter en stängning med finger eller mus ska ringen inte ligga kvar runt knappen (iOS visar den annars); tangentbordet får den som vanligt
    if (target && !openList && !byKeyboard.current) {
      target.dataset.quietFocus = "";
      target.addEventListener("blur", () => delete target.dataset.quietFocus, { once: true });
    }
  }, [openList]);

  if (count === 0) return <Card as="section" className="mt-3">Inga barn har lagts till än.</Card>;

  // pressed: öppnades med en knapp på kortet (inte genom att bläddra), så att det finns något att växa ur
  const open = (card: DeckCard, kid: DeckKid, pressed = true) => {
    // Önskelistans Stäng-knapp har samma id som önskelistknappen, så fokus hamnar på den när listan öppnas
    refocus.current = `lista-${card.key}-${kid.id}-knapp`;
    dropGhost();
    // På kort med flera barn växer hela vyn ur knappen eller rutan som trycktes, på kortet med ett barn listan ur önskelistknappen.
    // Knappen mäts nu: när vyn har ritats finns den inte kvar
    const multi = card.kids.length > 1;
    const button = pressed ? document.getElementById(multi ? `barn-${card.key}-${kid.id}` : refocus.current) : null;
    const from = button && originOf(button);
    growing.current =
      from &&
      (() => {
        if (multi) growFrom(document.getElementById(`karta-${card.key}`), from);
        else growScale(document.getElementById(`lista-${card.key}-${kid.id}`), from);
      });
    setOpenList({ cardKey: card.key, kidId: kid.id });
  };

  const go = (delta: number) => {
    if (!canGo) return;
    if (openList && openCard!.kids.length > 1) {
      // Byter barn på samma kort; markeringarna går bort eftersom varje barns lista har sin egen nyckel
      const { kids } = openCard!;
      const kid = kids[(kids.findIndex((k) => k.id === openList.kidId) + delta + kids.length) % kids.length];
      open(openCard!, kid);
      setAnnouncement(`${kid.name}, önskelistan är öppen`);
      return;
    }
    const next = (index + delta + count) % count;
    const card = cards[next];
    setIndex(next);
    setAnnouncement(`Kort ${next + 1} av ${count}: ${cardLabel(card)}`);
    if (!openList) return;
    // Med en lista öppen visas nästa kort med sitt barns lista öppen, eller som översikt om det har flera barn (fokus till första barnet, listan där är borta)
    if (card.kids.length === 1) open(card, card.kids[0], false);
    else {
      refocus.current = `barn-${card.key}-${card.kids[0].id}`;
      setOpenList(null);
    }
  };
  const close = () => {
    if (!openList) return;
    const card = cards.find((c) => c.key === openList.cardKey)!;
    const multi = card.kids.length > 1;
    makeGhost(document.getElementById(multi ? `karta-${card.key}` : `lista-${card.key}-${openList.kidId}`));
    leaving.current = true;
    // Ett kort med flera barn går tillbaka till barnets knapp, annars stannar fokus på listknappen
    refocus.current = multi ? `barn-${card.key}-${openList.kidId}` : `lista-${card.key}-${openList.kidId}-knapp`;
    setOpenList(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Assistenttekniker som trycker utan tangent eller pekare räknas som pekare (ringen göms): en känd gräns
    byKeyboard.current = true;
    delete (event.target as HTMLElement).dataset.quietFocus;
    // Piltangenterna i dialogerna (paxa, storlekar) hör till dem
    if ((event.target as Element).closest("dialog") && event.key !== "Escape") return;
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "Escape") close();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!openList && count > 1 && event.button === 0) swipeStart.current = event.clientX;
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
    <div role="group" aria-label="Födelsedagskort" aria-roledescription="karusell" onKeyDown={onKeyDown} onPointerDownCapture={() => (byKeyboard.current = false)} className="flex h-full flex-col gap-2">
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
          <IconButton className="pointer-events-auto" label="Föregående kort" disabled={!canGo} onClick={() => go(-1)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <div className="absolute inset-y-0 right-2 z-10 flex items-center pointer-events-none">
          <IconButton className="pointer-events-auto" label="Nästa kort" disabled={!canGo} onClick={() => go(1)}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </div>
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
  const date = christmas ? "" : dayAndMonth(card.day!, card.month!);
  // Ett barn visas som hela kort; flera visas som miniatyrer tills ett öppnas
  const single = card.kids.length === 1 ? card.kids[0] : card.kids.find((k) => k.id === openList?.kidId);
  const openKid = single && (card.kids.length > 1 || openList?.kidId === single.id) ? single : null;
  const hasBack = openKid !== null && card.kids.length > 1;
  // En öppen lista får platsen: märket syns redan på det stängda kortet (MUPP-030-R1)
  const nextMark = first && !openKid ? (christmas ? "Nästa: Julafton" : "Nästa födelsedag") : null;

  return (
    <Card
      as="article"
      id={`karta-${card.key}`}
      highlight={first ? card.kids[0].color : undefined}
      className={`relative isolate flex h-full flex-col gap-4 overflow-hidden ${openKid ? "px-4" : "px-6"} ${christmas ? "christmas-card pb-8" : single ? "pb-8" : "pb-4"} ${openKid ? "pt-3" : christmas ? "pt-12" : single ? "pt-8" : "pt-4"}`}
    >
      {christmas && <ChristmasBackdrop />}
      {/* Tillbaka till alla barn uppe till vänster, först i tabbordningen (MUPP-015); på kortet med ett barn finns inget att gå tillbaka till */}
      {hasBack && (
        <IconButton label={christmas ? "Tillbaka till Julafton" : "Tillbaka till alla barn"} onClick={onClose} className="absolute left-3 top-3 z-10">
          <ReturnIcon />
        </IconButton>
      )}
      {/* Ikonen för storlekar i hörnet av varje öppen barnvy (MUPP-014-R4) */}
      {openKid && <SizesButton kid={openKid} mode="corner" className="absolute right-3 top-3 z-10" />}
      {/* I en öppen barnvy står datumet på raden med hörnknapparna, mellan dem (MUPP-030-R3); kortets kant är smalare så att ett långt namn ryms (R2) */}
      <header className={`flex items-center text-center ${openKid ? "h-11 justify-center px-10" : "flex-col gap-2"}`}>
        {/* På en smal telefon krymper datumet så att det ryms på en rad, och i en öppen barnvy också för ikonerna i hörnen */}
        <h2 className={`font-heading font-semibold ${openKid ? "text-xl whitespace-nowrap max-[23rem]:text-sm" : "text-3xl max-[23rem]:text-2xl"}`}>{christmas ? "Julafton" : date}</h2>
        {nextMark && <NextMark>{nextMark}</NextMark>}
      </header>

      {single ? (
        <KidFace
          key={single.id}
          cardKey={card.key}
          date={date}
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
                  <Avatar name={kid.name} color={kid.color} src={kid.picture} size={TILE_AVATAR} decorative />
                  <span className="sr-only">Öppna&nbsp;</span>
                  <FitName className="font-heading text-lg font-semibold">{kid.name}</FitName>
                </button>
              </li>
            ) : (
              // Barn med samma födelsedag ligger över varandra, var och en som en liten version av barnkortet och mitt i sin del av kortet (R1)
              <li key={kid.id} className="divider-short flex flex-1 flex-col items-center justify-center gap-0.5 text-center">
                <Avatar name={kid.name} color={kid.color} src={kid.picture} size={TWIN_AVATAR} decorative />
                <h3 className="max-w-full">
                  <FitName className="font-heading text-lg font-semibold">{kid.name}</FitName>
                </h3>
                {ageText(kid) && <p className="text-muted">{ageText(kid)}</p>}
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

// Ett barn som hela kort: stor bild, namn, ålder och önskelistan. Med listan öppen bara en liten bild och namnet på en rad (MUPP-030-R2)
// cardKey ingår i id:na: samma barn finns på flera kort, och korten bredvid ritas också
function KidFace({ cardKey, date, kid, solo, open, onToggle }: { cardKey: string; date: string; kid: DeckKid; solo: boolean; open: boolean; onToggle: () => void }) {
  return (
    <>
      {open ? (
        <div className="flex items-center justify-center gap-2">
          {/* Bilden får inte krympa när ett långt namn tar platsen (initialen kan annars tryckas ihop till bokstavens bredd) */}
          <span className="flex shrink-0">
            <Avatar name={kid.name} color={kid.color} src={kid.picture} size={40} decorative />
          </span>
          <h3 className="min-w-0">
            <FitName className="font-heading text-2xl font-semibold">{kid.name}</FitName>
          </h3>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
          <Avatar name={kid.name} color={kid.color} src={kid.picture} size={SOLO_AVATAR} decorative />
          <h3 className="mt-2 font-heading text-3xl font-semibold break-words">{kid.name}</h3>
          {ageText(kid, date) && <p className="text-lg text-muted">{ageText(kid, date)}</p>}
          <SizesButton kid={kid} mode="text" className="mt-2" />
        </div>
      )}
      <WishList id={`lista-${cardKey}-${kid.id}`} wishes={kid.wishes} color={kid.color} solo={solo} open={open} onToggle={onToggle} />
    </>
  );
}
