"use client";

import { createContext, useActionState, useContext, useEffect, useId, type ReactNode } from "react";
import { Button } from "./Button";
import { useFold } from "./Fold";
import type { FormAction, FormState } from "./form-state";

const FormStateContext = createContext<FormState>(null);

const control = "min-h-11 w-full rounded-control border border-muted/75 bg-page px-4 text-text";

// Ett formulär som körs av en serveråtgärd (useActionState), så att det också går att skicka
// utan script (utom i en hopfälld panel, som öppnas med script). Sparat och fel läses upp av skärmläsaren; felen per fält står vid fältet (Field).
// noValidate: serverns meddelanden är de som visas, på samma sätt för alla fält.
// I en hopfälld panel (Fold.tsx) fälls panelen ihop när formuläret sparats, utom med keepOpen
// (storlekarna, där "Sparat." ska läsas upp).
export function Form({ action, submit, children, className = "space-y-4", keepOpen }: { action: FormAction; submit: string; children: ReactNode; className?: string; keepOpen?: boolean }) {
  const [state, formAction, pending] = useActionState(action, null);
  const close = useFold()?.close;
  useEffect(() => {
    if (state?.saved && !keepOpen) close?.();
  }, [state, keepOpen, close]);
  return (
    <form action={formAction} noValidate className={className}>
      <FormStateContext value={state}>{children}</FormStateContext>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {submit}
        </Button>
        <p role="status" className="text-muted">
          {state?.saved ? "Sparat." : ""}
        </p>
      </div>
      <p role="alert" className="text-danger">
        {state?.error}
      </p>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: "text" | "password" | "date" | "textarea" | "checkbox" | "select" | "file";
  defaultValue?: string;
  defaultChecked?: boolean;
  options?: { value: string; label: string }[];
  maxLength?: number;
  required?: boolean;
  hint?: string;
  accept?: string;
  autoComplete?: string;
};

// Ett fält med etikett och fel. Efter ett misslyckat försök visas det som skrevs (state.values),
// annars värdet från servern. key gör att fältet byggs om med det nya värdet.
export function Field({ name, label, type = "text", defaultValue = "", defaultChecked = false, options, maxLength, required, hint, accept, autoComplete }: FieldProps) {
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
      <label htmlFor={id} className="block font-heading font-medium">
        {label}
      </label>
      {hintText}
      {type === "textarea" ? (
        <textarea key={value} {...common} defaultValue={value} maxLength={maxLength} rows={3} className={`${control} py-2`} />
      ) : type === "select" ? (
        <select key={value} {...common} defaultValue={value} className={control}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "file" ? (
        <input {...common} type="file" accept={accept} className={`${control} py-2`} />
      ) : (
        <input key={value} {...common} type={type} defaultValue={value} maxLength={maxLength} autoComplete={autoComplete} className={control} />
      )}
      {message}
    </div>
  );
}
