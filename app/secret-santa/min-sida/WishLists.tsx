import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { FoldButton, FoldGroup, FoldPanel, FoldToggle } from "@/app/components/Fold";
import { Form } from "@/app/components/Form";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { WishDetails, WishFields } from "@/app/components/WishParts";
import type { SantaList, SantaWish } from "@/lib/santa-wishes";
import { removeWish, saveWish } from "../wish-actions";

// Personens egna önskelistor, en per familj (MUPP-040). Samma formulär och rader som barnens listor,
// men ingen pax och ingen "obegränsad". Listan visas bara här, för ägaren.
export function WishLists({ lists }: { lists: SantaList[] }) {
  return (
    <FoldGroup>
      <div className="space-y-4">
        {lists.map((list) => (
          <WishList key={list.memberId} list={list} />
        ))}
      </div>
    </FoldGroup>
  );
}

function WishList({ list }: { list: SantaList }) {
  const newWish = `ny-${list.familyId}`;
  return (
    <Card as="section" className="space-y-3">
      <Heading level={2} small>
        Din önskelista i {list.familyName}
      </Heading>
      {list.wishes.length === 0 ? (
        <p className="text-muted">Inga önskningar ännu.</p>
      ) : (
        <ul className="space-y-2">
          {list.wishes.map((wish) => (
            <li key={wish.id}>
              <WishCard list={list} wish={wish} />
            </li>
          ))}
        </ul>
      )}
      <FoldButton id={newWish} label={`Ny önskning, ${list.familyName}`}>
        Ny önskning
      </FoldButton>
      <FoldPanel id={newWish}>
        <WishForm list={list} submit="Lägg till" />
      </FoldPanel>
    </Card>
  );
}

function WishCard({ list, wish }: { list: SantaList; wish: SantaWish }) {
  const edit = `onskning-${wish.id}`;
  return (
    <SlimCard
      title={wish.title}
      actions={
        <>
          <FoldToggle id={edit} label={`Ändra ${wish.title}`}>
            <PencilIcon />
          </FoldToggle>
          <ConfirmAction
            action={removeWish}
            fields={{ wishId: String(wish.id) }}
            label="Ta bort"
            subject={wish.title}
            title={`Ta bort ”${wish.title}”?`}
            text={`”${wish.title}” tas bort från din önskelista i ${list.familyName}. Det går inte att ångra.`}
          />
        </>
      }
    >
      <FoldPanel id={edit}>
        <WishDetails item={wish} />
        <WishForm list={list} wish={wish} submit="Spara" />
      </FoldPanel>
    </SlimCard>
  );
}

// Familjen följer med i formuläret för att säga vilken lista det gäller; servern kontrollerar att den är personens egen
function WishForm({ list, wish, submit }: { list: SantaList; wish?: SantaWish; submit: string }) {
  return (
    <Form action={saveWish} submit={submit}>
      <input type="hidden" name="familyId" value={list.familyId} />
      {wish && <input type="hidden" name="wishId" value={wish.id} />}
      <WishFields item={wish} />
    </Form>
  );
}
