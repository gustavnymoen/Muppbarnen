"use client";

import { createContext, useActionState, useContext, useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { enterAction, FIELDS, savedMessage, type FieldKind, type Said } from "@/lib/form-card";
import { Button } from "./Button";
import { useCard } from "./Dialog";
import { ListPicker } from "./ListPicker";
import { toast } from "./Toaster";
import type { FormAction, FormState } from "./form-state";

const FormStateContext = createContext<FormState>(null);

// iOS Safari ger datumfältet en egen minimibredd; utan det här krymper det inte till formulärets bredd (MUPP-033)
const dateFit = "flex items-center min-w-0 max-w-full appearance-none text-left";
const control = "min-h-11 w-full rounded-control border border-muted/75 bg-page px-4 text-text";

const fieldsOf = (form: HTMLFormElement) => [...form.querySelectorAll<HTMLElement>(FIELDS)];
function kindOf(field: HTMLElement): FieldKind {
  if (field instanceof HTMLTextAreaElement) return "textarea";
  if (field instanceof HTMLButtonElement) return "list";
  const type = (field as HTMLInputElement).type;
  return type === "checkbox" || type === "file" ? type : "text";
}

// Ett formulär som körs av en serveråtgärd (useActionState), så att det också går att skicka
// utan script (utom i ett kort, som öppnas med script). Fel läses upp av skärmläsaren; felen per fält står vid fältet (Field).
// noValidate: serverns meddelanden är de som visas, på samma sätt för alla fält.
// I ett kort (Dialog.tsx, MUPP-045) gäller också: Enter går till nästa fält och skickar från det sista (R5); ett sparat formulär stänger kortet och
// säger det till skärmläsaren (R7), utom när again är satt (en ny önskning): då står kortet kvar med tomma fält, fokus i det första och en bekräftelse (R6);
// och ett misslyckat försök behåller kortet, med fokus på första felet. says är det som sägs: en text, eller namnet som skrevs i ett fält.
export function Form({ action, submit, says = "Sparat.", again, children, className = "space-y-4" }: { action: FormAction; submit: string; says?: Said; again?: boolean; children: ReactNode; className?: string }) {
  const card = useCard();
  const form = useRef<HTMLFormElement>(null);
  const sent = useRef<FormData | null>(null);
  const [state, formAction, pending] = useActionState(async (previous: FormState, formData: FormData) => {
    sent.current = formData;
    const result = await action(previous, formData);
    // Ett nytt objekt varje gång: "sparat" är samma konstant, så effekten nedan skulle annars bara se den första sparningen
    return result?.saved ? { ...result } : result;
  }, null);

  useEffect(() => {
    if (!state) return;
    if (!state.saved) {
      // Röd ruta bara för ett fel som formuläret självt har (servern); fel vid fälten syns vid fälten
      if (state.error) toast(state.error, true);
      // Misslyckat i ett kort: första fältet med fel, annars varningen längst ner
      const target = form.current?.querySelector<HTMLElement>("[aria-invalid=true]") ?? form.current?.querySelector<HTMLElement>("[role=alert]:not(:empty)");
      return card ? target?.focus() : undefined;
    }
    const read = (field: string) => String(sent.current?.get(field) ?? "");
    // En ny önskning får kort titel i meddelandet, så att det får plats på en rad
    const message = savedMessage(again && typeof says !== "string" ? { ...says, short: true } : says, read);
    toast(message);
    if (state.notice) toast(state.notice, true);
    if (!card) return;
    if (!again) return card.close(savedMessage(says, read));
    card.confirm(message);
    card.focusFirst();
    // card är ett nytt objekt vid varje rendering av kortet; det är svaret som ska sätta effekten igång, inte kortet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Enter-knappen på en telefon: "Nästa" i alla textfält utom det sista, där den säger "Klar" (R5)
  useLayoutEffect(() => {
    if (!card || !form.current) return;
    const fields = fieldsOf(form.current);
    const kinds = fields.map(kindOf);
    fields.forEach((field, i) => {
      if (kinds[i] === "text") field.enterKeyHint = enterAction(kinds, i).do === "submit" ? "done" : "next";
    });
  });

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!card || event.key !== "Enter") return;
    const fields = fieldsOf(event.currentTarget);
    // keyCode 229: Safari skickar Enter som avslutar ett ord efter att ordet är färdigskrivet
    const composing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
    const next = enterAction(fields.map(kindOf), fields.indexOf(event.target as HTMLElement), composing);
    if (next.do === "default") return;
    event.preventDefault();
    if (next.do === "focus") fields[next.index].focus();
    else if (!pending) event.currentTarget.requestSubmit();
  };

  return (
    <form ref={form} action={formAction} noValidate onKeyDown={onKeyDown} className={className}>
      <FormStateContext value={state}>{children}</FormStateContext>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {submit}
        </Button>
        {!card && (
          <p role="status" className="sr-only">
            {state?.saved ? "Sparat." : ""}
          </p>
        )}
      </div>
      <p role="alert" tabIndex={-1} className="text-danger">
        {state?.error}
      </p>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: "text" | "password" | "tel" | "email" | "date" | "textarea" | "checkbox" | "select" | "file";
  defaultValue?: string;
  defaultChecked?: boolean;
  options?: { value: string; label: string }[];
  maxLength?: number;
  required?: boolean;
  hint?: string;
  max?: string;
  accept?: string;
  autoComplete?: string;
};

// Ett fält med etikett och fel. Efter ett misslyckat försök visas det som skrevs (state.values),
// annars värdet från servern. key gör att fältet byggs om med det nya värdet.
export function Field({ name, label, type = "text", defaultValue = "", defaultChecked = false, options, maxLength, required, hint, max, accept, autoComplete }: FieldProps) {
  const id = useId();
  const state = useContext(FormStateContext);
  const error = state?.fields?.[name];
  const value = state?.values?.[name] ?? defaultValue;
  const checked = state?.values ? name in state.values : defaultChecked;
  const describedBy = [hint && `${id}-tips`, `${id}-fel`].filter(Boolean).join(" ");
  const common = {
    id,
    name,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  const message = (
    <p id={`${id}-fel`} role="alert" className="text-danger">
      {error}
    </p>
  );
  const hintText = hint && (
    <p id={`${id}-tips`} className="text-sm text-muted">
      {hint}
    </p>
  );

  if (type === "checkbox") {
    return (
      <div className="space-y-1">
        <div className="flex min-h-11 items-center gap-3">
          <input key={String(checked)} type="checkbox" {...common} defaultChecked={checked} className="size-6 accent-brand" />
          <label htmlFor={id}>{label}</label>
        </div>
        {hintText}
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label id={`${id}-etikett`} htmlFor={id} className="block font-heading font-medium">
        {label}
      </label>
      {hintText}
      {type === "textarea" ? (
        <textarea key={value} {...common} defaultValue={value} maxLength={maxLength} rows={3} className={`${control} py-2`} />
      ) : type === "select" ? (
        <ListPicker key={value} id={id} name={name} options={options ?? []} defaultValue={value} labelledBy={`${id}-etikett`} describedBy={describedBy} className={control} />
      ) : type === "file" ? (
        <input {...common} type="file" accept={accept} className={`${control} py-2`} />
      ) : (
        <input key={value} {...common} type={type} defaultValue={value} maxLength={maxLength} max={max} autoComplete={autoComplete} className={type === "date" ? `${control} ${dateFit}` : control} />
      )}
      {message}
    </div>
  );
}
