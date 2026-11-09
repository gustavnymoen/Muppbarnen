import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IconButton, IconLink } from "@/app/components/Button";
import { CrossIcon, ReturnIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { currentSantaMember, entranceEvents } from "@/lib/santa-auth";
import { listOwn } from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
import { leave } from "../actions";
import { OwnWishList } from "./OwnWishList";

export const metadata: Metadata = { title: "Din Secret Santa-sida" };

export default function OwnPage() {
  return (
    <Suspense fallback={null}>
      <Own />
    </Suspense>
  );
}

// Sidan har ingen adress per person: vem du är kommer bara ur kakan, så ingen annans sida går att be om (MUPP-039-R6)
async function Own() {
  await requireSiteSession();
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  const wishes = await listOwn(member.id);
  // Med flera grupper loggar pilen ut ur gruppen så att en annan kan väljas; med en enda finns inget att välja, så korset går
  // bara till startsidan och lämnar inloggningen kvar. Ingen kan byta till någon annans sida härifrån (MUPP-055-R1)
  const severalGroups = (await entranceEvents()).length > 1;
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
          <p className="text-muted">Det här är din sida. Dragningen kommer hit.</p>
          <OwnWishList eventName={member.eventName} wishes={wishes} />
        </div>
      </PageContent>
    </Page>
  );
}
