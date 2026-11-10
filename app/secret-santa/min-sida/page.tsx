import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { IconButton, IconLink } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { ChecklistIcon, CrossIcon, ReturnIcon, SantaHatIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { currentSantaMember, entranceEvents } from "@/lib/santa-auth";
import { matchOf } from "@/lib/santa-match";
import { requireSiteSession } from "@/lib/site-auth";
import { leave } from "../actions";

export const metadata: Metadata = { title: "Din Secret Santa-sida" };

export default function OwnPage() {
  return (
    <Suspense fallback={null}>
      <Own />
    </Suspense>
  );
}

// Sidan har ingen adress per person: vem du är kommer bara ur kakan, så ingen annans sida går att be om (MUPP-039-R6).
// Vad som visas följer gruppens status (MUPP-051-R5, R6, MUPP-042-R1): i en startad grupp är det andra kortet länken till matchningens lista.
async function Own() {
  await requireSiteSession();
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  // Med flera grupper loggar pilen ut ur gruppen så att en annan kan väljas; med en enda finns inget att välja, så korset går
  // bara till startsidan och lämnar inloggningen kvar. Ingen kan byta till någon annans sida härifrån (MUPP-055-R1)
  const severalGroups = (await entranceEvents()).length > 1;
  // Bara den egna matchningen läses (MUPP-042-R2); en startad grupp utan rad i dragningen får det gråa kortet
  const match = member.status === "started" ? await matchOf(member.id) : undefined;
  return (
    <Page
      back={
        severalGroups ? (
          <form action={leave}>
            <IconButton type="submit" label="Tillbaka">
              <ReturnIcon />
            </IconButton>
          </form>
        ) : (
          <IconLink label="Stäng" href="/">
            <CrossIcon />
          </IconLink>
        )
      }
    >
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <Heading level={1}>Hej {member.name}!</Heading>
          {member.status === "inactive" ? (
            <p>Vi har inte kört igång än</p>
          ) : (
            <ul className="grid auto-rows-fr gap-6">
              <li className="divider-short [--divider-pad:0] [--divider-top:-0.75rem]">
                <LinkCard href="/secret-santa/min-sida/onskelista" icon={<ChecklistIcon />} title="Min önskelista" />
              </li>
              <li className="divider-short [--divider-pad:0] [--divider-top:-0.75rem]">
                {match ? (
                  <LinkCard href="/secret-santa/min-sida/matchning" icon={<SantaHatIcon />} title={`Min matchning: ${match.name}`} />
                ) : (
                  <GreyCard title="Min matchnings önskelista" note="Inte tilldelad än" />
                )}
              </li>
            </ul>
          )}
        </div>
      </PageContent>
    </Page>
  );
}

// Ett kort som öppnar en lista: symbolen, rubriken och hela kortet som länk
function LinkCard({ href, icon, title }: { href: string; icon: ReactNode; title: string }) {
  return (
    <Card pressable className="h-full !p-0">
      <Link href={href} className="flex h-full items-center gap-3 p-4">
        {icon}
        <Heading level={2} small>
          {title}
        </Heading>
      </Link>
    </Card>
  );
}

// Ett kort som ännu inte går att öppna: ingen länk, och en text som säger varför så att det inte är färgen ensam som visar det
function GreyCard({ title, note }: { title: string; note: ReactNode }) {
  return (
    <Card className="flex h-full items-center gap-3 border-dashed text-muted shadow-none">
      <SantaHatIcon />
      <div>
        <Heading level={2} small>
          {title}
        </Heading>
        <p className="text-sm text-claimed">{note}</p>
      </div>
    </Card>
  );
}
