"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type Ref } from "react";
import { addGift } from "@/app/actions";
import { parseWish } from "@/lib/form-input";
import { Button, IconButton } from "./Button";
import { Dialog, type DialogHandle } from "./Dialog";
import { Field, FormStateContext } from "./Form";
import { ReturnIcon } from "./icons";
import { toast } from "./Toaster";
import { WishFields } from "./WishParts";

// Fönstret där en besökare lägger till en present som inte står i listan (MUPP-077): ett formulärkort (MUPP-045) med två steg i samma fönster.
// Steg 1 är presenten, med samma fält och gränser som när en förälder lägger till en önskning; steg 2 är besökarens namn. Båda stegen finns i
// formuläret hela tiden (steg 1 är bara dolt), så att det man skrivit finns kvar när man går tillbaka. Fönstret växer ur knappen och går dit tillbaka.
const GIFT_FIELDS = ["title", "size", "description", "url"];

export function AddGiftDialog({ ref, kidId, occasion, onDone }: { ref: Ref<DialogHandle>; kidId: number; occasion: string; onDone: (message: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  // Fokus följer steget: namnfältet i steg 2, presentens första fält när man går tillbaka. Ett fel får fokus först (R2).
  // Ett fel i dolda steg 1 hittas inte för sent: setStep(1) görs i samma uppdatering som felen sätts.
  useEffect(() => {
    const target = form.current?.querySelector<HTMLElement>("[aria-invalid=true]") ?? form.current?.querySelector<HTMLElement>(step === 2 ? "[name=name]" : "[name=title]");
    target?.focus();
  }, [step, errors]);

  const reset = () => {
    setStep(1);
    setErrors({});
    setError("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (field: string) => String(data.get(field) ?? "");
    const gift = { title: read("title"), size: read("size"), description: read("description"), url: read("url") };
    setError("");
    if (step === 1) {
      const checked = parseWish(gift);
      setErrors(checked.ok ? {} : checked.errors);
      if (checked.ok) setStep(2);
      return;
    }
    start(async () => {
      const result = await addGift({ childId: kidId, occasion, ...gift, name: read("name") }).catch(() => null);
      if (!result) return setError("Något gick fel. Försök igen.");
      if (result.ok) {
        const message = `${gift.title.trim()} lades till`;
        toast(message);
        return onDone(message);
      }
      setErrors(result.fields ?? {});
      setError(result.error ?? "");
      // Ett fel i presenten (någon hann ändra reglerna, eller bortom det klienten kontrollerar) visas där presenten står
      if (GIFT_FIELDS.some((field) => result.fields?.[field])) setStep(1);
    });
  };

  return (
    <Dialog ref={ref} form title={step === 1 ? "Lägg till en present" : "Ange ditt namn"} onClose={reset}>
      <FormStateContext value={{ fields: errors }}>
        <form ref={form} onSubmit={submit} noValidate className="space-y-4 pt-2">
          <div hidden={step !== 1} className="space-y-4">
            <p>En present till det här barnet som inte står i listan. Den läggs in som paxad, så att andra ser att den är tagen.</p>
            <WishFields />
          </div>
          <div hidden={step !== 2} className="space-y-4">
            <IconButton frameless label="Tillbaka" onClick={() => setStep(1)} className="-ml-3">
              <ReturnIcon />
            </IconButton>
            <Field name="name" label="Ditt namn" maxLength={60} autoComplete="off" />
          </div>
          <p role="alert" className="text-danger">
            {error}
          </p>
          <Button type="submit" busy={pending}>
            {step === 1 ? "Nästa" : "Lägg till"}
          </Button>
        </form>
      </FormStateContext>
    </Dialog>
  );
}
