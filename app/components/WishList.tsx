"use client";

import { useEffect, useId, useRef, useState, useTransition, type ComponentProps, type CSSProperties, type FormEvent, type Ref, type RefObject } from "react";
import { claimWishes, unclaimWish } from "@/app/actions";
import type { ChildColor } from "@/lib/child-colors";
import type { Wish } from "@/lib/deck";
import { canClaim, canUnclaim, isLongTitle, webLink } from "@/lib/wishes";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";
import { ChevronDownIcon, ChevronUpIcon, CrossIcon, InfoIcon, UndoIcon } from "./icons";

// Knappen som öppnar en önskelista (utseende i globals.css): önskelistan är det viktigaste på sajten, så den är en tydlig knapp
// med "Önskelista" och en pil ner; den smala varianten (small) på kort med flera barn har bara texten.
// forKid hänger på barnets namn för skärmläsaren när flera barn står på samma kort.
export function WishButton({
  small,
  forKid,
  color,
  className = "",
  ...props
}: { color: ChildColor; small?: boolean; forKid?: string } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      {...props}
      style={{ "--child": `var(--color-child-${color})` } as CSSProperties}
      className={`wish-button press inline-flex flex-col items-center justify-center rounded-control leading-tight disabled:opacity-60 ${small ? "min-h-11 px-2" : "min-h-[4.5rem] w-full py-3"} ${className}`}
    >
      {small ? (
        // Den smala knappen på kort med flera barn: en enda rad
        <span className="font-heading text-base font-semibold">
          Önskelista
          {forKid && <span className="sr-only"> för {forKid}</span>}
        </span>
      ) : (
        <>
          <span className="font-heading text-xl font-semibold">Önskelista</span>
          <ChevronDownIcon />
        </>
      )}
    </button>
  );
}

// Önskelistan på ett barnkort (MUPP-004-R7): knappen fäller ut listan med varje önskan som en rad (MUPP-005).
// Listan scrollar inuti kortet. Är den öppen styr kortleken, som låser sig då (R9); knappen byts då mot en
// knapp mitt på listans nederkant (MUPP-028): ett kryss (MUPP-034), som heter "Fäll ihop önskelistan" på ett kort med ett barn (solo)
// och "Stäng önskelistan" annars; den tar tillbaka till kortet med flera barn eller Julafton (MUPP-013-R5, MUPP-005-R6, -R7).
export function WishList({
  id,
  wishes,
  color,
  solo,
  open,
  onToggle,
}: {
  id: string;
  wishes: Wish[];
  color: ChildColor;
  solo: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`flex min-h-0 flex-col gap-3 ${open ? "flex-1" : ""}`}>
      {open ? <OpenList id={id} wishes={wishes} solo={solo} onToggle={onToggle} /> : <WishButton id={`${id}-knapp`} aria-expanded={false} aria-controls={id} color={color} onClick={onToggle} />}
    </section>
  );
}

// Den utfällda listan. Markeringarna hör till den här komponenten, som bara finns medan listan är öppen:
// när listan fälls ihop eller kortet stängs är de borta (MUPP-005-R3).
function OpenList({ id, wishes, solo, onToggle }: { id: string; wishes: Wish[]; solo: boolean; onToggle: () => void }) {
  const [marked, setMarked] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const dialog = useRef<DialogHandle>(null);
  const [unclaiming, setUnclaiming] = useState<Wish | null>(null);
  const unclaimDialog = useRef<DialogHandle>(null);

  const toggle = (wishId: number) => setMarked((ids) => (ids.includes(wishId) ? ids.filter((i) => i !== wishId) : [...ids, wishId]));
  // Knappen som öppnade fönstret har försvunnit, så fokus går till knappen som fäller ihop listan
  const done = (message: string, closing: DialogHandle | null) => {
    setNotice(message);
    closing?.close();
    document.getElementById(`${id}-knapp`)?.focus();
  };
  const claimed = (message: string) => {
    setMarked([]);
    done(message, dialog.current);
  };
  const unclaim = (wish: Wish, button: HTMLElement) => {
    setUnclaiming(wish);
    unclaimDialog.current?.open(button);
  };

  return (
    // Platsen finns bara medan listan är öppen. Raderna scrollar i en inre ruta som går att scrolla med tangentbordet; den slutar
    // ovanför knappen på kanten (pb-5), så att knappen aldrig ligger över en rad (MUPP-028-R1). mb-2 ger fokusringen plats i kortet.
    <div id={id} aria-label="Önskelista" role="region" className="relative mb-2 flex min-h-0 flex-1 flex-col rounded-control border border-edge bg-page/40 pb-5">
      <div tabIndex={0} role="group" aria-label="Önskningar" className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
        {wishes.length === 0 ? (
          <p className="py-2 text-muted">Inga önskningar än.</p>
        ) : (
          <ul className="divide-y divide-edge">
            {wishes.map((wish) => (
              <WishRow key={wish.id} wish={wish} claiming={{ marked: marked.includes(wish.id), onMark: () => toggle(wish.id), onUnclaim: (button) => unclaim(wish, button) }} />
            ))}
          </ul>
        )}
        {notice && (
          <p role="status" className="py-2 text-sm">
            {notice}
          </p>
        )}
      </div>
      {/* Paxa ligger fast under raderna, ovanför knappen, så att den syns direkt även när man kryssar högst upp i en lång lista (MUPP-028-R3) */}
      {marked.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button onClick={(event) => dialog.current?.open(event.currentTarget)} className="text-sm">
            Paxa ({marked.length})
          </Button>
        </div>
      )}
      {/* Mitt på boxens nederkant, halvt utanför, så att den går att stänga var man än är i listan; fokus hamnar här när listan öppnas.
          32 px rund, med en osynlig träffyta på 44 px (before:, räknat från insidan av ramen) (MUPP-028-R2). Alltid ett kryss (MUPP-034); namnet följer kortet. */}
      <IconButton
        id={`${id}-knapp`}
        compact
        round
        label={solo ? "Fäll ihop önskelistan" : "Stäng önskelistan"}
        onClick={onToggle}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 before:absolute before:-inset-[7px]"
      >
        <CrossIcon />
      </IconButton>
      <ClaimDialog ref={dialog} wishes={wishes.filter((w) => marked.includes(w.id))} onDone={claimed} />
      <UnclaimDialog ref={unclaimDialog} wish={unclaiming} onDone={(message) => done(message, unclaimDialog.current)} />
    </div>
  );
}

