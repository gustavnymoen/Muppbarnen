import { Suspense } from "react";
import { requireSiteSession } from "@/lib/site-auth";
import { Avatar } from "./components/Avatar";
import { Card } from "./components/Card";
import { Chip } from "./components/Chip";
import { Page, PageContent } from "./components/Page";
import { childColor } from "@/lib/child-colors";

// Påhittade exempelkort. De riktiga korten kommer med MUPP-004 och MUPP-005,
// och då tas dessa bort. Ett av dem är markerat, som det kort som är viktigast just nu.
const examples = [
  { name: "Alma", text: "Fyller 7 år den 3 mars" },
  { name: "Otto", text: "Fyller 5 år den 14 november", highlight: true },
  { name: "Vera", text: "Fyller 9 år den 21 juni" },
];

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await requireSiteSession();
  return (
    <Page home>
      <PageContent>
        {/* Raden går att tabba till och bläddra i med piltangenterna; den är en grupp med ett namn */}
        <div
          role="group"
          aria-label="Barnens kort, exempel"
          tabIndex={0}
          className="carousel -mx-3 flex gap-4 overflow-x-auto scroll-px-3 px-3 pb-8 pt-3"
        >
          {examples.map(({ name, text, highlight }, i) => (
            <Card
              key={name}
              as="article"
              highlight={highlight ? childColor(i) : undefined}
              className="basis-[85%] shrink-0 space-y-3 sm:basis-[calc((100%-2rem)/3)]"
            >
              <Avatar name={name} color={childColor(i)} />
              <h2 className="font-heading text-xl font-semibold">{name}</h2>
              <p className="text-muted">{text}</p>
              <Chip>Exempel</Chip>
            </Card>
          ))}
        </div>
      </PageContent>
    </Page>
  );
}
