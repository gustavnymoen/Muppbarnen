import { cookies } from "next/headers";
import { Suspense } from "react";
import { requireSiteSession } from "@/lib/site-auth";
import { buildDeck, swedishToday } from "@/lib/deck";
import { familyView } from "@/lib/family-view";
import { listDeckInput } from "@/lib/family";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";
import { BirthdayDeck } from "./components/BirthdayDeck";
import { FamilyButton, FamilyCard } from "./components/FamilyChoice";
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
  // Med två eller fler familjer visas bara barnen i de valda; innan något valts visas ett kort som ber om det (MUPP-080)
  const { families, view } = await familyView();
  const { children, wishes } = view.kind === "choose" ? { children: [], wishes: new Map() } : await listDeckInput(swedishToday(), view.kind === "chosen" ? view.ids : null);
  const cards = buildDeck(children, wishes, swedishToday());
  // Rutan "Så funkar det" öppnas av sig själv tills besökaren har tryckt OK (MUPP-035-R1)
  const onboarding = !(await cookies()).has(ONBOARDING_COOKIE);
  return (
    <Page home onboarding={onboarding} filter={view.kind === "chosen" && <FamilyButton families={families} chosen={view.choice} />}>
      <PageContent>
        {view.kind === "choose" ? <FamilyCard families={families} fill /> : <BirthdayDeck cards={cards} />}
      </PageContent>
    </Page>
  );
}
