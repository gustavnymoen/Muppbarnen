"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";
import { TrashIcon } from "./icons";
import { SwitchButton } from "./SwitchButton";
import { toast } from "./Toaster";
import type { FormAction } from "./form-state";

// En papperskorgsknapp (eller, med switchLabel, en av/på-knapp i läget switchOn) som frågar innan den gör något som inte går att ångra. Frågan är ett kort (Dialog.tsx), som håller tangentbordet
// borta från sidan bakom, stängs med Esc och nämner vad det gäller. Fokus börjar på "Avbryt", så att Enter inte råkar bekräfta.
export function ConfirmAction({
  action,
  fields,
  label,
  subject,
  title,
  text,
  switchLabel,
  switchOn,
  big,
}: {
  action: FormAction;
  fields: Record<string, string>;
  label: string;
  subject: string;
  title: string;
  text: string;
  switchLabel?: string;
  switchOn?: boolean;
  // Papperskorgen är 44 px i stället för 32 px (en knapp i en utfälld rad, MUPP-070)
  big?: boolean;
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
      {switchLabel ? (
        <SwitchButton label={switchLabel} checked={switchOn ?? false} aria-label={`${switchLabel} ${subject}`} onClick={(event) => dialog.current?.open(event.currentTarget)} />
      ) : (
        <IconButton compact={!big} label={`${label} ${subject}`} onClick={(event) => dialog.current?.open(event.currentTarget)}>
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
