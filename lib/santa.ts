import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import { collect, parseEmail, parseId, parsePhone, parseText } from "./form-input";
import type { Outcome, Parent } from "./family";

// Secret Santa: familjer, personer och medlemskap (MUPP-038). Bara huvudadministratören får läsa eller
// ändra något här, och telefon och e-post lämnar aldrig de här funktionerna till någon annan sida.
// Allt som ändrar något tar emot vem som gör det (läst ur databasen vid varje förfrågan) och kontrollerar
// både rättigheten och indatan här.

export type SantaMember = { id: number; personId: number; name: string; phone: string; email: string; partnerId: number | null };
export type SantaFamily = { id: number; name: string; members: SantaMember[] };
// En person som redan finns, att lägga till i en annan familj (MUPP-038-R4)
export type KnownPerson = { id: number; name: string };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;
const GONE = { ok: false, error: "Det finns inte längre. Ladda om sidan." } as const;
const PHONE_TAKEN = { ok: false, fields: { phone: "Numret används redan av en annan person." } } as const;

const isMaster = (actor: Parent | null): actor is Parent => actor?.isMasterAdmin === true;

// ---- Läsa

// Familjerna med sina medlemmar, i namnordning, och personerna som finns i någon familj
export async function listFamilies(actor: Parent | null): Promise<{ families: SantaFamily[]; people: (KnownPerson & { familyIds: number[] })[] }> {
  if (!isMaster(actor)) return { families: [], people: [] };
  const families = await all<{ id: number; name: string }>("SELECT id, name FROM ss_family ORDER BY name, id");
  const rows = await all<{ id: number; family_id: number; person_id: number; name: string; phone: string; email: string; partner_member_id: number | null }>(
    `SELECT m.id, m.family_id, m.person_id, p.name, p.phone, p.email, m.partner_member_id
     FROM ss_member m JOIN ss_person p ON p.id = m.person_id ORDER BY p.name, m.id`,
  );
  const byFamily = new Map<number, SantaMember[]>();
  const familiesOf = new Map<number, { id: number; name: string; familyIds: number[] }>();
  for (const r of rows) {
    const member = { id: r.id, personId: r.person_id, name: r.name, phone: r.phone, email: r.email, partnerId: r.partner_member_id };
    byFamily.set(r.family_id, [...(byFamily.get(r.family_id) ?? []), member]);
    const person = familiesOf.get(r.person_id) ?? { id: r.person_id, name: r.name, familyIds: [] };
    person.familyIds.push(r.family_id);
    familiesOf.set(r.person_id, person);
  }
  return { families: families.map((f) => ({ ...f, members: byFamily.get(f.id) ?? [] })), people: [...familiesOf.values()] };
}

// ---- Familjer

export async function saveFamily(actor: Parent | null, input: { id?: unknown; name: unknown }): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const checked = collect({ name: parseText(input.name, 60, true) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  if (input.id === undefined || input.id === "") {
    await run("INSERT INTO ss_family (name) VALUES (?)", [checked.values.name]);
    return { ok: true };
  }
  const id = parseId(input.id);
  const { changes } = id === null ? { changes: 0 } : await run("UPDATE ss_family SET name = ? WHERE id = ?", [checked.values.name, id]);
  return changes > 0 ? { ok: true } : GONE;
}

// Familjen, medlemskapen och de personer som inte är med i någon annan familj tas bort.
// Allt görs här och inte bara av ON DELETE CASCADE: en transaktion behåller inte alltid
// inställningen för främmande nycklar på en lokal databasfil.
export async function removeFamily(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const id = parseId(rawId);
  if (id === null) return GONE;
  return withTransaction(async (tx) => {
    if (!(await get("SELECT 1 FROM ss_family WHERE id = ?", [id], tx))) return GONE;
    await run("UPDATE ss_member SET partner_member_id = NULL WHERE family_id = ?", [id], tx);
    await run("DELETE FROM ss_member WHERE family_id = ?", [id], tx);
    await run("DELETE FROM ss_family WHERE id = ?", [id], tx);
    await dropPeopleWithoutFamily(tx);
    return { ok: true };
  });
}

const dropPeopleWithoutFamily = (tx: Executor) => run("DELETE FROM ss_person WHERE id NOT IN (SELECT person_id FROM ss_member)", [], tx);

// ---- Medlemmar

const memberFacts = (id: number, tx: Executor) => get<{ id: number; family_id: number; person_id: number }>("SELECT id, family_id, person_id FROM ss_member WHERE id = ?", [id], tx);

// En ny person i familjen
export async function addNewMember(actor: Parent | null, input: { familyId: unknown; name: unknown; phone: unknown; email: unknown }): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const familyId = parseId(input.familyId);
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name, phone, email } = checked.values;
  return withTransaction(async (tx) => {
    if (familyId === null || !(await get("SELECT 1 FROM ss_family WHERE id = ?", [familyId], tx))) return GONE;
    if (await get("SELECT 1 FROM ss_person WHERE phone = ?", [phone], tx)) return PHONE_TAKEN;
    const person = await run("INSERT INTO ss_person (name, phone, email) VALUES (?, ?, ?)", [name, phone, email], tx);
    await run("INSERT INTO ss_member (family_id, person_id) VALUES (?, ?)", [familyId, person.lastId], tx);
    return { ok: true };
  });
}

