import type { ReactNode } from "react";
import { buttonClass } from "./Button";

// Ett formulär som fälls ut av en knapp. <details> fungerar med tangentbord och
// skärmläsare utan script. subject är det knappen gäller, när det inte syns i texten.
export function Disclosure({ label, subject, children }: { label: string; subject?: string; children: ReactNode }) {
  return (
    <details className="space-y-4 open:w-full">
      <summary
        aria-label={subject ? `${label} ${subject}` : undefined}
        className={`${buttonClass("secondary")} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {label}
      </summary>
      {children}
    </details>
  );
}
