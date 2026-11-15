import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IconLink } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { parseId } from "@/lib/form-input";
import { entranceEvents, entranceMembers, findMember, signedInMembers } from "@/lib/santa-auth";
import { requireSiteSession } from "@/lib/site-auth";
import { EscBack } from "./EscBack";
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

// Tre steg i adressen: gruppen (hoppas över med en enda), namnet, och sedan inloggningen. Bara namn visas här.
async function Entrance({ searchParams }: { searchParams: PageProps<"/secret-santa">["searchParams"] }) {
  await requireSiteSession();
  const query = await searchParams;
  const signedIn = await signedInMembers();
  const wanted = parseId(first(query.grupp));
  // Inloggad i gruppen i adressen: rakt till sidan. Utan grupp i adressen och med en enda inloggning är det den gruppen, som förut; ?val=grupp (pilen
  // på den egna sidan) hoppar över det så att en annan grupp kan väljas (MUPP-079-R3)
  const already = wanted !== null ? signedIn.find((m) => m.eventId === wanted) : query.val === undefined && signedIn.length === 1 ? signedIn[0] : undefined;
  if (already) redirect(`/secret-santa/min-sida?grupp=${already.eventId}`);

  const events = await entranceEvents();
  const event = events.find((e) => e.id === wanted) ?? (events.length === 1 ? events[0] : undefined);
  const members = event ? await entranceMembers(event.id) : [];
  const chosen = parseId(first(query.person));
  const member = event && members.some((m) => m.memberId === chosen) && chosen !== null ? await findMember(chosen) : undefined;

  // Från inloggningen tillbaka till namnen; från namnen till grupperna, eller till startsidan när det bara finns en grupp (MUPP-048-R8)
  const backHref = !event ? undefined : member ? `/secret-santa?grupp=${event.id}` : events.length > 1 ? "/secret-santa?val=grupp" : "/";

  return (
    <Page
      back={
        backHref && (
          <IconLink label="Tillbaka" href={backHref}>
            <ReturnIcon />
          </IconLink>
        )
      }
    >
      {backHref && <EscBack href={backHref} />}
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <Heading level={1}>Secret Santa</Heading>
          {events.length === 0 && <p className="text-muted">Det finns inga grupper ännu.</p>}
          {!event && events.length > 1 && (
            <>
              <p>Vilken grupp är du med i?</p>
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link href={`/secret-santa?grupp=${e.id}`} className={`${tile} w-full`}>
                      {e.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {event && !member && (
            <>
              <p>Vem är du i {event.name}?</p>
              <ul className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <li key={m.memberId} className="flex">
                    <Link href={`/secret-santa?grupp=${event.id}&person=${m.memberId}`} className={`${tile} w-full`}>
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {event && member && (
            <>
              <p>
                Hej <strong>{member.name}</strong>, ange ditt telefonnummer eller e-post för att komma vidare
              </p>
              <SignInForm memberId={member.id} />
            </>
          )}
        </div>
      </PageContent>
    </Page>
  );
}
