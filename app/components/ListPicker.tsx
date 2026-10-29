"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

type Option = { value: string; label: string };

const MAX_HEIGHT = 256;
const GAP = 4;
const MARGIN = 8;

// Ett val ur en lista (MUPP-012), i stället för webbläsarens egen <select>, som ritas olika i varje
// webbläsare och i mobilläge hamnar uppe i hörnet. Mönstret är ARIA:s "select-only combobox": en knapp
// som öppnar en listbox. Värdet skickas med formuläret i ett dolt fält med fältets namn.
// Listan ritas i body och placeras med fixed mot fältet, så att en hopfälld panel (Fold.tsx) inte klipper den.
// Fokus flyttas till listan när den öppnas och tillbaka till knappen när den stängs.
export function ListPicker({
  id,
  name,
  options,
  defaultValue,
  labelledBy,
  describedBy,
  className,
}: {
  id: string;
  name: string;
  options: Option[];
  defaultValue: string;
  labelledBy: string;
  describedBy?: string;
  className: string;
}) {
  const listId = useId();
  const initial = options.some((o) => o.value === defaultValue) ? defaultValue : (options[0]?.value ?? "");
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", timer: 0 });
  const selected = options.findIndex((o) => o.value === value);

  // Formuläret nollställs när det sparats (React gör det med requestFormReset): då går valet tillbaka till det första
  useEffect(() => {
    const form = hidden.current?.form;
    const reset = () => setValue(initial);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initial]);

  // Under fältet, lika brett, eller ovanför om det inte får plats; följer med när sidan rullas eller storleken ändras
  useLayoutEffect(() => {
    const el = list.current;
    const field = button.current;
    if (!open || !el || !field) return;
    const place = (event?: Event) => {
      if (event?.target === el) return;
      const rect = field.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - GAP - MARGIN;
      const above = rect.top - GAP - MARGIN;
      el.style.maxHeight = "none";
      const natural = Math.min(el.scrollHeight, MAX_HEIGHT);
      const underneath = natural <= below || below >= above;
      const height = Math.min(natural, underneath ? below : above);
      el.style.maxHeight = `${height}px`;
      el.style.left = `${rect.left}px`;
      el.style.width = `${rect.width}px`;
      el.style.top = `${underneath ? rect.bottom + GAP : rect.top - GAP - height}px`;
      el.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = (index: number) => {
    setActive(index);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const choose = (index: number) => {
    setValue(options[index].value);
    close();
  };

  // Första bokstäverna som skrivs hittar nästa val som börjar så; en och samma bokstav upprepad går vidare i listan
  const find = (key: string, from: number) => {
    window.clearTimeout(typed.current.timer);
    typed.current.text += key.toLowerCase();
    typed.current.timer = window.setTimeout(() => (typed.current.text = ""), 500);
    const text = typed.current.text;
    const start = text.length === 1 ? from + 1 : from;
    for (let i = 0; i < options.length; i++) {
      const index = (start + i) % options.length;
      if (options[index].label.toLowerCase().startsWith(text)) return index;
    }
    return -1;
  };
  // Ett mellanslag mitt i ett ord som skrivs är en bokstav, annars öppnar eller väljer det
  const isCharacter = (event: KeyboardEvent) =>
    event.key.length === 1 && (event.key !== " " || typed.current.text !== "") && !event.ctrlKey && !event.metaKey && !event.altKey;

  const onButtonKey = (event: KeyboardEvent) => {
    if (isCharacter(event)) {
      const index = find(event.key, selected);
      if (index >= 0) show(index);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      show(Math.max(selected, 0));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      show(event.key === "Home" ? 0 : options.length - 1);
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1;
    if (event.key === "Tab") {
      // Väljer och låter Tab gå vidare från knappen
      setValue(options[active].value);
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (isCharacter(event)) {
      const index = find(event.key, active);
      if (index >= 0) setActive(index);
      event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      // Stannar här: annars fäller Fold.tsx ihop hela panelen
      event.stopPropagation();
      close();
    } else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "ArrowDown") setActive(Math.min(active + 1, last));
    else if (event.key === "ArrowUp") setActive(Math.max(active - 1, 0));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else return;
    event.preventDefault();
  };

  return (
    <>
      <input ref={hidden} type="hidden" name={name} value={value} />
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelledBy} ${id}`}
        aria-describedby={describedBy}
        // Öppen lista: knappen tar inte fokus från listan, så att listan inte stängs av fokusbytet innan klicket (Safari och Firefox ger inte knappen fokus)
        onMouseDown={(event) => open && event.preventDefault()}
        onClick={() => (open ? close() : show(Math.max(selected, 0)))}
        onKeyDown={onButtonKey}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <Chevron open={open} />
      </button>
      {open &&
        createPortal(
          <ul
            ref={list}
            id={listId}
            role="listbox"
            tabIndex={0}
            aria-labelledby={labelledBy}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            onBlur={(event) => {
              // Fokus lämnade listan (klick utanför eller annan flik): stäng utan att dra tillbaka fokus
              if (event.relatedTarget !== button.current) setOpen(false);
            }}
            style={{ position: "fixed", visibility: "hidden" }}
            className="z-50 overflow-y-auto rounded-control border border-muted/75 bg-card py-1 text-text shadow-card"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 ${index === active ? "bg-edge" : ""} ${index === selected ? "font-bold" : ""}`}
              >
                <span className="truncate">{option.label}</span>
                {index === selected && <Check />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-5 shrink-0 text-muted ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
