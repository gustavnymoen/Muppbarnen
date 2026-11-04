import { cookies } from "next/headers";
import { Suspense } from "react";
import { requireSiteSession } from "@/lib/site-auth";
import { buildDeck, swedishToday } from "@/lib/deck";
import { listDeckInput } from "@/lib/family";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";
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
  // Rutan "Så funkar sajten" öppnas av sig själv tills besökaren har tryckt OK (MUPP-035-R1)
  const onboarding = !(await cookies()).has(ONBOARDING_COOKIE);
  return (
    <Page home onboarding={onboarding}>
      <PageContent>
        <BirthdayDeck cards={cards} />
      </PageContent>
    </Page>
  );
}
