import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Field, Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { WishDetails, WishFields } from "@/app/components/WishParts";
import { dayAndMonth, parseDate } from "@/lib/deck";
import type { AdminItem, ArchiveGroup, Child, WishlistItem } from "@/lib/family";
import { OCCASION_NAMES, type Occasion } from "@/lib/form-input";
import { removeItem, saveItem } from "../../actions";
import { ArchiveGroupCard } from "./ArchiveGroupCard";

// Den ena av barnets två listor: önskningarna som smala rader och "Ny önskning".
export function WishlistSection({ child, occasion, items }: { child: Child; occasion: Occasion; items: AdminItem[] }) {
  const listName = OCCASION_NAMES[occasion];
  return (
    <Card as="section" className="space-y-3">
      <Heading level={2} small>
        {listName}
      </Heading>
      {items.length === 0 ? (
        <p className="text-muted">Inga önskningar ännu.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard child={child} occasion={occasion} item={item} />
            </li>
          ))}
        </ul>
      )}
      <AddRow>
        <FormCard title={`Ny önskning, ${listName}`} label={`Ny önskning, ${listName}`} add>
          <ItemForm child={child} occasion={occasion} submit="Lägg till" />
        </FormCard>
      </AddRow>
    </Card>
  );
}

// Varningen när någon har paxat önskningen (MUPP-007-R1): vem och vilken dag. Arkiverade önskningar har ingen borttagningsknapp.
function claimWarning({ title, claimedBy, claimedAt }: AdminItem) {
  if (!claimedBy) return "";
  const day = claimedAt ? parseDate(claimedAt) : null;
  return `${title} är paxad av ${claimedBy}${day ? ` ${dayAndMonth(day.day, day.month)}` : ""}. Hen kan redan ha köpt den. `;
}

function ItemCard({ child, occasion, item }: { child: Child; occasion: Occasion; item: AdminItem }) {
  return (
    <SlimCard
      title={item.title}
      note={item.unlimited ? "Obegränsad" : undefined}
      actions={
        <>
          <FormCard title={`Ändra ${item.title}`} label={`Ändra ${item.title}`} icon={<PencilIcon />}>
            <div className="space-y-4">
              <WishDetails item={item} />
              <ItemForm child={child} occasion={occasion} item={item} submit="Spara" />
            </div>
          </FormCard>
          <ConfirmAction
            action={removeItem}
            fields={{ itemId: String(item.id) }}
            label="Ta bort"
            subject={item.title}
            title={`Ta bort ”${item.title}”?`}
            text={`${claimWarning(item)}”${item.title}” tas bort från listan för ${child.name}. Det går inte att ångra.`}
          />
        </>
      }
    />
  );
}

function ItemForm({ child, occasion, item, submit }: { child: Child; occasion: Occasion; item?: WishlistItem; submit: string }) {
  return (
    <Form action={saveItem} submit={submit} says={{ field: "title", added: !item }} again={!item}>
      <input type="hidden" name="childId" value={child.id} />
      <input type="hidden" name="occasion" value={occasion} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <WishFields item={item} />
      <Field name="unlimited" type="checkbox" label="Obegränsad" defaultChecked={item?.unlimited} hint="Utan kryss kan önskningen paxas en gång." />
    </Form>
  );
}

// Arkivet (MUPP-031-R5): ett hopfällt tillfälle per rad, det senaste först. De arkiverade önskningarna går inte att ändra,
// ta bort eller paxa; det enda som går är att lägga till dem igen (R7). Ingen sektion utan arkiverade önskningar.
export function ArchiveSection({ groups }: { groups: ArchiveGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <Card as="section" className="space-y-3">
      <Heading level={2} small>
        Arkiv
      </Heading>
      <ul className="space-y-2">
        {groups.map((group) => (
          <li key={group.key}>
            <ArchiveGroupCard group={group} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
