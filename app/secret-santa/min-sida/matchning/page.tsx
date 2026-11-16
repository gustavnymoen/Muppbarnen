import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/app/components/Card";
import { BackLink } from "@/app/components/BackLink";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { WishRow } from "@/app/components/WishList";
import { currentSantaMember, entranceHref } from "@/lib/santa-auth";
import { peekChat, unreadSides } from "@/lib/santa-chat";
import { matchOf } from "@/lib/santa-match";
import { requireSiteSession } from "@/lib/site-auth";
import { ChatButton } from "../ChatButton";
import { NagButton } from "../NagButton";

export const metadata: Metadata = { title: "Min matchning" };

export default function MatchPage({ searchParams }: PageProps<"/secret-santa/min-sida/matchning">) {
  return (
    <Suspense fallback={null}>
      <Match searchParams={searchParams} />
    </Suspense>
  );
}

// Önskelistan hos den man ska handla åt (MUPP-042-R1), bara att läsa. Vems lista det är kommer ur dragningen med den inloggades eget id (ur
// kakan), så ingen annans matchning går att be om, och sidan nämner aldrig vem som ska handla åt en själv (R2).
async function Match({ searchParams }: { searchParams: PageProps<"/secret-santa/min-sida/matchning">["searchParams"] }) {
  await requireSiteSession();
  const { grupp } = await searchParams;
  const member = await currentSantaMember(grupp);
  if (!member) redirect(entranceHref(grupp));
  const ownPage = `/secret-santa/min-sida?grupp=${member.eventId}`;
  const match = member.status === "started" ? await matchOf(member.id) : undefined;
  if (!match) redirect(ownPage);
  return (
    <Page
      back={
        <BackLink href={ownPage} />
      }
    >
      <PageContent>
        <div className="mx-auto flex min-h-full max-w-md flex-col gap-4">
          <Card as="section" className="space-y-3">
            <div className="text-center">
              <Heading level={2} small>
                Önskelistan hos {match.name}
              </Heading>
            </div>
            {match.wishes.length === 0 ? (
              <div className="space-y-3 text-center">
                <p className="text-muted">Inga önskningar ännu.</p>
                <NagButton state={match.nag} eventId={member.eventId} />
              </div>
            ) : (
              <ul className="divide-y divide-edge">
                {match.wishes.map((wish) => (
                  // Samma rad som på barnens listor, utan paxning: en Secret Santa-önskan är aldrig paxad eller köpbar flera gånger
                  <WishRow key={wish.id} wish={{ ...wish, unlimited: false, claimedBy: null, claimedAt: null, addedBy: null }} roomy />
                ))}
              </ul>
            )}
          </Card>
          <ChatButton eventId={member.eventId} side="giver" unread={(await unreadSides(member.id)).giver} initial={await peekChat(member.id, "giver")} />
        </div>
      </PageContent>
    </Page>
  );
}
