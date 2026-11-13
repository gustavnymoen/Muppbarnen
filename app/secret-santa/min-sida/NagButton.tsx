"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/app/components/Button";
import { AngryTomteIcon } from "@/app/components/icons";
import type { NagState } from "@/lib/santa-nag";
import { nagForList } from "../nag-actions";

// Tjatknappen under "Inga önskningar ännu." (MUPP-071). Låst medan mejlet väntar och en timme efter att det skickats; texten säger varför,
// så att läget inte bara visas av en nedtonad färg. Servern kontrollerar allt en gång till.
const LABELS: Record<NagState, string> = { free: "Tjata in en lista", queued: "Tjatet är på väg", recent: "Du har tjatat nyss" };

export function NagButton({ state }: { state: NagState }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const press = () =>
    startTransition(async () => {
      const result = await nagForList();
      setError(result.ok ? "" : (result.error ?? ""));
      router.refresh();
    });
  return (
    <div className="flex flex-col items-center space-y-2">
      <Button variant="red" disabled={state !== "free" || pending} onClick={press}>
        <AngryTomteIcon />
        {LABELS[state]}
      </Button>
      <p role="alert" className="text-danger">
        {error}
      </p>
    </div>
  );
}
