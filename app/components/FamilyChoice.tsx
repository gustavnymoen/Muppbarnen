"use client";

import { useRef, useState, type MouseEvent } from "react";
import { chooseFamilies } from "@/app/actions";
import type { FamilyChoice } from "@/lib/family-choice";
import type { FamilyOption } from "@/lib/family-view";
import { IconButton } from "./Button";
import { Card } from "./Card";
import { Dialog, type DialogHandle } from "./Dialog";
import { CheckGroup, Form } from "./Form";
import { FamilyFilterIcon } from "./icons";
import { Heading } from "./Page";

// Besökarens val av familjer (MUPP-080): en knapp uppe till vänster som visar vad som är valt, ett kort som ber om ett val
// innan något visas, och rutan där man väljer. Valet sparas av chooseFamilies (app/actions.ts) och sidorna ritas om av servern.

// Samma rubrik på kortet och i rutan
const TITLE = "Vilken familj tillhör du?";

// Vad knappen säger: "Alla", familjens namn, eller hur många som är valda
const summary = (families: FamilyOption[], chosen: Exclude<FamilyChoice, null>) =>
  chosen === "all" ? "Alla" : chosen.length === 1 ? (families.find((f) => f.id === chosen[0])?.name ?? "1 vald") : `${chosen.length} valda`;

function useChoiceDialog() {
  const dialog = useRef<DialogHandle>(null);
  return { dialog, open: (event: MouseEvent<HTMLElement>) => dialog.current?.open(event.currentTarget) };
}

export function FamilyButton({ families, chosen }: { families: FamilyOption[]; chosen: Exclude<FamilyChoice, null> }) {
  const { dialog, open } = useChoiceDialog();
  const now = summary(families, chosen);
  return (
    <>
      {/* En ikonknapp; på bred skärm står valet bredvid ikonen */}
      <IconButton label={`Familj: ${now}`} text={now} aria-haspopup="dialog" onClick={open}>
        <FamilyFilterIcon />
      </IconButton>
      <ChoiceDialog ref={dialog} families={families} chosen={chosen} />
    </>
  );
}

// Kortet som visas i stället för barnen eller Secret Santa tills besökaren har valt: som ett barnkort (samma ram, bredd, höjd och plats mitt på ytan,
// men utan bläddringsknappar) med valen listade från början. fill: på startsidan, där karusellen annars fyller ytan.
export function FamilyCard({ families, fill }: { families: FamilyOption[]; fill?: boolean }) {
  const card = (
    <Card as="section" aria-labelledby="valj-familj" highlight="sky" className={`flex flex-col justify-center gap-4 px-6 pb-6 pt-6 ${fill ? "h-full max-h-[40rem] overflow-y-auto" : ""}`}>
      <Heading level={2} small>
        <span id="valj-familj">{TITLE}</span>
      </Heading>
      <ChoiceForm families={families} chosen={null} />
    </Card>
  );
  return fill ? <div className="mx-auto h-full w-full max-w-md px-8 py-4">{card}</div> : <div className="mx-auto w-full max-w-md">{card}</div>;
}

function ChoiceDialog({ ref, families, chosen }: { ref: React.Ref<DialogHandle>; families: FamilyOption[]; chosen: FamilyChoice }) {
  return (
    <Dialog ref={ref} form belowHeader backdropClose title={TITLE}>
      <ChoiceForm families={families} chosen={chosen} />
    </Dialog>
  );
}

// Samma text och samma val överallt: på kortet innan något är valt och i rutan från knappen på startsidan och i Secret Santa, så att det syns att det är en inställning för hela sajten
function ChoiceForm({ families, chosen }: { families: FamilyOption[]; chosen: FamilyChoice }) {
  return (
    <Form action={chooseFamilies} submit="Spara" says="Dina familjer sparades">
      <p className="text-muted">Välj de familjer vars barn och Secret Santa du vill se. Det är bara en filtrering, och du kan ändra den när som helst.</p>
      <Fields families={families} chosen={chosen} />
    </Form>
  );
}

// Alla och familjerna utesluter varandra: en familj avmarkerar Alla, och Alla avmarkerar familjerna
function Fields({ families, chosen }: { families: FamilyOption[]; chosen: FamilyChoice }) {
  const [all, setAll] = useState(chosen === "all");
  const [ids, setIds] = useState<number[]>(Array.isArray(chosen) ? chosen : []);
  const toggle = (id: number, on: boolean) => {
    setAll(false);
    setIds(on ? [...ids, id] : ids.filter((i) => i !== id));
  };
  return (
    <CheckGroup name="families" label="Familjer" hideLabel>
      <Row name="all" label="Alla" description="Visa allt, också familjer som läggs till" checked={all} onChange={(on) => {
          setAll(on);
          if (on) setIds([]);
        }} />
      {families.map((f) => (
        <Row key={f.id} name={`family-${f.id}`} label={f.name} description={f.description} checked={ids.includes(f.id)} onChange={(on) => toggle(f.id, on)} />
      ))}
    </CheckGroup>
  );
}

function Row({ name, label, description, checked, onChange }: { name: string; label: string; description: string; checked: boolean; onChange: (on: boolean) => void }) {
  const id = `val-${name}`;
  return (
    <div className="flex min-h-11 items-center gap-3 py-1">
      <input id={id} type="checkbox" name={name} checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-6 shrink-0 accent-brand" />
      <label htmlFor={id} className="min-w-0 flex-1">
        {label}
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
    </div>
  );
}
