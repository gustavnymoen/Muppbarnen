import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/app/components/Card";
import { IconLink } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { WishDetails } from "@/app/components/WishParts";
import { currentSantaMember } from "@/lib/santa-auth";
import { matchOf } from "@/lib/santa-match";
import { requireSiteSession } from "@/lib/site-auth";

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
        <div className="mx-auto max-w-md">
          <Card as="section" className="space-y-3">
            <Heading level={2} small>
              Önskelistan hos {match.name}
            </Heading>
            {match.wishes.length === 0 ? (
              <p className="text-muted">Inga önskningar ännu.</p>
            ) : (
              <ul className="space-y-2">
                {match.wishes.map((wish) => (
                  <li key={wish.id}>
                    <WishCard wish={wish} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}

// En önskning utan knappar att ändra: titeln och, om de finns, storlek, beskrivning och länk
function WishCard({ wish }: { wish: { title: string; description: string; size: string; url: string } }) {
  return (
    <SlimCard title={wish.title} actions={null}>
      <WishDetails item={wish} />
    </SlimCard>
  );
}
