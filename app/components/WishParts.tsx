import { Field } from "./Form";
import { MAX_DESCRIPTION, MAX_SIZE, MAX_TITLE, MAX_URL } from "@/lib/form-input";

// Det barnens och Secret Santa-listornas önskningar har gemensamt: fälten i formuläret (med samma gränser som
// servern, lib/form-input.ts) och raden med storlek, beskrivning och länk. Texterna skrivs ut som vanlig text
// (React gör om < och & till text); länken bara om den är en webbadress.
type Wish = { title: string; description: string; size: string; url: string };

export function WishFields({ item }: { item?: Wish }) {
  return (
    <>
      <Field name="title" label="Namn" defaultValue={item?.title} maxLength={MAX_TITLE} required />
      <Field name="size" label="Storlek" defaultValue={item?.size} maxLength={MAX_SIZE} />
      <Field name="description" type="textarea" label="Beskrivning" defaultValue={item?.description} maxLength={MAX_DESCRIPTION} />
      <Field name="url" label="Länk" defaultValue={item?.url} maxLength={MAX_URL} hint="Börjar med http:// eller https://" />
    </>
  );
}

export function WishDetails({ item }: { item: Wish }) {
  return (
    <div className="space-y-2">
      {item.size && <p>Storlek: {item.size}</p>}
      {item.description && <p className="whitespace-pre-line">{item.description}</p>}
      {/^https?:\/\//.test(item.url) && (
        <p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="break-all text-brand underline">
            {item.url}
          </a>
        </p>
      )}
    </div>
  );
}
