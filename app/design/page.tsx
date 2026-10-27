import type { Metadata } from "next";
import { Avatar } from "@/app/components/Avatar";
import { Button, IconButton } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { Chip } from "@/app/components/Chip";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { childBg } from "@/app/components/colors";
import { childColor } from "@/lib/child-colors";
import { childSwatches, hexOf, swatches } from "./tokens";

export const metadata: Metadata = { title: "Stilguide – Muppbarnens önskelistor" };

// Påhittade barn; bilden är en enkel SVG, ingen riktig bild
const sky = "#82AAD0"; // barnfärgen Himmel, som i app/globals.css (kontrolleras i enhetstestet)
const picture =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${sky}"/><circle cx="4" cy="3" r="1.6" fill="${hexOf("page")}"/><rect x="1.5" y="5.2" width="5" height="3" rx="1.5" fill="${hexOf("page")}"/></svg>`,
  );

export default function DesignPage() {
  return (
    <Page>
      <PageContent>
        <div className="grid items-start gap-x-8 gap-y-8 pb-4 md:grid-cols-2 lg:grid-cols-3">
          <header className="space-y-1 pt-2 md:col-span-full">
            <Heading level={1}>Stilguide</Heading>
            <p className="text-muted">Färger, text och komponenter, med påhittade barn.</p>
          </header>

          <section className="space-y-3">
            <Heading>Färger</Heading>
            <ul className="grid grid-cols-2 gap-3">
              {swatches.map(({ name, className, hex }) => (
                <li key={name} className="flex items-center gap-2">
                  <span className={`size-8 shrink-0 rounded-lg border border-edge ${className}`} aria-hidden="true" />
                  <span className="text-sm">{name}<br /><span className="text-muted">{hex}</span></span>
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-3 gap-3">
              {childSwatches.map(({ color, name }) => (
                <li key={color} className="flex items-center gap-2">
                  <span className={`size-8 shrink-0 rounded-full ${childBg[color]}`} aria-hidden="true" />
                  <span className="text-sm">{name}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <Heading>Text</Heading>
            <p className="font-heading text-3xl font-semibold">Rubrik 1</p>
            <p className="font-heading text-2xl font-semibold">Rubrik 2</p>
            <p className="font-heading text-xl font-semibold">Rubrik 3</p>
            <p>Löpande text i Nunito, minst 16 px. Önskelistor till födelsedagar och jul.</p>
            <p className="text-muted">Dämpad text för sådant som är mindre viktigt.</p>
          </section>

          <section className="space-y-3">
            <Heading>Kort</Heading>
            <Card>
              <p className="font-heading text-lg font-medium">Ett vanligt kort</p>
              <p className="text-muted">Smal kant och flera lager skugga.</p>
            </Card>
            <Card highlight={childColor(3)}>
              <p className="font-heading text-lg font-medium">Markerat kort</p>
              <p className="text-muted">Barnets färg på kant och skugga: nästa födelsedag.</p>
            </Card>
            <Card as="button" type="button" pressable className="w-full text-left">
              <p className="font-heading text-lg font-medium">Tryckbart kort</p>
              <p className="text-muted">Trycks in i sin skugga.</p>
            </Card>
          </section>

          <section className="space-y-3">
            <Heading>Knappar</Heading>
            <div className="flex flex-wrap gap-3">
              <Button>Huvudknapp</Button>
              <Button variant="secondary">Sekundär</Button>
              <Button disabled>Avstängd</Button>
              <Button variant="secondary" disabled>Avstängd</Button>
              <IconButton label="Lägg till">+</IconButton>
              <IconButton label="Stäng" disabled>×</IconButton>
            </div>
          </section>

          <section className="space-y-3">
            <Heading>Etiketter</Heading>
            <div className="flex flex-wrap gap-2">
              <Chip>Önskat</Chip>
              {childSwatches.map(({ color, name }) => <Chip key={color} color={color}>{name}</Chip>)}
            </div>
          </section>

          <section className="space-y-3">
            <Heading>Avatarer</Heading>
            <div className="flex flex-wrap items-center gap-3">
              {childSwatches.map(({ color, name }) => <Avatar key={color} name={name} color={color} />)}
              <Avatar name="Bild" color="sky" src={picture} />
            </div>
          </section>

          <section className="space-y-3">
            <Heading>Sidans skal</Heading>
            <p>Hela den här sidan är exemplet: skalet fyller skärmen, sidan själv scrollar inte och bara innehållsytan gör det. På bred skärm får innehållet mer plats i flera kolumner, i en centrerad ram med högsta bredd.</p>
          </section>
        </div>
      </PageContent>
    </Page>
  );
}
