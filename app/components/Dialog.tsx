"use client";

import { createContext, useContext, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type MouseEvent, type Ref } from "react";
import { flushSync } from "react-dom";
import { CONFIRMATION_MS, FIELDS } from "@/lib/form-card";
import { IconButton } from "./Button";
import { CrossIcon } from "./icons";
import { dropGhost, fadeAway, growFade, growScale, makeGhost, originOf, shrinkTo } from "./transition";

// Alla rutor och formulärkort på sajten (MUPP-045): det enda stället som öppnar och stänger dem och spelar rörelsen.
// Ett kort växer ur knappen som trycktes och viker sig tillbaka i den (transition.ts); utan en knapp att växa ur tonar det bara.
// Innehållet finns bara medan kortet är öppet, så att ett formulär börjar om varje gång.
// Ett formulärkort (form) har ett kryss uppe till höger, ligger överst på skärmen, sätter fokus i första fältet och stängs inte av ett tryck på bakgrunden.
// De andra (frågor och information) behåller sina knappar; backdropClose gör att ett tryck på bakgrunden stänger dem (MUPP-035).

export type DialogHandle = {
  // from: knappen som trycktes (kortet växer ur den, och fokus går tillbaka till den)
  open: (from?: HTMLElement | null) => void;
  // announce: det en skärmläsare får höra när kortet stängts ("Otis sparades")
  close: (announce?: string) => void;
};

// Det innehållet i ett kort kan göra med kortet (Form.tsx): stänga det, visa en bekräftelse överst och flytta fokus till första fältet
type Card = { close: (announce?: string) => void; confirm: (text: string) => void; focusFirst: () => void };
const CardContext = createContext<Card | null>(null);
// Null utanför ett kort (en sida med ett formulär)
export const useCard = () => useContext(CardContext);

// Fälten där det som står där markeras, så att det som skrivs ersätter det
const SELECTABLE = new Set(["text", "tel", "email", "password", "search", "url"]);

function focusFirst(card: HTMLElement) {
  const field = card.querySelector<HTMLElement>(FIELDS);
  if (!field) return;
  field.focus();
  if (field instanceof HTMLTextAreaElement || (field instanceof HTMLInputElement && SELECTABLE.has(field.type))) field.select();
}

type Props = Omit<ComponentProps<"dialog">, "title" | "ref" | "onClose"> & {
  ref?: Ref<DialogHandle>;
  title: string;
  form?: boolean;
  // Ett formulärkort som ligger mitt på skärmen i stället för överst (chatten)
  centered?: boolean;
  // Sätter inte fokus i första fältet när kortet öppnas, så att tangentbordet på en telefon inte öppnas av sig självt (chatten, MUPP-068)
  noAutofocus?: boolean;
  backdropClose?: boolean;
  // Öppnas av sig själv första gången (utan knapp att växa ur)
  defaultOpen?: boolean;
  onClose?: () => void;
};

