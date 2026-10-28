import { Suspense } from "react";
import { requireSiteSession } from "@/lib/site-auth";
import { buildDeck, swedishToday } from "@/lib/deck";
import { listDeckInput } from "@/lib/family";
import { BirthdayDeck } from "./components/BirthdayDeck";
import { Page, PageContent } from "./components/Page";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await requireSiteSession();
  // Klienten får bara månad, ålder och ordning; födelsedatum och dag stannar här (MUPP-004-R6)
  const { children, wishes } = await listDeckInput();
  const cards = buildDeck(children, wishes, swedishToday());
  return (
    <Page home>
      <PageContent>
        <BirthdayDeck cards={cards} />
      </PageContent>
    </Page>
  );
}
