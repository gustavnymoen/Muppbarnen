import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Field, Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { CheckIcon, PencilIcon } from "@/app/components/icons";
import { SwitchButton } from "@/app/components/SwitchButton";
import { Heading } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { arrangeEvents, type ArrangedEvent } from "@/lib/santa-groups";
import { STATUS_CONFIRMATIONS } from "@/lib/santa-mail";
import type { EventStatus, SantaEvent, SantaMember } from "@/lib/santa";
import { EventFold, EventFoldList } from "./EventFold";
import { StatusInfo } from "./StatusInfo";
import { activateEvent, addMember, deactivateEvent, removeEvent, removeMember, saveEvent, saveMember, startDraw, stopDraw } from "./santa-actions";

const STATUS_LABEL: Record<EventStatus, string> = { inactive: "Inaktiv", preparing: "Förbereder", started: "Startad" };

// Fliken "Secret Santa" (MUPP-038, MUPP-048): varje förälder ser sina egna grupper, huvudadministratören alla.
// Vad som får ändras kontrolleras på servern i lib/santa.ts.
export function SantaTab({ events, adminId }: { events: SantaEvent[]; adminId: number }) {
  return (
    <section className="max-w-2xl space-y-3">
      <Heading level={2} small>
        Grupper
      </Heading>
      {events.length === 0 && <p className="text-muted">Inga grupper ännu.</p>}
      <EventFoldList>
        {arrangeEvents(events, adminId).map((arranged) => (
          <li key={arranged.event.id}>
            <EventCard arranged={arranged} adminId={adminId} />
          </li>
        ))}
      </EventFoldList>
      <AddRow>
        <FormCard title="Ny grupp" label="Ny grupp" text="Ny grupp">
          <EventForm submit="Lägg till" />
        </FormCard>
      </AddRow>
    </section>
  );
}

function EventCard({ arranged: { event, foldable, open }, adminId }: { arranged: ArrangedEvent; adminId: number }) {
  // Det stängda kortet visar status och antal (MUPP-056); huvudadministratören ser också andras grupper: då står det vems de är
  const counts = [...(foldable ? [STATUS_LABEL[event.status]] : []), `${event.members.length} deltagare`].join(", ");
  return (
    <EventFold
      title={event.name}
      note={
        <>
          {counts}
          {event.ownerId !== adminId && <span className="block">Admin: {event.ownerName}</span>}
        </>
      }
      foldable={foldable}
      startsOpen={open}
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
            text={`${event.name}, dess deltagare och deras önskelistor tas bort. Det går inte att ångra.`}
          />
        </>
      }
    >
      <StatusRow event={event} />
      {event.members.length > 0 && (
        <ul className="mt-2 space-y-2">
          {event.members.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} event={event} />
            </li>
          ))}
        </ul>
      )}
      {/* Deltagarna ändras inte i en startad grupp (MUPP-051-R3) */}
      {event.status !== "started" && (
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
      )}
      <div className="mt-2 flex flex-wrap items-start justify-center gap-x-6">
        <ActiveToggle event={event} />
        <StartedToggle event={event} />
      </div>
    </EventFold>
  );
}

// Statustexten med förklaringen (MUPP-051-R2)
function StatusRow({ event }: { event: SantaEvent }) {
  return (
    <div className="mt-2 flex items-center gap-1">
      <p>
        Status: <strong>{STATUS_LABEL[event.status]}</strong>
      </p>
      <StatusInfo />
    </div>
  );
}

// Reglaget Aktiv (av = inaktiv, på = förbereder), under plusknappen (MUPP-051-R2).
// I en startad grupp är det på och låst: dragningen måste stoppas först (MUPP-041). En enda ConfirmAction för båda lägena, så att
// frågan och dess svar finns kvar när statusen har bytts.
function ActiveToggle({ event }: { event: SantaEvent }) {
  if (event.status === "started") {
    return (
      <div className="flex flex-col items-center">
        <SwitchButton label="Aktiv" checked disabled aria-label={`Aktiv ${event.name}`} aria-describedby={`locked-${event.id}`} />
        <p id={`locked-${event.id}`} className="text-sm text-muted">
          Stoppa gruppen först
        </p>
      </div>
    );
  }
  const activating = event.status === "inactive";
  const confirmation = activating ? STATUS_CONFIRMATIONS.activate : STATUS_CONFIRMATIONS.deactivate;
  return (
    <div className="flex justify-center">
      <ConfirmAction
        action={activating ? activateEvent : deactivateEvent}
        fields={{ eventId: String(event.id) }}
        label={activating ? "Aktivera" : "Avaktivera"}
        switchLabel="Aktiv"
        switchOn={!activating}
        subject={event.name}
        title={confirmation.title}
        text={confirmation.text}
      />
    </div>
  );
}

// Reglaget Startad (MUPP-041-R2, R7) hör ihop med Aktiv: det går bara att slå på när gruppen förbereder, och av när den är startad
// (det är stoppet). I en inaktiv grupp är det av och låst. Frågan nämner dem som inte skrivit någon önskelista, men dragningen får ändå göras.
function StartedToggle({ event }: { event: SantaEvent }) {
  if (event.status === "inactive") return <SwitchButton label="Startad" checked={false} disabled aria-label={`Startad ${event.name}`} />;
  const starting = event.status === "preparing";
  const without = event.members.filter((m) => !m.hasWishes).map((m) => m.name);
  const confirmation = starting ? STATUS_CONFIRMATIONS.start : STATUS_CONFIRMATIONS.stop;
  return (
    <ConfirmAction
      action={starting ? startDraw : stopDraw}
      fields={{ eventId: String(event.id) }}
      label={starting ? "Starta" : "Stoppa"}
      switchLabel="Startad"
      switchOn={!starting}
      subject={event.name}
      title={confirmation.title}
      text={starting && without.length > 0 ? `${confirmation.text} Ännu ingen önskelista från: ${without.join(", ")}.` : confirmation.text}
    />
  );
}

function MemberCard({ member, event }: { member: SantaMember; event: SantaEvent }) {
  const partner = event.members.find((m) => m.id === member.partnerId);
  const where = `${member.name} i ${event.name}`;
  return (
    <SlimCard
      level={4}
      thumb={member.hasWishes ? <span role="img" aria-label="Har skrivit en önskelista" className="self-center text-brand"><CheckIcon /></span> : undefined}
      title={member.name}
      note={partner ? `Partner: ${partner.name}` : undefined}
      actions={
        event.status === "started" ? null : (
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
        )
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
