"use client";

import { useRef } from "react";
import { IconButton } from "@/app/components/Button";
import { Dialog, type DialogHandle } from "@/app/components/Dialog";
import { InfoIcon } from "@/app/components/icons";

// Vad de tre statusarna betyder (MUPP-051-R2): ett i-tecken bredvid statustexten som öppnar en kort förklaring i ett kort
// (Dialog.tsx) som stängs med Esc, krysset eller ett tryck utanför.
export function StatusInfo() {
  const dialog = useRef<DialogHandle>(null);
  return (
    <>
      <IconButton label="Vad betyder statusen?" frameless onClick={(event) => dialog.current?.open(event.currentTarget)}>
        <InfoIcon />
      </IconButton>
      <Dialog ref={dialog} title="Vad betyder statusen?" form backdropClose>
        <dl className="space-y-3">
          <div>
            <dt className="font-heading font-semibold">Inaktiv</dt>
            <dd>Gruppen har ej startat.</dd>
          </div>
          <div>
            <dt className="font-heading font-semibold">Förbereder</dt>
            <dd>Deltagarna kan nu skapa önskelistor men har ej tilldelats en matchning.</dd>
          </div>
          <div>
            <dt className="font-heading font-semibold">Startad</dt>
            <dd>Deltagarna är matchade och kan se den andres lista, samt skicka meddelanden.</dd>
          </div>
        </dl>
      </Dialog>
    </>
  );
}
