import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/app/components/Button";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { currentSantaPerson } from "@/lib/santa-auth";
import { listOwn } from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
import { leave } from "../actions";
import { WishLists } from "./WishLists";

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
  const person = await currentSantaPerson();
  if (!person) redirect("/secret-santa");
  const lists = await listOwn(person.id);
  return (
    <Page>
      <PageContent>
        <div className="mx-auto max-w-md space-y-4">
          <Heading level={1}>Hej {person.name}!</Heading>
          <p className="text-muted">Det här är din sida. Dragningen kommer hit.</p>
          <WishLists lists={lists} />
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
