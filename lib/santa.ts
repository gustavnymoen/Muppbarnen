import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import { collect, parseEmail, parseId, parsePhone, parseText } from "./form-input";
import type { Outcome, Parent } from "./family";
import { clearListChanges } from "./santa-changes";
import { drawPairs, type SetAside } from "./santa-draw";

// Secret Santa: grupper (events) och deras medlemmar (MUPP-038, MUPP-048). Vilken förälder som helst skapar en
// grupp och administrerar den; huvudadministratören ser och ändrar alla. Telefon och e-post lämnar aldrig de här
// funktionerna till någon annan sida. Allt som ändrar något tar emot vem som gör det (läst ur databasen vid varje
// förfrågan) och kontrollerar både rättigheten och indatan här.

// hasWishes: deltagaren har skrivit minst en önskning (kryssen i adminen, MUPP-041-R1)
export type SantaMember = { id: number; name: string; phone: string; email: string; partnerId: number | null; hasWishes: boolean };
// Gruppens status (MUPP-051): inaktiv tills administratören aktiverar den, förbereder medan medlemmar läggs till och
// önskelistor skrivs, startad när dragningen är gjord (MUPP-041)
export type EventStatus = "inactive" | "preparing" | "started";
export type SantaEvent = { id: number; name: string; status: EventStatus; ownerId: number; ownerName: string; members: SantaMember[] };
// Den som ska få ett mejl om gruppen; namnet är bara för administratörens lista över dem som inte fick något
export type Recipient = { name: string; email: string };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;
const GONE = { ok: false, error: "Det finns inte längre. Ladda om sidan." } as const;
const NAME_TAKEN = { ok: false, fields: { name: "Det finns redan en grupp med det namnet." } } as const;
const PHONE_TAKEN = { ok: false, fields: { phone: "Numret används redan av en annan person i gruppen." } } as const;
const EMAIL_TAKEN = { ok: false, fields: { email: "E-postadressen används redan av en annan person i gruppen." } } as const;
const STARTED = { ok: false, error: "Gruppen är startad. Deltagare kan inte läggas till eller tas bort nu." } as const;
const WRONG_STATUS = { ok: false, error: "Gruppens status har redan ändrats. Ladda om sidan." } as const;
const PARTNER_LOCKED = { ok: false, error: "Gruppen är startad. Partnern kan inte ändras nu." } as const;
const PARTNER_IN_GROUP = { ok: false, fields: { partnerId: "Välj en av de andra i gruppen." } } as const;

type EventRow = { id: number; owner_id: number; name: string; status: EventStatus };

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
async function manageableEvent(actor: Parent | null, rawId: unknown, tx: Executor): Promise<EventRow | Failure> {
  const id = parseId(rawId);
  const event = id === null ? undefined : await get<EventRow>("SELECT id, owner_id, name, status FROM ss_event WHERE id = ?", [id], tx);
  if (!event) return GONE;
  return canManage(actor, event) ? event : NOT_ALLOWED;
}

// Ett nekande svar (inte ett lyckat): det som slår upp en rad svarar med det eller med raden
type Failure = Extract<Outcome, { ok: false }>;
const isOutcome = <T extends object>(value: T | Failure): value is Failure => "ok" in value;

// ---- Läsa

// Grupperna aktören får se (egna; alla för huvudadministratören) med medlemmarna, i namnordning
export async function listEvents(actor: Parent | null): Promise<SantaEvent[]> {
  if (!actor) return [];
  // Samma urval för grupperna och medlemmarna (fast SQL-text): kontaktuppgifter för andras grupper läses aldrig ens in
  const args = [actor.isMasterAdmin ? 1 : 0, actor.id];
  const events = await all<EventRow & { owner_name: string }>(
    "SELECT e.id, e.owner_id, e.name, e.status, p.name AS owner_name FROM ss_event e JOIN parent p ON p.id = e.owner_id WHERE (? = 1 OR e.owner_id = ?) ORDER BY e.name, e.id",
    args,
  );
  const rows = await all<{ id: number; event_id: number; name: string; phone: string; email: string; partner_member_id: number | null; wishes: number }>(
    "SELECT m.id, m.event_id, m.name, m.phone, m.email, m.partner_member_id, (SELECT COUNT(*) FROM ss_wish w WHERE w.member_id = m.id) AS wishes FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE (? = 1 OR e.owner_id = ?) ORDER BY m.name, m.id",
    args,
  );
  return events.map((e) => ({
    id: e.id,
    name: e.name,
    status: e.status,
    ownerId: e.owner_id,
    ownerName: e.owner_name,
    members: rows.filter((r) => r.event_id === e.id).map((r) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, partnerId: r.partner_member_id, hasWishes: r.wishes > 0 })),
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
    await run("DELETE FROM ss_draw WHERE event_id = ?", [event.id], tx);
    await run("DELETE FROM ss_member WHERE event_id = ?", [event.id], tx);
    await run("DELETE FROM ss_event WHERE id = ?", [event.id], tx);
    return { ok: true };
  });
}

