"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/Button";
import { signIn } from "./actions";

const choice = "flex min-h-11 flex-1 items-center gap-3 rounded-control border border-muted/75 px-3";

// Telefon är förvalt. Ett byte tömmer fältet, ger det rätt tangentbord och flyttar markören dit,
// så att man kan börja skriva direkt (MUPP-039-R4b).
export function SignInForm({ memberId }: { memberId: number }) {
  const [state, action, pending] = useActionState(signIn, null);
  const [kind, setKind] = useState<"phone" | "email">("phone");
  const field = useRef<HTMLInputElement>(null);
  // Också efter ett svar, eftersom formuläret då töms
  useEffect(() => field.current?.focus(), [kind, state]);

  const phone = kind === "phone";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="memberId" value={memberId} />
      <fieldset className="space-y-2">
        <legend className="mb-2 font-heading font-medium">Logga in med</legend>
        <div className="flex gap-2">
          {(["phone", "email"] as const).map((option) => (
            <label key={option} className={choice}>
              <input type="radio" name="kind" value={option} checked={kind === option} onChange={() => setKind(option)} className="size-5 accent-brand" />
              {option === "phone" ? "Telefon" : "E-post"}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <label htmlFor="santa-varde" className="block font-heading font-medium">
          {phone ? "Ditt telefonnummer" : "Din e-postadress"}
        </label>
        <input
          key={kind}
          ref={field}
          id="santa-varde"
          name="value"
          type={phone ? "tel" : "email"}
          inputMode={phone ? "tel" : "email"}
          autoComplete={phone ? "tel" : "email"}
          required
          maxLength={254}
          aria-invalid={state ? true : undefined}
          aria-describedby="santa-fel"
          className="min-h-11 w-full rounded-control border border-muted/75 bg-page px-4 text-text"
        />
        {/* role="alert" läses upp när felet dyker upp */}
        <p id="santa-fel" role="alert" className="text-danger">
          {state?.error}
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        Fortsätt
      </Button>
    </form>
  );
}
