import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IconLink } from "@/app/components/Button";
import { ReturnIcon } from "@/app/components/icons";
import { Page, PageContent } from "@/app/components/Page";
import { currentSantaMember } from "@/lib/santa-auth";
import { listOwn } from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
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
          <OwnWishList eventName={member.eventName} wishes={wishes} />
        </div>
      </PageContent>
    </Page>
  );
}