// En person som redan finns, i ytterligare en familj (MUPP-038-R4)
export async function joinFamily(actor: Parent | null, input: { familyId: unknown; personId: unknown }): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const familyId = parseId(input.familyId);
  const personId = parseId(input.personId);
  return withTransaction(async (tx) => {
    const found = familyId !== null && personId !== null && (await get("SELECT 1 FROM ss_family f, ss_person p WHERE f.id = ? AND p.id = ?", [familyId, personId], tx));
    if (!found) return GONE;
    if (await get("SELECT 1 FROM ss_member WHERE family_id = ? AND person_id = ?", [familyId, personId], tx)) {
      return { ok: false, error: "Personen är redan med i familjen." };
    }
    await run("INSERT INTO ss_member (family_id, person_id) VALUES (?, ?)", [familyId, personId], tx);
    return { ok: true };
  });
}

// Personens uppgifter (gäller i alla hens familjer, en person och inte flera kopior) och partnern i den här familjen.
// Partnern är ett annat medlemskap i samma familj, eller ingen; länken sätts åt båda håll (MUPP-038-R5).
export async function saveMember(actor: Parent | null, input: { memberId: unknown; name: unknown; phone: unknown; email: unknown; partnerId: unknown }): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const memberId = parseId(input.memberId);
  const partnerId = input.partnerId === "" || input.partnerId === undefined ? null : parseId(input.partnerId);
  const checked = collect({ name: parseText(input.name, 60, true), phone: parsePhone(input.phone), email: parseEmail(input.email) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name, phone, email } = checked.values;
  return withTransaction(async (tx) => {
    const member = memberId === null ? undefined : await memberFacts(memberId, tx);
    if (!member) return GONE;
    if (input.partnerId !== "" && input.partnerId !== undefined && partnerId === null) return { ok: false, fields: { partnerId: "Välj en av de andra i familjen." } };
    if (partnerId !== null) {
      const partner = partnerId === member.id ? undefined : await memberFacts(partnerId, tx);
      if (partner?.family_id !== member.family_id) return { ok: false, fields: { partnerId: "Välj en av de andra i familjen." } };
    }
    if (await get("SELECT 1 FROM ss_person WHERE phone = ? AND id <> ?", [phone, member.person_id], tx)) return PHONE_TAKEN;
    await run("UPDATE ss_person SET name = ?, phone = ?, email = ? WHERE id = ?", [name, phone, email, member.person_id], tx);
    await setPartner(member.id, partnerId, tx);
    return { ok: true };
  });
}

// Först släpps de gamla paren (den här medlemmens och den nya partnerns), sedan sätts det nya åt båda håll
async function setPartner(memberId: number, partnerId: number | null, tx: Executor) {
  const ids = [memberId, ...(partnerId === null ? [] : [partnerId])];
  const marks = ids.map(() => "?").join(", ");
  await run(`UPDATE ss_member SET partner_member_id = NULL WHERE id IN (${marks}) OR partner_member_id IN (${marks})`, [...ids, ...ids], tx);
  if (partnerId !== null) {
    await run("UPDATE ss_member SET partner_member_id = ? WHERE id = ?", [partnerId, memberId], tx);
    await run("UPDATE ss_member SET partner_member_id = ? WHERE id = ?", [memberId, partnerId], tx);
  }
}

// Medlemmen tas bort ur familjen; är det den sista familjen tas personen och hens uppgifter bort (MUPP-038-R3)
export async function removeMember(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  if (!isMaster(actor)) return NOT_ALLOWED;
  const id = parseId(rawId);
  return withTransaction(async (tx) => {
    const member = id === null ? undefined : await memberFacts(id, tx);
    if (!member) return GONE;
    await setPartner(member.id, null, tx);
    await run("DELETE FROM ss_member WHERE id = ?", [member.id], tx);
    await dropPeopleWithoutFamily(tx);
    return { ok: true };
  });
}
