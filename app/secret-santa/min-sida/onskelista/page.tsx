import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/app/components/BackLink";
import { Page, PageContent } from "@/app/components/Page";
import { currentSantaMember, entranceHref } from "@/lib/santa-auth";
import { peekChat, unreadSides } from "@/lib/santa-chat";
import { matchOf } from "@/lib/santa-match";
import { listOwn } from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
import { ChatButton } from "../ChatButton";
import { OwnWishList } from "../OwnWishList";

export const metadata: Metadata = { title: "Min önskelista" };

export default function WishListPage({ searchParams }: PageProps<"/secret-santa/min-sida/onskelista">) {
  return (
    <Suspense fallback={null}>
      <WishList searchParams={searchParams} />
    </Suspense>
  );
}

// Medlemmens egen lista (MUPP-040), öppnad från kortet på min-sida. I en inaktiv grupp finns ingen lista (MUPP-051-R4).
async function WishList({ searchParams }: { searchParams: PageProps<"/secret-santa/min-sida/onskelista">["searchParams"] }) {
  await requireSiteSession();
  const { grupp } = await searchParams;
  const member = await currentSantaMember(grupp);
  if (!member) redirect(entranceHref(grupp));
  const ownPage = `/secret-santa/min-sida?grupp=${member.eventId}`;
  if (member.status === "inactive") redirect(ownPage);
  const wishes = await listOwn(member.id);
  // Pratbubblan till min Secret Santa (MUPP-043) finns bara när gruppen är startad och jag har en tilldelning
  const chat = member.status === "started" && (await matchOf(member.id)) ? await unreadSides(member.id) : undefined;
  return (
    <Page
      back={
        <BackLink href={ownPage} />
      }
    >
      <PageContent>
        <div className="mx-auto flex min-h-full max-w-md flex-col gap-4">
          <OwnWishList eventId={member.eventId} eventName={member.eventName} wishes={wishes} />
          {chat && <ChatButton eventId={member.eventId} side="receiver" unread={chat.receiver} initial={await peekChat(member.id, "receiver")} />}
        </div>
      </PageContent>
    </Page>
  );
}
