"use client";

import { useId, useRef, useState, useTransition, type ComponentProps, type CSSProperties, type FormEvent, type Ref } from "react";
import { claimWishes } from "@/app/actions";
import type { ChildColor } from "@/lib/child-colors";
import type { Wish } from "@/lib/deck";
import { canClaim, webLink } from "@/lib/wishes";
import { Button, IconButton } from "./Button";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

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
// knapp som ligger kvar mitt i botten av listan: en pil upp på ett kort med ett barn (solo), annars en liten
// Stäng som tar tillbaka till kortet med flera barn eller Julafton (MUPP-013-R5, MUPP-005-R6, -R7).
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
  const dialog = useRef<HTMLDialogElement>(null);

  const toggle = (wishId: number) => setMarked((ids) => (ids.includes(wishId) ? ids.filter((i) => i !== wishId) : [...ids, wishId]));
  const claimed = (message: string) => {
    setMarked([]);
    setNotice(message);
    dialog.current?.close();
    // Paxa-knappen har försvunnit, så fokus går till knappen som fäller ihop listan
    document.getElementById(`${id}-knapp`)?.focus();
  };

  return (
    // Platsen finns bara medan listan är öppen; den går att scrolla med tangentbordet
    <div id={id} tabIndex={0} aria-label="Önskelista" role="region" className="wish-list flex min-h-0 flex-1 flex-col overflow-y-auto rounded-control border border-edge bg-page/40 px-3 py-1">
      {wishes.length === 0 ? (
        <p className="py-2 text-muted">Inga önskningar än.</p>
      ) : (
        <ul className="divide-y divide-edge">
          {wishes.map((wish) => (
            <WishRow key={wish.id} wish={wish} marked={marked.includes(wish.id)} onMark={() => toggle(wish.id)} />
          ))}
        </ul>
      )}
      {notice && (
        <p role="status" className="py-2 text-sm">
          {notice}
        </p>
      )}
      {/* Sitter kvar nere i mitten medan listan scrollar, så att den går att stänga var man än är i den; fokus hamnar här när listan öppnas */}
      <div className="sticky bottom-1 mt-auto flex items-center justify-center gap-3 pt-2">
        {marked.length > 0 && (
          <Button onClick={() => dialog.current?.showModal()} className="text-sm">
            Paxa ({marked.length})
          </Button>
        )}
        {solo ? (
          <IconButton id={`${id}-knapp`} label="Fäll ihop önskelistan" onClick={onToggle}>
            <ChevronUpIcon />
          </IconButton>
        ) : (
          <Button id={`${id}-knapp`} variant="secondary" onClick={onToggle} className="px-4 text-sm">
            Stäng<span className="sr-only"> önskelistan</span>
          </Button>
        )}
      </div>
      <ClaimDialog ref={dialog} wishes={wishes.filter((w) => marked.includes(w.id))} onDone={claimed} />
    </div>
  );
}

// En rad: rubriken med märken, en kryssruta om den går att paxa, och detaljerna när raden är utfälld (MUPP-005-R1–R3)
function WishRow({ wish, marked, onMark }: { wish: Wish; marked: boolean; onMark: () => void }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const link = webLink(wish.url);

  return (
    <li className="py-1 break-words">
      <div className="flex items-center gap-1">
        {canClaim(wish) && (
          <label className="flex min-h-11 min-w-11 shrink-0 items-center justify-center">
            <input type="checkbox" checked={marked} onChange={onMark} aria-label={wish.title} className="size-6 accent-brand" />
          </label>
        )}
        <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)} className="flex min-h-11 flex-1 items-center justify-between gap-2 text-left">
          <span className="flex flex-col">
            <span>{wish.title}</span>
            {wish.claimedBy !== null && <span className="text-sm font-semibold text-muted">Paxad</span>}
            {wish.unlimited && <span className="text-sm text-muted">Kan köpas flera gånger</span>}
          </span>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {open && (
        <div id={detailsId} className="space-y-1 pb-2 text-sm">
          {wish.claimedBy !== null && (
            <p>
              Paxad av {wish.claimedBy} {wish.claimedAt}
            </p>
          )}
          {wish.unlimited && <p>Den här presenten kan köpas flera gånger, så den går inte att paxa.</p>}
          {wish.description && <p className="whitespace-pre-line">{wish.description}</p>}
          {wish.size && <p>Storlek: {wish.size}</p>}
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

// Fönstret där besökaren skriver sitt namn och paxar de markerade presenterna (MUPP-005-R4, -R5).
// Fokus hamnar i namnfältet för att det är det första som går att fokusera i fönstret när showModal() körs.
// <dialog> med showModal() håller tangentbordet kvar i fönstret, stängs med Esc och ger fokus tillbaka till knappen.
function ClaimDialog({ ref, wishes, onDone }: { ref: Ref<HTMLDialogElement>; wishes: Wish[]; onDone: (message: string) => void }) {
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
    <dialog
      ref={ref}
      aria-labelledby={`${id}-titel`}
      aria-describedby={`${id}-text`}
      onClose={() => setError("")}
      className="m-auto w-[min(92vw,28rem)] rounded-card border border-edge bg-card p-5 text-text shadow-card backdrop:bg-black/70"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <h2 id={`${id}-titel`} className="font-heading text-xl font-semibold">
          {plural ? "Paxa presenterna" : "Paxa presenten"}
        </h2>
        <ul className="list-inside list-disc break-words">
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
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
            Avbryt
          </Button>
          <Button type="submit" disabled={pending}>
            Paxa
          </Button>
        </div>
      </form>
    </dialog>
  );
}