// Knappen som står där kryssrutan skulle ha stått på en rad som kan köpas flera gånger (MUPP-019-R1): förklaringen kommer som en
// bubbla över raden, så att raderna inte flyttar sig. Den göms av ett nytt tryck, Esc eller ett tryck någon annanstans.
function InfoBubble({ children }: { children: string }) {
  const [shown, setShown] = useState(false);
  const bubbleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!shown) return;
    bubble.current?.scrollIntoView({ block: "nearest" });
    const hide = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setShown(false);
    };
    document.addEventListener("pointerdown", hide);
    return () => document.removeEventListener("pointerdown", hide);
  }, [shown]);

  return (
    <div
      ref={box}
      className="shrink-0"
      onKeyDown={(event) => {
        // Esc göms bubblan och fäller inte ihop kortet (kortleken lyssnar på Esc)
        if (event.key === "Escape" && shown) {
          event.stopPropagation();
          setShown(false);
        }
      }}
    >
      <IconButton frameless label="Kan köpas flera gånger" aria-expanded={shown} aria-controls={bubbleId} onClick={() => setShown(!shown)}>
        <InfoIcon />
      </IconButton>
      {shown && (
        <p ref={bubble} id={bubbleId} role="status" className="absolute left-12 right-0 top-0 z-10 rounded-control border border-muted/75 bg-card p-3 text-sm shadow-card">
          {children}
        </p>
      )}
    </div>
  );
}

