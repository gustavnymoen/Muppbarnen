"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button, IconButton } from "./Button";
import { Dialog } from "./Dialog";
import { TrashIcon } from "./icons";
import type { FormAction } from "./form-state";

// En papperskorgsknapp som frågar innan den gör något som inte går att ångra. Frågan är en modal
// dialog (<dialog>), som håller tangentbordet borta från sidan bakom, stängs med Esc och nämner vad det gäller.
// Fokus börjar på "Avbryt", så att Enter inte råkar bekräfta.
export function ConfirmAction({
  action,
  fields,
  label,
  subject,
  title,
  text,
}: {
  action: FormAction;
  fields: Record<string, string>;
  label: string;
  subject: string;
  title: string;
  text: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.saved) dialog.current?.close();
  }, [state]);

  return (
    <>
      <IconButton compact label={`${label} ${subject}`} onClick={() => dialog.current?.showModal()}>
        <TrashIcon />
      </IconButton>
      <Dialog ref={dialog} role="alertdialog" aria-labelledby={`${id}-titel`} aria-describedby={`${id}-text`}>
        <form action={formAction} className="space-y-4">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 id={`${id}-titel`} className="font-heading text-xl font-semibold">
            {title}
          </h2>
          <p id={`${id}-text`}>{text}</p>
          <p role="alert" className="text-danger">
            {state?.error}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => dialog.current?.close()}>
              Avbryt
            </Button>
            <Button type="submit" disabled={pending}>
              {label}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
