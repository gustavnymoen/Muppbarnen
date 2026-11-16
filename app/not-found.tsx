import type { Metadata } from "next";
import { BackLink } from "./components/BackLink";
import { Heading, Page, PageContent } from "./components/Page";

export const metadata: Metadata = { title: "Sidan finns inte" };

// Sidan som visas när en adress inte finns, och när en adminsida inte är till för den som ber om den
// (en annan förälders barn, Hantera för den som inte är huvudadministratör). Innehåller ingen data.
export default function NotFound() {
  return (
    <Page back={<BackLink href="/" />}>
      <PageContent>
        <div className="space-y-4">
          <Heading level={1}>Sidan finns inte</Heading>
          <p>Adressen leder ingenstans, eller så är sidan inte till för dig.</p>
        </div>
      </PageContent>
    </Page>
  );
}
