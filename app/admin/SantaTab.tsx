import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Field, Form } from "@/app/components/Form";
import { FormCard } from "@/app/components/FormCard";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import type { KnownPerson, SantaFamily, SantaMember } from "@/lib/santa";
import { addNewMember, joinFamily, removeFamily, removeMember, saveFamily, saveMember } from "./santa-actions";

type People = (KnownPerson & { familyIds: number[] })[];

// Fliken "Secret Santa" (MUPP-038): bara huvudadministratören får den, kontrollerat på servern i lib/santa.ts
export function SantaTab({ families, people }: { families: SantaFamily[]; people: People }) {
  return (
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
      <FormCard title="Ny familj" label="Ny familj" text="Ny familj">
        <FamilyForm submit="Lägg till" />
      </FormCard>
    </section>
  );
}

function FamilyCard({ family, people }: { family: SantaFamily; people: People }) {
  const candidates = people.filter((person) => !person.familyIds.includes(family.id));
  return (
    <SlimCard
      title={family.name}
      note={`${family.members.length} ${family.members.length === 1 ? "medlem" : "medlemmar"}`}
      actions={
        <>
          <FormCard title={`Byt namn på ${family.name}`} label={`Byt namn på ${family.name}`} icon={<PencilIcon />}>
            <FamilyForm family={family} submit="Spara" />
          </FormCard>
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
        <FormCard title={`Ny person i ${family.name}`} label={`Ny person i ${family.name}`} text="Ny person">
          <Form action={addNewMember} submit="Lägg till" says={{ field: "name", added: true }}>
            <input type="hidden" name="familyId" value={family.id} />
            <ContactFields />
          </Form>
        </FormCard>
        {candidates.length > 0 && (
          <FormCard title={`Känd person i ${family.name}`} label={`Lägg till känd person i ${family.name}`} text="Lägg till känd person">
            <Form action={joinFamily} submit="Lägg till" says={`Personen lades till i ${family.name}`}>
              <input type="hidden" name="familyId" value={family.id} />
              <Field name="personId" type="select" label="Välj person" options={candidates.map((p) => ({ value: String(p.id), label: p.name }))} />
            </Form>
          </FormCard>
        )}
      </div>
    </SlimCard>
  );
}

function MemberCard({ member, family, people }: { member: SantaMember; family: SantaFamily; people: People }) {
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
          <FormCard title={`Ändra ${where}`} label={`Ändra ${where}`} icon={<PencilIcon />}>
            <Form action={saveMember} submit="Spara" says={{ field: "name" }}>
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
          </FormCard>
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
    />
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
    <Form action={saveFamily} submit={submit} says={{ field: "name", added: !family }}>
      {family && <input type="hidden" name="familyId" value={family.id} />}
      <Field name="name" label="Familjens namn" defaultValue={family?.name} maxLength={60} required />
    </Form>
  );
}
