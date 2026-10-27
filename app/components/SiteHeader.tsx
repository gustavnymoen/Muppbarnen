import Link from "next/link";
import { SiteMenu } from "./SiteMenu";

export const SITE_NAME = "Muppbarnens önskelistor";

// Sidhuvudet på varje sida: sajtens namn (en länk till startsidan) och menyn.
// På startsidan är namnet sidans enda h1; på andra sidor har de en egen h1.
export function SiteHeader({ home }: { home?: boolean }) {
  const name = (
    <Link href="/" className="font-heading text-xl font-semibold">
      {SITE_NAME}
    </Link>
  );
  return (
    <header className="flex items-center justify-between gap-3 pb-4">
      {home ? <h1>{name}</h1> : <p>{name}</p>}
      <SiteMenu />
    </header>
  );
}