// ---- Status

type StatusChange = { eventName: string; adminName: string; recipients: Recipient[] };

// Aktivera (inaktiv → förbereder) eller avaktivera (förbereder → inaktiv), MUPP-051-R2. En startad grupp lämnas bara av
// dragningen (MUPP-041). Svaret säger vem som ska få mejlet; att skicka det gör anroparen när statusen är sparad.
async function changeStatus(actor: Parent | null, rawId: unknown, from: EventStatus, to: EventStatus): Promise<Outcome<StatusChange>> {
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, rawId, tx);
    if (isOutcome(event)) return event;
    if (event.status === "started") return { ok: false, error: "Gruppen är startad. Dragningen måste stoppas först." };
    if (event.status !== from) return WRONG_STATUS;
    await run("UPDATE ss_event SET status = ? WHERE id = ? AND status = ?", [to, event.id, from], tx);
    const recipients = await all<Recipient>("SELECT name, email FROM ss_member WHERE event_id = ? ORDER BY name, id", [event.id], tx);
    return { ok: true, eventName: event.name, adminName: await ownerName(event.owner_id, tx), recipients };
  });
}

export const activateEvent = (actor: Parent | null, rawId: unknown) => changeStatus(actor, rawId, "inactive", "preparing");
export const deactivateEvent = (actor: Parent | null, rawId: unknown) => changeStatus(actor, rawId, "preparing", "inactive");

// ---- Dragningen (MUPP-041)

export type DrawStart = StatusChange & { setAside: SetAside[] };
const NEEDS_TWO = { ok: false, error: "Dragningen går inte att göra: det behövs minst två deltagare." } as const;
const thisYear = () => new Date().getFullYear();

// Startar dragningen (förbereder → startad): alla dras, raderna sparas och gruppen blir startad, allt i en transaktion. Svaret säger
// vilka regler som fick släppas, aldrig vem som drog vem (R5). Att skicka mejlet gör anroparen.
export async function startDraw(actor: Parent | null, rawId: unknown): Promise<Outcome<DrawStart>> {
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, rawId, tx);
    if (isOutcome(event)) return event;
    if (event.status !== "preparing") return WRONG_STATUS;
    const members = await all<{ id: number; name: string; email: string; partner_member_id: number | null }>(
      "SELECT id, name, email, partner_member_id FROM ss_member WHERE event_id = ? ORDER BY name, id",
      [event.id],
      tx,
    );
    // Förra årets dragning: raderna från det senaste tidigare året. Ett stoppat försök har inga rader kvar och räknas inte.
    const previous = await all<{ giver_id: number; receiver_id: number }>(
      "SELECT giver_id, receiver_id FROM ss_draw WHERE event_id = ? AND year = (SELECT MAX(year) FROM ss_draw WHERE event_id = ? AND year < ?)",
      [event.id, event.id, thisYear()],
      tx,
    );
    const result = drawPairs(
      members.map((m) => ({ id: m.id, partnerId: m.partner_member_id })),
      new Map(previous.map((r) => [r.giver_id, r.receiver_id])),
    );
    if (!result.ok) return NEEDS_TWO;
    // Rader som blev kvar av en tidigare dragning samma år (efter en rensning) ersätts
    await run("DELETE FROM ss_draw WHERE event_id = ? AND year = ?", [event.id, thisYear()], tx);
    for (const [giver, receiver] of result.pairs) {
      await run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?)", [event.id, thisYear(), giver, receiver], tx);
    }
    await run("UPDATE ss_event SET status = 'started' WHERE id = ? AND status = 'preparing'", [event.id], tx);
    await clearListChanges(event.id, tx);
    return { ok: true, eventName: event.name, adminName: await ownerName(event.owner_id, tx), recipients: members.map((m) => ({ name: m.name, email: m.email })), setAside: result.setAside };
  });
}

// Stoppar dragningen (startad → förbereder): årets rader tas bort, så de inte räknas som förra året; önskelistorna finns kvar.
// Samtalen (MUPP-043) tas bort här när de finns.
export async function stopDraw(actor: Parent | null, rawId: unknown): Promise<Outcome<StatusChange>> {
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, rawId, tx);
    if (isOutcome(event)) return event;
    if (event.status !== "started") return WRONG_STATUS;
    // Det senaste året, inte innevarande: en dragning i december som stoppas i januari ska också tas bort
    await run("DELETE FROM ss_draw WHERE event_id = ? AND year = (SELECT MAX(year) FROM ss_draw WHERE event_id = ?)", [event.id, event.id], tx);
    await run("UPDATE ss_event SET status = 'preparing' WHERE id = ? AND status = 'started'", [event.id], tx);
    await clearListChanges(event.id, tx);
    const recipients = await all<Recipient>("SELECT name, email FROM ss_member WHERE event_id = ? ORDER BY name, id", [event.id], tx);
    return { ok: true, eventName: event.name, adminName: await ownerName(event.owner_id, tx), recipients };
  });
}

