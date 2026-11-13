import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { WishDetails, WishFields } from "@/app/components/WishParts";
import type { SantaWish } from "@/lib/santa-wishes";
import { removeWish, saveWish } from "../wish-actions";

// Medlemmens egen önskelista i gruppen (MUPP-040). Samma formulär och rader som barnens listor,
// men ingen pax och ingen "obegränsad". Listan visas bara här, för ägaren.
export function OwnWishList({ eventName, wishes }: { eventName: string; wishes: SantaWish[] }) {
  return (
    <Card as="section" className="space-y-3">
      <div className="text-center">
        <Heading level={2} small>
          Din önskelista i {eventName}
        </Heading>
      </div>
      {wishes.length === 0 ? (
        <p className="text-muted">Inga önskningar ännu.</p>
      ) : (
        <ul className="space-y-2">
          {wishes.map((wish) => (
            <li key={wish.id}>
              <WishCard eventName={eventName} wish={wish} />
            </li>
          ))}
        </ul>
      )}
      <AddRow>
        <FormCard title={`Ny önskning, ${eventName}`} label={`Ny önskning, ${eventName}`} add>
          <WishForm submit="Lägg till" />
        </FormCard>
      </AddRow>
    </Card>
  );
}

function WishCard({ eventName, wish }: { eventName: string; wish: SantaWish }) {
  return (
    <SlimCard
      title={wish.title}
      actions={
        <>
          <FormCard title={`Ändra ${wish.title}`} label={`Ändra ${wish.title}`} icon={<PencilIcon />}>
            <div className="space-y-4">
              <WishDetails item={wish} />
              <WishForm wish={wish} submit="Spara" />
            </div>
          </FormCard>
          <ConfirmAction
            action={removeWish}
            fields={{ wishId: String(wish.id) }}
            label="Ta bort"
            subject={wish.title}
            title={`Ta bort ”${wish.title}”?`}
            text={`”${wish.title}” tas bort från din önskelista i ${eventName}. Det går inte att ångra.`}
          />
        </>
      }
    />
  );
}

function WishForm({ wish, submit }: { wish?: SantaWish; submit: string }) {
  return (
    <Form action={saveWish} submit={submit} says={{ field: "title", added: !wish }} again={!wish}>
      {wish && <input type="hidden" name="wishId" value={wish.id} />}
      <WishFields item={wish} />
    </Form>
  );
}
