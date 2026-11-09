import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IconLink, LinkButton } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { parseId } from "@/lib/form-input";
import { entranceFamilies, entranceMembers, currentSantaPerson, findPerson } from "@/lib/santa-auth";
import { requireSiteSession } from "@/lib/site-auth";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Secret Santa" };

const tile =
  "press enter flex min-h-12 items-center justify-center rounded-control border border-edge bg-card px-3 py-1 text-center font-heading font-medium break-words shadow-card hover:bg-edge";

export default function EntrancePage({ searchParams }: PageProps<"/secret-santa">) {
  return (
    <Suspense fallback={null}>
      <Entrance searchParams={searchParams} />
    </Suspense>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Tre steg i adressen: familj (hoppas över med en enda), namn, och sedan inloggningen. Bara namn visas här.
async function Entrance({ searchParams }: { searchParams: PageProps<"/secret-santa">["searchParams"] }) {
  await requireSiteSession();
  if (await currentSantaPerson()) redirect("/secret-santa/min-sida");

  const query = await searchParams;
  const families = await entranceFamilies();
  const wanted = parseId(first(query.familj));
  const family = families.find((f) => f.id === wanted) ?? (families.length === 1 ? families[0] : undefined);
  const members = family ? await entranceMembers(family.id) : [];
  const chosen = parseId(first(query.person));
  const person = family && members.some((m) => m.personId === chosen) && chosen !== null ? await findPerson(chosen) : undefined;

  const backHref = family ? `/secret-santa?familj=${family.id}` : "/secret-santa";

  return (
    <Page
      back={
        family && person && (
          <IconLink label="Tillbaka" href={backHref}>
            <ReturnIcon />
          </IconLink>
        )
      }
    >
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <Heading level={1}>Secret Santa</Heading>
          {families.length === 0 && <p className="text-muted">Det finns inga familjer ännu.</p>}
          {!family && families.length > 1 && (
            <>
              <p>Vilken familj är du med i?</p>
              <ul className="space-y-2">
                {families.map((f) => (
                  <li key={f.id}>
                    <Link href={`/secret-santa?familj=${f.id}`} className={`${tile} w-full`}>
                      {f.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {family && !person && (
            <>
              <p>Vem är du i {family.name}?</p>
              <ul className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <li key={m.personId} className="flex">
                    <Link href={`/secret-santa?familj=${family.id}&person=${m.personId}`} className={`${tile} w-full`}>
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {families.length > 1 && <LinkButton href="/secret-santa">Byt familj</LinkButton>}
            </>
          )}
          {family && person && (
            <>
              <p>
                Hej <strong>{person.name}</strong>, ange ditt telefonnummer eller e-post för att komma vidare
              </p>
              <SignInForm personId={person.id} backHref={backHref} />
            </>
          )}
        </div>
      </PageContent>
    </Page>
  );
}