// Den som mejlen säger att man ska höra av sig till: gruppens ägare
async function ownerName(ownerId: number, tx: Executor) {
  return (await get<{ name: string }>("SELECT name FROM parent WHERE id = ?", [ownerId], tx))?.name ?? "";
}

// ---- Medlemmar

type MemberRow = { id: number; event_id: number };
type ManageableMember = MemberRow & { owner_id: number; status: EventStatus; name: string; email: string };

// Medlemmen, om aktören får ändra gruppen den ligger i. Också i en startad grupp: namn, telefon och e-post får rättas hela tiden (MUPP-060-R1);
// vad som annars är låst i en startad grupp (MUPP-051-R3) avgör den som anropar.
async function manageableMember(actor: Parent | null, rawId: unknown, tx: Executor): Promise<ManageableMember | Failure> {
  const id = parseId(rawId);
  const member = id === null ? undefined : await get<ManageableMember>("SELECT m.id, m.event_id, m.name, m.email, e.owner_id, e.status FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE m.id = ?", [id], tx);
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

// Det som behövs för att skicka mejlet till en ny adress; status avgör vilket: inaktiv välkomstmejlet, förbereder också aktiveringsmejlet, startad startmejlet
export type NewMember = { name: string; email: string; eventName: string; adminName: string; status: EventStatus };

// En ny medlem i gruppen (inte i en startad)
export async function addMember(actor: Parent | null, input: { eventId: unknown; name: unknown; phone: unknown; email: unknown }): Promise<Outcome<NewMember>> {
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  return withTransaction(async (tx) => {
    const event = await manageableEvent(actor, input.eventId, tx);
    if (isOutcome(event)) return event;
    if (event.status === "started") return STARTED;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { name, phone, email } = checked.values;
    const taken = await contactTaken(event.id, phone, email, null, tx);
    if (taken) return taken;
    await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event.id, name, phone, email], tx);
    return { ok: true, name, email, eventName: event.name, adminName: await ownerName(event.owner_id, tx), status: event.status };
  });
}

// Medlemmens uppgifter och partnern: en annan medlem i samma grupp, eller ingen; länken sätts åt båda håll (MUPP-038-R5).
// I en startad grupp ändras bara namn, telefon och e-post, och partnerId får inte följa med alls (MUPP-060-R2).
// newEmail: den nya adressen när e-posten ändrades, så att administratören kan få frågan om den ska få mejlet (MUPP-060-R4)
export async function saveMember(actor: Parent | null, input: { memberId: unknown; name: unknown; phone: unknown; email: unknown; partnerId?: unknown }): Promise<Outcome<{ newEmail?: string }>> {
  const partnerId = input.partnerId === "" || input.partnerId === undefined ? null : parseId(input.partnerId);
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  return withTransaction(async (tx) => {
    const member = await manageableMember(actor, input.memberId, tx);
    if (isOutcome(member)) return member;
    const started = member.status === "started";
    if (started && input.partnerId != null) return PARTNER_LOCKED;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { name, phone, email } = checked.values;
    if (!started && input.partnerId !== "" && input.partnerId !== undefined && partnerId === null) return PARTNER_IN_GROUP;
    if (partnerId !== null) {
      const partner = partnerId === member.id ? undefined : await get<MemberRow>("SELECT id, event_id FROM ss_member WHERE id = ?", [partnerId], tx);
      if (partner?.event_id !== member.event_id) return PARTNER_IN_GROUP;
    }
    const taken = await contactTaken(member.event_id, phone, email, member.id, tx);
    if (taken) return taken;
    await run("UPDATE ss_member SET name = ?, phone = ?, email = ? WHERE id = ?", [name, phone, email, member.id], tx);
    if (!started) await setPartner(member.id, partnerId, tx);
    return email.toLowerCase() === member.email.toLowerCase() ? { ok: true } : { ok: true, newEmail: email };
  });
}

// Mejlet till en deltagares sparade adress (MUPP-060-R4), när administratören svarat ja efter att adressen ändrats. Adressen läses ur databasen och
// kommer aldrig från förfrågan, så att svaret inte kan peka mejlet någon annanstans.
export async function memberToMail(actor: Parent | null, rawId: unknown): Promise<Outcome<NewMember>> {
  return withTransaction(async (tx) => {
    const member = await manageableMember(actor, rawId, tx);
    if (isOutcome(member)) return member;
    const event = await get<{ name: string }>("SELECT name FROM ss_event WHERE id = ?", [member.event_id], tx);
    return { ok: true, name: member.name, email: member.email, eventName: event?.name ?? "", adminName: await ownerName(member.owner_id, tx), status: member.status };
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
    if (member.status === "started") return STARTED;
    await setPartner(member.id, null, tx);
    await run("DELETE FROM ss_wish WHERE member_id = ?", [member.id], tx);
    await run("DELETE FROM ss_draw WHERE event_id = ? AND (giver_id = ? OR receiver_id = ?)", [member.event_id, member.id, member.id], tx);
    await run("DELETE FROM ss_member WHERE id = ?", [member.id], tx);
    return { ok: true };
  });
}
