import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import { collect, parseEmail, parseId, parsePhone, parseText } from "./form-input";
import type { Outcome, Parent } from "./family";

// Secret Santa: grupper (events) och deras medlemmar (MUPP-038, MUPP-048). Vilken förälder som helst skapar en
// grupp och administrerar den; huvudadministratören ser och ändrar alla. Telefon och e-post lämnar aldrig de här
// funktionerna till någon annan sida. Allt som ändrar något tar emot vem som gör det (läst ur databasen vid varje
// förfrågan) och kontrollerar både rättigheten och indatan här.

export type SantaMember = { id: number; name: string; phone: string; email: string; partnerId: number | null };
export type SantaEvent = { id: number; name: string; ownerId: number; ownerName: string; members: SantaMember[] };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;
const GONE = { ok: false, error: "Det finns inte längre. Ladda om sidan." } as const;
const NAME_TAKEN = { ok: false, fields: { name: "Det finns redan en grupp med det namnet." } } as const;
const PHONE_TAKEN = { ok: false, fields: { phone: "Numret används redan av en annan person i gruppen." } } as const;
const EMAIL_TAKEN = { ok: false, fields: { email: "E-postadressen används redan av en annan person i gruppen." } } as const;
const PARTNER_IN_GROUP = { ok: false, fields: { partnerId: "Välj en av de andra i gruppen." } } as const;

type EventRow = { id: number; owner_id: number; name: string };

// Gruppens ägare och huvudadministratören får ändra den (MUPP-048-R3)
const canManage = (actor: Parent | null, event: Pick<EventRow, "owner_id">): actor is Parent => actor !== null && (actor.isMasterAdmin || event.owner_id === actor.id);

// Samma namn oavsett versaler och mellanslag i ändarna (MUPP-048-R2). Jämförelsen görs här och inte bara av
// indexet i databasen, som bara vet hur ASCII-versaler ser ut.
const nameKey = (name: string) => name.trim().toLocaleLowerCase("sv");

async function nameTaken(name: string, exceptId: number | null, tx: Executor) {
  const events = await all<{ id: number; name: string }>("SELECT id, name FROM ss_event", [], tx);
  return events.some((e) => e.id !== exceptId && nameKey(e.name) === nameKey(name));
}

// Gruppen, om förfrågan avser en som aktören får ändra
async function manageableEvent(actor: Parent | null, rawId: unknown, tx: Executor): Promise<EventRow | Outcome> {
  const id = parseId(rawId);
  const event = id === null ? undefined : await get<EventRow>("SELECT id, owner_id, name FROM ss_event WHERE id = ?", [id], tx);
  if (!event) return GONE;
  return canManage(actor, event) ? event : NOT_ALLOWED;
}

const isOutcome = <T extends object>(value: T | Outcome): value is Outcome => "ok" in value;

// ---- Läsa

// Grupperna aktören får se (egna; alla för huvudadministratören) med medlemmarna, i namnordning
export async function listEvents(actor: Parent | null): Promise<SantaEvent[]> {
  if (!actor) return [];
  // Samma urval för grupperna och medlemmarna (fast SQL-text): kontaktuppgifter för andras grupper läses aldrig ens in
  const args = [actor.isMasterAdmin ? 1 : 0, actor.id];
  const events = await all<EventRow & { owner_name: string }>(
    "SELECT e.id, e.owner_id, e.name, p.name AS owner_name FROM ss_event e JOIN parent p ON p.id = e.owner_id WHERE (? = 1 OR e.owner_id = ?) ORDER BY e.name, e.id",
    args,
  );
  const rows = await all<{ id: number; event_id: number; name: string; phone: string; email: string; partner_member_id: number | null }>(
    "SELECT m.id, m.event_id, m.name, m.phone, m.email, m.partner_member_id FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE (? = 1 OR e.owner_id = ?) ORDER BY m.name, m.id",
    args,
  );
  return events.map((e) => ({
    id: e.id,
    name: e.name,
    ownerId: e.owner_id,
    ownerName: e.owner_name,
    members: rows.filter((r) => r.event_id === e.id).map((r) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, partnerId: r.partner_member_id })),
  }));
}

// ---- Grupper

export async function saveEvent(actor: Parent | null, input: { id?: unknown; name: unknown }): Promise<Outcome> {
  if (!actor) return NOT_ALLOWED;
  const checked = collect({ name: parseText(input.name, 60, true) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name } = checked.values;
  const creating = input.id === undefined || input.id === "";
  return withTransaction(async (tx) => {
    const event = creating ? null : await manageableEvent(actor, input.id, tx);
    if (event && isOutcome(event)) return event;
    if (await nameTaken(name, event?.id ?? null, tx)) return NAME_TAKEN;
    try {
      if (event) await run("UPDATE ss_event SET name = ? WHERE id = ?", [name, event.id], tx);
      else await run("INSERT INTO ss_event (owner_id, name) VALUES (?, ?)", [actor.id, name], tx);
    } catch (error) {
      // Två föräldrar som sparar samma namn samtidigt: indexet i databasen stoppar den andra
      if (/constraint/i.test(String(error))) return NAME_TAKEN;
      throw error;
    }
    return { ok: true };
  });
}

// Gruppen och dess medlemmar med önskelistor tas bort. Allt görs här och inte bara av ON DELETE CASCADE: en
// transaktion behåller inte alltid inställningen för främmande nycklar på en lokal databasfil.
export async function removeEvent(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, rawId, tx);
    if (isOutcome(event)) return event;
    await run("UPDATE ss_member SET partner_member_id = NULL WHERE event_id = ?", [event.id], tx);
    await run("DELETE FROM ss_wish WHERE member_id IN (SELECT id FROM ss_member WHERE event_id = ?)", [event.id], tx);
    await run("DELETE FROM ss_member WHERE event_id = ?", [event.id], tx);
    await run("DELETE FROM ss_event WHERE id = ?", [event.id], tx);
    return { ok: true };
  });
}