export function Dialog({ ref, title, form, centered, noAutofocus, backdropClose, defaultOpen, onClose, className = "", children, ...props }: Props) {
  const id = useId();
  const el = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const noteTimers = useRef<number[]>([]);
  const pressedBackdrop = useRef(false);
  const [shown, setShown] = useState(!!defaultOpen);
  const [said, setSaid] = useState("");
  const [noted, setNoted] = useState("");

  const open = (from?: HTMLElement | null) => {
    if (el.current?.open) return;
    opener.current = from ?? null;
    setSaid("");
    // flushSync: kortet ritas, visas och får fokus innan open() returnerar, alltså i samma tryck, så att iOS Safari visar tangentbordet (R4)
    flushSync(() => setShown(true));
  };

  // Kortet visas så snart innehållet finns i DOM, och fokus sätts här och inte efter rörelsen
  useLayoutEffect(() => {
    const card = el.current;
    if (!shown || !card || card.open) return;
    dropGhost();
    card.showModal();
    const from = opener.current;
    if (from?.isConnected) growScale(card, originOf(from));
    else growFade(card);
    if (form && !noAutofocus) focusFirst(card);
  }, [shown, form, noAutofocus]);

  const close = (announce?: string) => {
    const card = el.current;
    if (!card?.open) return;
    const from = opener.current;
    const section = card.closest("section");
    // Kopian tas innan kortet försvinner; det är den som rör sig
    makeGhost(card);
    card.close();
    noteTimers.current.forEach(window.clearTimeout);
    if (from?.isConnected) {
      from.focus();
      shrinkTo(from);
    } else {
      // Knappen finns inte kvar: fokus går till rubriken för avsnittet den stod i, aldrig till sidans topp
      fadeAway();
      const heading = section?.querySelector<HTMLElement>("h1, h2, h3, h4");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
    setShown(false);
    setNoted("");
    if (announce) setSaid(announce);
    onClose?.();
  };

  // Bekräftelsen efter en ny önskning för skärmläsaren (den som syns är Toaster.tsx): står kvar CONFIRMATION_MS; en ny tar över och börjar om
  const confirm = (text: string) => {
    noteTimers.current.forEach(window.clearTimeout);
    setNoted(text);
    noteTimers.current = [window.setTimeout(() => setNoted(""), CONFIRMATION_MS)];
  };

  // Efter en ny önskning: fokus tillbaka i första fältet
  const refocus = () => {
    if (el.current) focusFirst(el.current);
  };

  useImperativeHandle(ref, () => ({ open, close }));
  useEffect(() => () => noteTimers.current.forEach(window.clearTimeout), []);

  // Ett fält som får fokus senare (Tab, Enter) ska synas i kortet, också med tangentbordet uppe
  const onFocus = (event: FocusEvent<HTMLDialogElement>) => {
    if (form && event.target !== event.currentTarget) event.target.scrollIntoView({ block: "nearest" });
  };

  // Ett tryck på den mörka bakgrunden landar på <dialog> självt, utanför kortet; trycket ska också ha börjat där (markera text som släpps utanför ska inte stänga)
  const onMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressedBackdrop.current = event.target === event.currentTarget;
  };
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (backdropClose && pressedBackdrop.current && (x < box.left || x > box.right || y < box.top || y > box.bottom)) close();
  };

  return (
    <>
      <dialog
        {...props}
        ref={el}
        aria-labelledby={`${id}-titel`}
        // Esc: kortet viker sig i knappen. Är en lista (ListPicker) öppen är det den som stängs, inte kortet.
        onCancel={(event) => {
          event.preventDefault();
          if (!el.current?.querySelector("[aria-haspopup=listbox][aria-expanded=true]")) close();
        }}
        // Tangenttryck och svep inuti kortet ska inte nå kortleken bakom (Esc ska stänga kortet, inte önskelistan)
        onKeyDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
        onClick={onClick}
        // <dialog> centrerar sin text som standard; texten ska stå vänsterställd
        className={`w-[min(92vw,28rem)] text-left rounded-card border border-edge bg-card p-5 text-text shadow-card backdrop:bg-black/70 ${form && !centered ? "mx-auto mt-4 mb-auto" : "m-auto"} ${className}`}
      >
        {shown && (
          <CardContext value={{ close, confirm, focusFirst: refocus }}>
            <div className={`flex items-start justify-between gap-2 ${form ? "" : "mb-4"}`}>
              <h2 id={`${id}-titel`} className="min-w-0 flex-1 font-heading text-xl font-semibold break-words">
                {title}
              </h2>
              {/* Kryssets träffyta är 44 px; marginalen drar ikonen åt hörnet så att den ligger i linje med kortets kant */}
              {form && (
                <IconButton frameless label="Stäng" onClick={() => close()} className="-mr-3 -mt-2 shrink-0">
                  <CrossIcon />
                </IconButton>
              )}
            </div>
            {form && (
              <p role="status" className="sr-only">
                {noted}
              </p>
            )}
            {children}
          </CardContext>
        )}
      </dialog>
      {/* Det en skärmläsare hör när ett kort stängts efter en sparning; kortet själv är dolt då. aria-live och ingen roll: ett kort på varje rad ger inte en lista av tomma statusrader */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </p>
    </>
  );
}
