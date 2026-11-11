import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IconLink } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Page, PageContent } from "@/app/components/Page";
import { currentSantaMember } from "@/lib/santa-auth";
import { unreadSides } from "@/lib/santa-chat";
import { matchOf } from "@/lib/santa-match";
import { listOwn } from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
import { ChatButton } from "../ChatButton";
import { OwnWishList } from "../OwnWishList";

export const metadata: Metadata = { title: "Min önskelista" };

export default function WishListPage() {
  return (
    <Suspense fallback={null}>
      <WishList />
    </Suspense>
  );
}

// Medlemmens egen lista (MUPP-040), öppnad från kortet på min-sida. I en inaktiv grupp finns ingen lista (MUPP-051-R4).
async function WishList() {
  await requireSiteSession();
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  if (member.status === "inactive") redirect("/secret-santa/min-sida");
  const wishes = await listOwn(member.id);
  // Pratbubblan till min Secret Santa (MUPP-043) finns bara när gruppen är startad och jag har en tilldelning
  const chat = member.status === "started" && (await matchOf(member.id)) ? await unreadSides(member.id) : undefined;
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
          {chat && (
            <div className="flex justify-end">
              <ChatButton side="receiver" unread={chat.receiver} />
            </div>
          )}
          <OwnWishList eventName={member.eventName} wishes={wishes} />
        </div>
      </PageContent>
    </Page>
  );
}
