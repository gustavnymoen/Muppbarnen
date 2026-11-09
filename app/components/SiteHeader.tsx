import type { ReactNode } from "react";
import { SiteMenu } from "./SiteMenu";

export const SITE_NAME = "Muppbarnens önskelistor";

// Sidhuvudet på varje sida: bara menyn (TECH-006: sajtens namn syns inte som rubrik). På startsidan
// finns namnet kvar som en dold h1, så att sidan har en rubrik för skärmläsare; andra sidor har en egen h1.
export function SiteHeader({ home, onboarding, back }: { home?: boolean; onboarding?: boolean; back?: ReactNode }) {
  return (
    // back: en Tillbaka-knapp längst till vänster, mitt emot menyn (MUPP-047)
    <header className="flex items-center justify-between gap-3 pb-4">
      {back ?? <span />}
      {home && <h1 className="sr-only">{SITE_NAME}</h1>}
      <SiteMenu onboarding={onboarding} />
    </header>
  );
}
