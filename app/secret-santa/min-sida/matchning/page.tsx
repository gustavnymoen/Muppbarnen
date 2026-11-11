import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/app/components/Card";
import { IconLink } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { WishRow } from "@/app/components/WishList";
import { currentSantaMember } from "@/lib/santa-auth";
import { unreadSides } from "@/lib/santa-chat";
import { matchOf } from "@/lib/santa-match";
import { requireSiteSession } from "@/lib/site-auth";
import { ChatButton } from "../ChatButton";

export const metadata: Metadata = { title: "Min matchning" };

export default function MatchPage() {
  return (
    <Suspense fallback={null}>
      <Match />
    </Suspense>
  );
}

// Önskelistan hos den man ska handla åt (MUPP-042-R1), bara att läsa. Vems lista det är kommer ur dragningen med den inloggades eget id (ur
// kakan), så ingen annans matchning går att be om, och sidan nämner aldrig vem som ska handla åt en själv (R2).
async function Match() {
  await requireSiteSession();
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  const match = member.status === "started" ? await matchOf(member.id) : undefined;
  if (!match) redirect("/secret-santa/min-sida");
  return (
    <Page
      back={
        <IconLink label="Tillbaka" href="/secret-santa/min-sida">
          <ReturnIcon />
        </IconLink>
      }
    >
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex justify-end">
            <ChatButton side="giver" unread={(await unreadSides(member.id)).giver} />
          </div>
          <Card as="section" className="space-y-3">
            <Heading level={2} small>
              Önskelistan hos {match.name}
            </Heading>
            {match.wishes.length === 0 ? (
              <p className="text-muted">Inga önskningar ännu.</p>
            ) : (
              <ul className="divide-y divide-edge">
                {match.wishes.map((wish) => (
                  // Samma rad som på barnens listor, utan paxning: en Secret Santa-önskan är aldrig paxad eller köpbar flera gånger
                  <WishRow key={wish.id} wish={{ ...wish, unlimited: false, claimedBy: null, claimedAt: null }} roomy />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
