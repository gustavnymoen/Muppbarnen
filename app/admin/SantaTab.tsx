import { ConfirmAction } from "@/app/components/ConfirmAction";
import { FoldButton, FoldGroup, FoldPanel, FoldToggle } from "@/app/components/Fold";
import { Field, Form } from "@/app/components/Form";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import type { KnownPerson, SantaFamily, SantaMember } from "@/lib/santa";
import { addNewMember, joinFamily, removeFamily, removeMember, saveFamily, saveMember } from "./santa-actions";

type People = (KnownPerson & { familyIds: number[] })[];

// Fliken "Secret Santa" (MUPP-038): bara huvudadministratören får den, kontrollerat på servern i lib/santa.ts
export function SantaTab({ families, people }: { families: SantaFamily[]; people: People }) {
  return (
    <FoldGroup>
      <section className="max-w-2xl space-y-3">
        <Heading level={2} small>
          Familjer
        </Heading>
        {families.length === 0 && <p className="text-muted">Inga familjer ännu.</p>}
        <ul className="space-y-2">
          {families.map((family) => (
            <li key={family.id}>
              <FamilyCard family={family} people={people} />
            </li>
          ))}
        </ul>
        <FoldButton id="ny-familj" label="Ny familj">
          Ny familj
        </FoldButton>
        <FoldPanel id="ny-familj">
          <FamilyForm submit="Lägg till" />
        </FoldPanel>
      </section>
    </FoldGroup>
  );
}

function FamilyCard({ family, people }: { family: SantaFamily; people: People }) {
  const rename = `familj-${family.id}`;
  const newPerson = `ny-person-${family.id}`;
  const knownPerson = `känd-person-${family.id}`;
  const candidates = people.filter((person) => !person.familyIds.includes(family.id));
  return (
    <SlimCard
      title={family.name}
      note={`${family.members.length} ${family.members.length === 1 ? "medlem" : "medlemmar"}`}
      actions={
        <>
          <FoldToggle id={rename} label={`Byt namn på ${family.name}`}>
            <PencilIcon />
          </FoldToggle>
          <ConfirmAction
            action={removeFamily}
            fields={{ familyId: String(family.id) }}
            label="Ta bort"
            subject={family.name}
            title={`Ta bort ${family.name}?`}
            text={`${family.name}, dess medlemmar och deras önskelistor i familjen tas bort. Personer som inte är med i någon annan familj tas bort helt. Det går inte att ångra.`}
          />
        </>
      }
    >
      <FoldPanel id={rename}>
        <FamilyForm family={family} submit="Spara" />
      </FoldPanel>
      {family.members.length > 0 && (
        <ul className="mt-2 space-y-2">
          {family.members.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} family={family} people={people} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2 pb-1">
        <FoldButton id={newPerson} label={`Ny person i ${family.name}`}>
          Ny person
        </FoldButton>
        {candidates.length > 0 && (
          <FoldButton id={knownPerson} label={`Lägg till känd person i ${family.name}`}>
            Lägg till känd person
          </FoldButton>
        )}
      </div>
      <FoldPanel id={newPerson}>
        <Form action={addNewMember} submit="Lägg till">
          <input type="hidden" name="familyId" value={family.id} />
          <ContactFields />
        </Form>
      </FoldPanel>
      <FoldPanel id={knownPerson}>
        <Form action={joinFamily} submit="Lägg till">
          <input type="hidden" name="familyId" value={family.id} />
          <Field name="personId" type="select" label="Välj person" options={candidates.map((p) => ({ value: String(p.id), label: p.name }))} />
        </Form>
      </FoldPanel>
    </SlimCard>
  );
}

function MemberCard({ member, family, people }: { member: SantaMember; family: SantaFamily; people: People }) {
  const edit = `medlem-${member.id}`;
  const partner = family.members.find((m) => m.id === member.partnerId);
  const inFamilies = people.find((p) => p.id === member.personId)?.familyIds.length ?? 1;
  const where = `${member.name} i ${family.name}`;
  return (
    <SlimCard
      level={4}
      title={member.name}
      note={partner ? `Partner: ${partner.name}` : undefined}
      actions={
        <>
          <FoldToggle id={edit} label={`Ändra ${where}`}>
            <PencilIcon />
          </FoldToggle>
          <ConfirmAction
            action={removeMember}
            fields={{ memberId: String(member.id) }}
            label="Ta bort"
            subject={where}
            title={`Ta bort ${member.name} ur ${family.name}?`}
            text={
              inFamilies > 1
                ? `${member.name} och önskelistan i ${family.name} tas bort. ${member.name} finns kvar i de andra familjerna. Det går inte att ångra.`
                : `${member.name}, kontaktuppgifterna och önskelistan tas bort, eftersom ${member.name} inte är med i någon annan familj. Det går inte att ångra.`
            }
          />
        </>
      }
    >
      <FoldPanel id={edit}>
        <Form action={saveMember} submit="Spara">
          <input type="hidden" name="memberId" value={member.id} />
          <ContactFields member={member} />
          <Field
            name="partnerId"
            type="select"
            label="Partner"
            hint={`Partnern gäller bara i ${family.name}.`}
            defaultValue={member.partnerId ? String(member.partnerId) : ""}
            options={[{ value: "", label: "Ingen" }, ...family.members.filter((m) => m.id !== member.id).map((m) => ({ value: String(m.id), label: m.name }))]}
          />
          {inFamilies > 1 && <p className="text-sm text-muted">Namn, telefon och e-post gäller i alla familjer som {member.name} är med i.</p>}
        </Form>
      </FoldPanel>
    </SlimCard>
  );
}

function ContactFields({ member }: { member?: SantaMember }) {
  return (
    <>
      <Field name="name" label="Namn" defaultValue={member?.name} maxLength={60} required />
      <Field name="phone" type="tel" label="Telefon" defaultValue={member?.phone} hint="Skriv numret som 07XXXXXXXX" maxLength={10} autoComplete="off" required />
      <Field name="email" type="email" label="E-post" defaultValue={member?.email} maxLength={254} autoComplete="off" required />
    </>
  );
}

function FamilyForm({ family, submit }: { family?: SantaFamily; submit: string }) {
  return (
    <Form action={saveFamily} submit={submit}>
      {family && <input type="hidden" name="familyId" value={family.id} />}
      <Field name="name" label="Familjens namn" defaultValue={family?.name} maxLength={60} required />
    </Form>
  );
}
