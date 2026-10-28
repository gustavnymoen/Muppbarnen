import { LinkButton } from "./components/Button";
import { Heading, Page, PageContent } from "./components/Page";

// Sidan som visas när en adress inte finns, och när en adminsida inte är till för den som ber om den
// (en annan förälders barn, Hantera för den som inte är huvudadministratör). Innehåller ingen data.
export default function NotFound() {
  return (
    <Page>
      <PageContent>
        <div className="space-y-4">
          <Heading level={1}>Sidan finns inte</Heading>
          <p>Adressen leder ingenstans, eller så är sidan inte till för dig.</p>
          <LinkButton href="/">Till startsidan</LinkButton>
        </div>
      </PageContent>
    </Page>
  );
}