// En rad: rubriken med märken, en kryssruta om den går att paxa eller en ångra-pil om den är paxad (MUPP-006-R1),
// och detaljerna när raden är utfälld (MUPP-005-R1–R3). Utan claiming är raden bara att läsa, som på Secret Santa-matchningen
// (MUPP-062-R2); roomy ger den lite mer höjd (R3).
export function WishRow({ wish, claiming, roomy }: { wish: Wish; claiming?: { marked: boolean; onMark: () => void; onUnclaim: (button: HTMLElement) => void }; roomy?: boolean }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const link = webLink(wish.url);

  return (
    <li className="relative py-1">
      <div className="flex items-center gap-1">
        {claiming && canClaim(wish) && (
          <label className="flex min-h-11 min-w-11 shrink-0 items-center justify-center">
            <input type="checkbox" checked={claiming.marked} onChange={claiming.onMark} aria-label={wish.title} className="size-6 accent-brand" />
          </label>
        )}
        {claiming && canUnclaim(wish) && (
          <IconButton frameless label={`Ta bort paxningen på ${wish.title}`} onClick={(event) => claiming.onUnclaim(event.currentTarget)} className="shrink-0">
            <span className="text-claimed">
              <UndoIcon />
            </span>
          </IconButton>
        )}
        {wish.unlimited && wish.claimedBy === null && <InfoBubble>Den här presenten kan köpas flera gånger, så den går inte att paxa.</InfoBubble>}
        <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)} className={`flex min-w-0 flex-1 items-center justify-between gap-2 text-left ${roomy ? "min-h-14" : "min-h-11"}`}>
          <span className="flex min-w-0 flex-col">
            {/* Högst två rader med ellips och mindre text när titeln är lång (MUPP-023); den utfällda raden visar hela titeln */}
            <span className={`wrap-anywhere ${open ? "" : "line-clamp-2"} ${isLongTitle(wish.title) ? "text-sm" : ""}`}>{wish.title}</span>
            {wish.claimedBy !== null && <span className="text-sm font-semibold text-claimed">Paxad</span>}
            {wish.unlimited && <span className="text-sm text-muted">Kan köpas flera gånger</span>}
          </span>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {open && (
        <div id={detailsId} className="space-y-1 pb-2 text-sm">
          {wish.claimedBy !== null && (
            <p className="text-claimed">
              Paxad av {wish.claimedBy} {wish.claimedAt}
            </p>
          )}
          {wish.description && (
            <p className="whitespace-pre-line">
              <strong className="font-semibold">Beskrivning:</strong> {wish.description}
            </p>
          )}
          {wish.size && (
            <p>
              <strong className="font-semibold">Storlek:</strong> {wish.size}
            </p>
          )}
          {link && (
            <p>
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block min-h-6 text-brand underline">
                Länk till presenten<span className="sr-only"> (öppnas i en ny flik)</span>
              </a>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// Fönstret där besökaren skriver sitt namn och paxar de markerade presenterna (MUPP-005-R4, -R5): ett formulärkort (MUPP-045) med kryss,
// fokus i namnfältet och Enter som skickar. Det växer ur "Paxa"-knappen och går tillbaka dit när det stängs.
function ClaimDialog({ ref, wishes, onDone }: { ref: Ref<DialogHandle>; wishes: Wish[]; onDone: (message: string) => void }) {
  const id = useId();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const plural = wishes.length > 1;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    start(async () => {
      const result = await claimWishes(wishes.map((w) => w.id), name).catch(() => null);
      if (!result) return setError("Något gick fel. Försök igen.");
      if (result.ok) return onDone("");
      if (result.error) return setError(result.error);
      const missing = result.missing > 0 ? [`${result.missing} som inte finns längre`] : [];
      onDone(`Det gick inte att paxa ${[...result.notClaimed, ...missing].join(", ")}: någon annan hann före. Listan är uppdaterad.`);
    });
  };

  return (
    <Dialog ref={ref} form title={plural ? "Paxa presenterna" : "Paxa presenten"} aria-describedby={`${id}-text`} onClose={() => setError("")}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ul className="list-inside list-disc wrap-anywhere">
          {wishes.map((wish) => (
            <li key={wish.id}>{wish.title}</li>
          ))}
        </ul>
        <p id={`${id}-text`}>
          {plural
            ? "Du paxar nu de här presenterna. Om du ändrar dig, ta gärna bort paxningen så att andra vet."
            : "Du paxar nu den här presenten. Om du ändrar dig, ta gärna bort paxningen så att andra vet."}
        </p>
        <div className="space-y-1">
          <label htmlFor={`${id}-namn`} className="block font-medium">
            Ditt namn
          </label>
          <input id={`${id}-namn`} name="name" autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-fel` : undefined} className="min-h-11 w-full rounded-control border border-muted/75 bg-page px-3" />
          <p id={`${id}-fel`} role="alert" className="text-danger">
            {error}
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          Paxa
        </Button>
      </form>
    </Dialog>
  );
}

// Frågan innan en paxning tas bort (MUPP-006). Fokus börjar på "Avbryt", så att Enter inte råkar ta bort den (som i ConfirmAction).
// wish är null tills fönstret öppnats första gången.
function UnclaimDialog({ ref, wish, onDone }: { ref: RefObject<DialogHandle | null>; wish: Wish | null; onDone: (message: string) => void }) {
  const id = useId();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const confirm = () => {
    if (!wish) return;
    start(async () => {
      // Utan sajtkaka stoppar proxy.ts anropet innan åtgärden körs; en omladdning leder till lösenordssidan
      const result = await unclaimWish(wish.id).catch(() => null);
      if (!result) return setError("Något gick fel. Ladda om sidan och försök igen.");
      if (result.error) return setError(result.error);
      onDone(result.ok ? `Paxningen på ${wish.title} är borttagen.` : `Paxningen på ${wish.title} var redan borttagen. Listan är uppdaterad.`);
    });
  };

  return (
    <Dialog ref={ref} role="alertdialog" title="Ta bort paxningen" aria-describedby={`${id}-text`} onClose={() => setError("")}>
      <div className="space-y-4">
        <div id={`${id}-text`} className="space-y-2">
          <p className="wrap-anywhere">
            <span className="font-semibold">{wish?.title}</span> är paxad av {wish?.claimedBy}.
          </p>
          <p>Är du säker? Ta bara bort paxningen på presenter du själv har paxat.</p>
        </div>
        <p role="alert" className="text-danger">
          {error}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => ref.current?.close()}>
            Avbryt
          </Button>
          <Button onClick={confirm} disabled={pending}>
            Ta bort
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