// ---- Medlemmar

type MemberRow = { id: number; event_id: number };

// Medlemmen, om aktören får ändra gruppen den ligger i
async function manageableMember(actor: Parent | null, rawId: unknown, tx: Executor): Promise<(MemberRow & { owner_id: number }) | Outcome> {
  const id = parseId(rawId);
  const member = id === null ? undefined : await get<MemberRow & { owner_id: number }>("SELECT m.id, m.event_id, e.owner_id FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE m.id = ?", [id], tx);
  if (!member) return GONE;
  return canManage(actor, member) ? member : NOT_ALLOWED;
}

// Telefon och e-post är unika inom gruppen (MUPP-048-R5); exceptId är medlemmen som ändras
async function contactTaken(eventId: number, phone: string, email: string, exceptId: number | null, tx: Executor) {
  const others = await all<{ phone: string; email: string }>("SELECT phone, email FROM ss_member WHERE event_id = ? AND id IS NOT ?", [eventId, exceptId], tx);
  if (others.some((o) => o.phone === phone)) return PHONE_TAKEN;
  if (others.some((o) => o.email.toLowerCase() === email.toLowerCase())) return EMAIL_TAKEN;
  return null;
}

// En ny medlem i gruppen
export async function addMember(actor: Parent | null, input: { eventId: unknown; name: unknown; phone: unknown; email: unknown }): Promise<Outcome> {
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, input.eventId, tx);
    if (isOutcome(event)) return event;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { name, phone, email } = checked.values;
    const taken = await contactTaken(event.id, phone, email, null, tx);
    if (taken) return taken;
    await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event.id, name, phone, email], tx);
    return { ok: true };
  });
}

// Medlemmens uppgifter och partnern: en annan medlem i samma grupp, eller ingen; länken sätts åt båda håll (MUPP-038-R5)
export async function saveMember(actor: Parent | null, input: { memberId: unknown; name: unknown; phone: unknown; email: unknown; partnerId: unknown }): Promise<Outcome> {
  const partnerId = input.partnerId === "" || input.partnerId === undefined ? null : parseId(input.partnerId);
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  return withTransaction(async (tx) => {
    const member = await manageableMember(actor, input.memberId, tx);
    if (isOutcome(member)) return member;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { name, phone, email } = checked.values;
    if (input.partnerId !== "" && input.partnerId !== undefined && partnerId === null) return PARTNER_IN_GROUP;
    if (partnerId !== null) {
      const partner = partnerId === member.id ? undefined : await get<MemberRow>("SELECT id, event_id FROM ss_member WHERE id = ?", [partnerId], tx);
      if (partner?.event_id !== member.event_id) return PARTNER_IN_GROUP;
    }
    const taken = await contactTaken(member.event_id, phone, email, member.id, tx);
    if (taken) return taken;
    await run("UPDATE ss_member SET name = ?, phone = ?, email = ? WHERE id = ?", [name, phone, email, member.id], tx);
    await setPartner(member.id, partnerId, tx);
    return { ok: true };
  });
}

// Först släpps de gamla paren (den här medlemmens och den nya partnerns), sedan sätts det nya åt båda håll
async function setPartner(memberId: number, partnerId: number | null, tx: Executor) {
  // Utan ny partner är det andra id:t NULL, som aldrig matchar
  const ids = [memberId, partnerId];
  await run("UPDATE ss_member SET partner_member_id = NULL WHERE id IN (?, ?) OR partner_member_id IN (?, ?)", [...ids, ...ids], tx);
  if (partnerId !== null) {
    await run("UPDATE ss_member SET partner_member_id = ? WHERE id = ?", [partnerId, memberId], tx);
    await run("UPDATE ss_member SET partner_member_id = ? WHERE id = ?", [memberId, partnerId], tx);
  }
}

// Medlemmen, hens önskelista och kontaktuppgifter tas bort ur gruppen
export async function removeMember(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  return withTransaction(async (tx) => {
    const member = await manageableMember(actor, rawId, tx);
    if (isOutcome(member)) return member;
    await setPartner(member.id, null, tx);
    await run("DELETE FROM ss_wish WHERE member_id = ?", [member.id], tx);
    await run("DELETE FROM ss_member WHERE id = ?", [member.id], tx);
    return { ok: true };
  });
}
