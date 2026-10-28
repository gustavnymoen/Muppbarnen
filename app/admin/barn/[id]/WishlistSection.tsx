import { Card } from "@/app/components/Card";
import { Chip } from "@/app/components/Chip";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Disclosure } from "@/app/components/Disclosure";
import { Field, Form } from "@/app/components/Form";
import { Heading } from "@/app/components/Page";
import type { Child, WishlistItem } from "@/lib/family";
import { OCCASION_NAMES, type Occasion } from "@/lib/form-input";
import { clearList, removeItem, saveItem } from "../../actions";

// Den ena av barnets två listor, med önskningarna, ett formulär för nya och knappen "Töm listan".
// Texterna skrivs ut som vanlig text (React gör om < och & till text); länken bara om den är en webbadress.
export function WishlistSection({ child, occasion, items }: { child: Child; occasion: Occasion; items: WishlistItem[] }) {
  const listName = OCCASION_NAMES[occasion];
  return (
    <Card as="section" className="space-y-4">
      <Heading level={2}>{listName}</Heading>
      {items.length === 0 ? (
        <p className="text-muted">Inga önskningar ännu.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard child={child} occasion={occasion} item={item} />
            </li>
          ))}
        </ul>
      )}
      <Disclosure label={`Ny önskning, ${listName}`}>
        <ItemForm child={child} occasion={occasion} submit="Lägg till" />
      </Disclosure>
      {items.length > 0 && (
        <ConfirmAction
          action={clearList}
          fields={{ childId: String(child.id), occasion }}
          label="Töm listan"
          subject={`${listName}, ${child.name}`}
          title={`Töm listan ”${listName}”?`}
          text={`Alla önskningar i listan ”${listName}” för ${child.name} tas bort. Det går inte att ångra.`}
        />
      )}
    </Card>
  );
}

function ItemCard({ child, occasion, item }: { child: Child; occasion: Occasion; item: WishlistItem }) {
  return (
    <article className="space-y-3 rounded-control border border-edge p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Heading level={3}>{item.title}</Heading>
        {item.unlimited && <Chip>Obegränsad</Chip>}
      </div>
      {item.size && <p>Storlek: {item.size}</p>}
      {item.description && <p className="whitespace-pre-line">{item.description}</p>}
      {/^https?:\/\//.test(item.url) && (
        <p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="break-all text-brand underline">
            {item.url}
          </a>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Disclosure label="Ändra" subject={item.title}>
          <ItemForm child={child} occasion={occasion} item={item} submit="Spara" />
        </Disclosure>
        <ConfirmAction
          action={removeItem}
          fields={{ itemId: String(item.id) }}
          label="Ta bort"
          subject={item.title}
          title={`Ta bort ”${item.title}”?`}
          text={`”${item.title}” tas bort från listan för ${child.name}. Det går inte att ångra.`}
        />
      </div>
    </article>
  );
}

function ItemForm({ child, occasion, item, submit }: { child: Child; occasion: Occasion; item?: WishlistItem; submit: string }) {
  return (
    <Form action={saveItem} submit={submit}>
      <input type="hidden" name="childId" value={child.id} />
      <input type="hidden" name="occasion" value={occasion} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <Field name="title" label="Namn" defaultValue={item?.title} maxLength={120} required />
      <Field name="size" label="Storlek" defaultValue={item?.size} maxLength={40} />
      <Field name="description" type="textarea" label="Beskrivning" defaultValue={item?.description} maxLength={500} />
      <Field name="url" label="Länk" defaultValue={item?.url} maxLength={500} hint="Börjar med http:// eller https://" />
      <Field name="unlimited" type="checkbox" label="Obegränsad" defaultChecked={item?.unlimited} hint="Utan kryss kan önskningen paxas en gång." />
    </Form>
  );
}
