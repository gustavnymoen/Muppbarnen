"use client";

import { useActionState, useId, useRef } from "react";
import { Button, IconButton } from "@/app/components/Button";
import { Dialog } from "@/app/components/Dialog";
import type { FormState } from "@/app/components/form-state";
import { PlusIcon } from "@/app/components/icons";
import { copyArchivedItem } from "../../actions";

// "+" på en arkiverad önskning (MUPP-031-R7): en dialog frågar vilken lista kopian ska läggas i. Listan är knappen
// som trycks (name="occasion"). Dialogen stängs när kopian är sparad, och fokus går då tillbaka till "+".
export function CopyItem({ itemId, title }: { itemId: number; title: string }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  // Stängs här och inte i en effekt: svaret "sparat" är samma objekt varje gång, så en effekt skulle bara se första kopian
  const [state, formAction, pending] = useActionState(async (previous: FormState, formData: FormData) => {
    const result = await copyArchivedItem(previous, formData);
    if (result?.saved) dialog.current?.close();
    return result;
  }, null);

  return (
    <>
      <IconButton compact label={`Lägg till ${title} igen`} onClick={() => dialog.current?.showModal()}>
        <PlusIcon />
      </IconButton>
      <Dialog ref={dialog} aria-labelledby={`${id}-titel`} aria-describedby={`${id}-text`}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="itemId" value={itemId} />
          <h2 id={`${id}-titel`} className="font-heading text-xl font-semibold">
            Lägg till ”{title}” igen
          </h2>
          <p id={`${id}-text`}>Vilken lista ska önskningen läggas i?</p>
          <p role="alert" className="text-danger">
            {state?.error}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" name="occasion" value="birthday" disabled={pending}>
              Födelsedag
            </Button>
            <Button type="submit" name="occasion" value="christmas" disabled={pending}>
              Julafton
            </Button>
            <Button type="button" variant="secondary" onClick={() => dialog.current?.close()}>
              Avbryt
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
