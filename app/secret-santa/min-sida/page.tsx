import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { ChecklistIcon, SantaHatIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { currentSantaMember } from "@/lib/santa-auth";
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
// Vad som visas följer gruppens status (MUPP-051-R5, R6); den startade sidan kommer med dragningen (MUPP-041).
async function Own() {
  await requireSiteSession();
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  return (
    <Page>
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <Heading level={1}>Hej {member.name}!</Heading>
          {member.status === "inactive" ? (
            <p>Vi har inte kört igång än</p>
          ) : (
            <ul className="space-y-3">
              <li>
                <Card pressable className="p-0">
                  <Link href="/secret-santa/min-sida/onskelista" className="flex items-center gap-3 p-4">
                    <ChecklistIcon />
                    <Heading level={2} small>
                      Min önskelista
                    </Heading>
                  </Link>
                </Card>
              </li>
              {member.status === "preparing" && (
                <li>
                  <GreyCard title="Min matchnings önskelista" note="Inte tilldelad än" />
                </li>
              )}
            </ul>
          )}
          <form action={leave}>
            <Button type="submit" variant="secondary">
              Byt person
            </Button>
          </form>
        </div>
      </PageContent>
    </Page>
  );
}

// Ett kort som ännu inte går att öppna: ingen länk, och en text som säger varför så att det inte är färgen ensam som visar det
function GreyCard({ title, note }: { title: string; note: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 border-dashed text-muted shadow-none">
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
