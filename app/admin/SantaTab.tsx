import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Field, Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { PencilIcon } from "@/app/components/icons";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import type { SantaEvent, SantaMember } from "@/lib/santa";
import { addMember, removeEvent, removeMember, saveEvent, saveMember } from "./santa-actions";

// Fliken "Secret Santa" (MUPP-038, MUPP-048): varje förälder ser sina egna grupper, huvudadministratören alla.
// Vad som får ändras kontrolleras på servern i lib/santa.ts.
export function SantaTab({ events, adminId }: { events: SantaEvent[]; adminId: number }) {
  return (
    <section className="max-w-2xl space-y-3">
      <Heading level={2} small>
        Grupper
      </Heading>
      {events.length === 0 && <p className="text-muted">Inga grupper ännu.</p>}
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} adminId={adminId} />
          </li>
        ))}
      </ul>
      <AddRow>
        <FormCard title="Ny grupp" label="Ny grupp" text="Ny grupp">
          <EventForm submit="Lägg till" />
        </FormCard>
      </AddRow>
    </section>
  );
}

function EventCard({ event, adminId }: { event: SantaEvent; adminId: number }) {
  const count = `${event.members.length} ${event.members.length === 1 ? "medlem" : "medlemmar"}`;
  return (
    <SlimCard
      title={event.name}
      // Huvudadministratören ser också andras grupper: då står det vems de är
      note={event.ownerId === adminId ? count : `${count}, administreras av ${event.ownerName}`}
      actions={
        <>
          <FormCard title={`Byt namn på ${event.name}`} label={`Byt namn på ${event.name}`} icon={<PencilIcon />}>
            <EventForm event={event} submit="Spara" />
          </FormCard>
          <ConfirmAction
            action={removeEvent}
            fields={{ eventId: String(event.id) }}
            label="Ta bort"
            subject={event.name}
            title={`Ta bort ${event.name}?`}
            text={`${event.name}, dess medlemmar och deras önskelistor tas bort. Det går inte att ångra.`}
          />
        </>
      }
    >
      {event.members.length > 0 && (
        <ul className="mt-2 space-y-2">
          {event.members.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} event={event} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 pb-1">
        <AddRow>
          <FormCard title={`Ny person i ${event.name}`} label={`Ny person i ${event.name}`} add>
            <Form action={addMember} submit="Lägg till" says={{ field: "name", added: true }}>
              <input type="hidden" name="eventId" value={event.id} />
              <ContactFields />
            </Form>
          </FormCard>
        </AddRow>
      </div>
    </SlimCard>
  );
}

function MemberCard({ member, event }: { member: SantaMember; event: SantaEvent }) {
  const partner = event.members.find((m) => m.id === member.partnerId);
  const where = `${member.name} i ${event.name}`;
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
                defaultValue={member.partnerId ? String(member.partnerId) : ""}
                options={[{ value: "", label: "Ingen" }, ...event.members.filter((m) => m.id !== member.id).map((m) => ({ value: String(m.id), label: m.name }))]}
              />
            </Form>
          </FormCard>
          <ConfirmAction
            action={removeMember}
            fields={{ memberId: String(member.id) }}
            label="Ta bort"
            subject={where}
            title={`Ta bort ${member.name} ur ${event.name}?`}
            text={`${member.name}, kontaktuppgifterna och önskelistan i ${event.name} tas bort. Det går inte att ångra.`}
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

function EventForm({ event, submit }: { event?: SantaEvent; submit: string }) {
  return (
    <Form action={saveEvent} submit={submit} says={{ field: "name", added: !event }}>
      {event && <input type="hidden" name="eventId" value={event.id} />}
      <Field name="name" label="Gruppens namn" defaultValue={event?.name} maxLength={60} required />
    </Form>
  );
}
