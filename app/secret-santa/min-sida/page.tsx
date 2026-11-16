import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BackLink } from "@/app/components/BackLink";
import { IconLink } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { Chip } from "@/app/components/Chip";
import { ChatIcon, ChecklistIcon, CrossIcon, SantaHatIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { currentSantaMember, entranceEvents, entranceHref } from "@/lib/santa-auth";
import { unreadSides } from "@/lib/santa-chat";
import { matchOf } from "@/lib/santa-match";
import { requireSiteSession } from "@/lib/site-auth";

export const metadata: Metadata = { title: "Din Secret Santa-sida" };

export default function OwnPage({ searchParams }: PageProps<"/secret-santa/min-sida">) {
  return (
    <Suspense fallback={null}>
      <Own searchParams={searchParams} />
    </Suspense>
  );
}

// Sidan har ingen adress per person: vem du är kommer bara ur kakan, så ingen annans sida går att be om (MUPP-039-R6).
// Vad som visas följer gruppens status (MUPP-051-R5, R6, MUPP-042-R1): i en startad grupp är det andra kortet länken till matchningens lista.
async function Own({ searchParams }: { searchParams: PageProps<"/secret-santa/min-sida">["searchParams"] }) {
  await requireSiteSession();
  const { grupp } = await searchParams;
  const member = await currentSantaMember(grupp);
  if (!member) redirect(entranceHref(grupp));
  // Med flera grupper leder pilen till valet av grupp, och inloggningarna i de andra grupperna ligger kvar (MUPP-079-R3); med en enda
  // finns inget att välja, så korset går till startsidan. Ingen kan byta till någon annans sida härifrån (MUPP-055-R1)
  const severalGroups = (await entranceEvents()).length > 1;
  // Bara den egna matchningen läses (MUPP-042-R2); en startad grupp utan rad i dragningen får det gråa kortet
  const match = member.status === "started" ? await matchOf(member.id) : undefined;
  // Märket på korten (MUPP-043): en liten ikon när något är oläst. Samtalet själv öppnas inne i listan.
  const unread = match ? await unreadSides(member.id) : undefined;
  return (
    <Page
      back={
        severalGroups ? (
          <BackLink href="/secret-santa?val=grupp" />
        ) : (
          <IconLink label="Stäng" href="/">
            <CrossIcon />
          </IconLink>
        )
      }
    >
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          {/* Beloppet (MUPP-074-R2) ligger bredvid rubriken, inte i den, så rubrikens namn är fortfarande bara "Hej <namn>!"; på en smal skärm och med ett långt namn bryts det till raden under */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <Heading level={1}>Hej {member.name}!</Heading>
            {member.amount !== null && <Chip>{member.amount} kr</Chip>}
          </div>
          {member.status === "inactive" ? (
            <p>Vi har inte kört igång än</p>
          ) : (
            <ul className="grid auto-rows-fr gap-6">
              <li className="divider-short [--divider-pad:0] [--divider-top:-0.75rem]">
                <LinkCard href={`/secret-santa/min-sida/onskelista?grupp=${member.eventId}`} icon={<ChecklistIcon />} lines={["Min", "önskelista"]} unread={unread?.receiver} />
              </li>
              <li className="divider-short [--divider-pad:0] [--divider-top:-0.75rem]">
                {match ? (
                  <LinkCard href={`/secret-santa/min-sida/matchning?grupp=${member.eventId}`} icon={<SantaHatIcon />} lines={["Min matchning:", match.name]} unread={unread?.giver} />
                ) : (
                  <GreyCard lines={["Min matchnings", "önskelista"]} note="Inte tilldelad än" />
                )}
              </li>
            </ul>
          )}
        </div>
      </PageContent>
    </Page>
  );
}

// Korten är höga och har stor text så att de fyller sidan; symbolen är 40 px (MUPP-059-R2)
const CARD_LOOK = "flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center [&_svg]:size-10";
// Egen storlek (30 px), större än Heading small; break-words så att ett långt namn aldrig går utanför kortet på 320 px
const CARD_TITLE = "font-heading text-3xl font-semibold break-words";

// Två rader: brytningen är fast, men texten är en mening med ett mellanslag, så det tillgängliga namnet är fortfarande "Min önskelista" (MUPP-059-R2)
function Lines({ lines }: { lines: [string, string] }) {
  return (
    <>
      {lines[0]} <span className="block">{lines[1]}</span>
    </>
  );
}

// Märket för ett nytt meddelande (MUPP-043-R5): en liten orange pratbubbla i kortets hörn, bara när något är oläst, och en text för skärmläsaren
// så att det inte bara är färgen som säger det. !size: kortets länk ger annars alla symboler i den 40 px (CARD_LOOK)
function NewMessage() {
  return (
    <span className="absolute right-3 top-3 text-claimed [&_svg]:!size-5">
      <ChatIcon />
      <span className="sr-only">Nytt meddelande</span>
    </span>
  );
}

// Ett kort som öppnar en lista: symbolen över rubriken, båda centrerade, och hela kortet som länk
function LinkCard({ href, icon, lines, unread }: { href: string; icon: ReactNode; lines: [string, string]; unread?: boolean }) {
  return (
    <Card pressable className="relative h-full !p-0">
      <Link href={href} className={`${CARD_LOOK} h-full`}>
        {icon}
        <h2 className={CARD_TITLE}>
          <Lines lines={lines} />
        </h2>
        {unread && <NewMessage />}
      </Link>
    </Card>
  );
}

// Ett kort som ännu inte går att öppna: ingen länk, och en text som säger varför så att det inte är färgen ensam som visar det
function GreyCard({ lines, note }: { lines: [string, string]; note: ReactNode }) {
  return (
    <Card className={`${CARD_LOOK} h-full border-dashed text-muted shadow-none`}>
      <SantaHatIcon />
      <div>
        <h2 className={CARD_TITLE}>
          <Lines lines={lines} />
        </h2>
        <p className="text-sm text-claimed">{note}</p>
      </div>
    </Card>
  );
}
