"use client";

import { useActionState } from "react";
import { Button } from "@/app/components/Button";
import { login } from "./actions";

export function LoginForm({ target }: { target: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="till" value={target} />
      <div className="space-y-2">
        <label htmlFor="losenord" className="block font-heading font-medium">
          Lösenord
        </label>
        <input
          id="losenord"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state ? true : undefined}
          aria-describedby={state ? "losenord-fel" : undefined}
          className="min-h-11 w-full rounded-control border border-muted/75 bg-page px-4 text-text"
        />
        {/* role="alert" läses upp när felet dyker upp */}
        <p id="losenord-fel" role="alert" className="text-danger">
          {state?.error}
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        Öppna
      </Button>
    </form>
  );
}
