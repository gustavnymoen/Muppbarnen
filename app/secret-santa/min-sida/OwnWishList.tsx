import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { WishFields } from "@/app/components/WishParts";
import { WishRow } from "@/app/components/WishList";
import type { SantaWish } from "@/lib/santa-wishes";
import { removeWish, saveWish } from "../wish-actions";

// Medlemmens egen önskelista i gruppen (MUPP-040). Samma formulär och rader som barnens listor,
// men ingen pax och ingen "obegränsad". Listan visas bara här, för ägaren.
export function OwnWishList({ eventId, eventName, wishes }: { eventId: number; eventName: string; wishes: SantaWish[] }) {
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
        <ul className="divide-y divide-edge">
          {wishes.map((wish) => (
            <WishCard key={wish.id} eventId={eventId} eventName={eventName} wish={wish} />
          ))}
        </ul>
      )}
      <AddRow>
        <FormCard title={`Ny önskning, ${eventName}`} label={`Ny önskning, ${eventName}`} add>
          <WishForm eventId={eventId} submit="Lägg till" />
        </FormCard>
      </AddRow>
    </Card>
  );
}

function WishCard({ eventId, eventName, wish }: { eventId: number; eventName: string; wish: SantaWish }) {
  return (
    <WishRow
      wish={{ ...wish, unlimited: false, claimedBy: null, claimedAt: null, addedBy: null }}
      roomy
      actions={
        <>
          <FormCard big title={`Ändra ${wish.title}`} label={`Ändra ${wish.title}`} icon={<PencilIcon />}>
            <WishForm eventId={eventId} wish={wish} submit="Spara" />
          </FormCard>
          <ConfirmAction
            big
            action={removeWish}
            fields={{ wishId: String(wish.id), eventId: String(eventId) }}
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

function WishForm({ eventId, wish, submit }: { eventId: number; wish?: SantaWish; submit: string }) {
  return (
    <Form action={saveWish} submit={submit} says={{ field: "title", added: !wish }} again={!wish}>
      <input type="hidden" name="eventId" value={eventId} />
      {wish && <input type="hidden" name="wishId" value={wish.id} />}
      <WishFields item={wish} />
    </Form>
  );
}
