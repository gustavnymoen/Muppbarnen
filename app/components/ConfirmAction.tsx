"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";
import { TrashIcon } from "./icons";
import { toast } from "./Toaster";
import type { FormAction } from "./form-state";

// En papperskorgsknapp (eller en textknapp, med buttonText) som frågar innan den gör något som inte går att ångra. Frågan är ett kort (Dialog.tsx), som håller tangentbordet
// borta från sidan bakom, stängs med Esc och nämner vad det gäller. Fokus börjar på "Avbryt", så att Enter inte råkar bekräfta.
export function ConfirmAction({
  action,
  fields,
  label,
  subject,
  title,
  text,
  buttonText,
}: {
  action: FormAction;
  fields: Record<string, string>;
  label: string;
  subject: string;
  title: string;
  text: string;
  buttonText?: string;
}) {
  const id = useId();
  const dialog = useRef<DialogHandle>(null);
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.saved) {
      dialog.current?.close();
      if (state.notice) toast(state.notice, true);
    } else if (state?.error) toast(state.error, true);
  }, [state]);

  return (
    <>
      {buttonText ? (
        <Button variant="secondary" aria-label={`${label} ${subject}`} onClick={(event) => dialog.current?.open(event.currentTarget)}>
          {buttonText}
        </Button>
      ) : (
        <IconButton compact label={`${label} ${subject}`} onClick={(event) => dialog.current?.open(event.currentTarget)}>
          <TrashIcon />
        </IconButton>
      )}
      <Dialog ref={dialog} role="alertdialog" title={title} aria-describedby={`${id}-text`}>
        <form action={formAction} className="space-y-4">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
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
