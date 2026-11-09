import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const santa = await import("./santa");
const family = await import("./family");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};

// Påhittade föräldrar, personer och nummer
let master: Parent;
let emma: Parent;
let erik: Parent;
let counter = 0;
async function newParent(name: string, isMasterAdmin = false): Promise<Parent> {
  const { lastId } = await run("INSERT INTO parent (name, is_master_admin) VALUES (?, ?)", [name, isMasterAdmin ? 1 : 0]);
  return { id: lastId, name, isMasterAdmin };
}
beforeEach(async () => {
  await clear();
  [master, emma, erik] = [await newParent("Chef", true), await newParent("Emma"), await newParent("Erik")];
});
afterAll(clear);

async function event(owner: Parent, name: string) {
  expect(await santa.saveEvent(owner, { name })).toEqual({ ok: true });
  return (await get<{ id: number }>("SELECT id FROM ss_event WHERE name = ?", [name]))!.id;
}
async function person(actor: Parent, eventId: number, name: string, phone = `070000${String(++counter).padStart(4, "0")}`, email = `${name.toLowerCase()}@exempel.se`) {
  const outcome = await santa.addMember(actor, { eventId: String(eventId), name, phone, email });
  expect(outcome).toEqual({ ok: true });
  return (await get<{ id: number }>("SELECT id FROM ss_member WHERE event_id = ? AND name = ?", [eventId, name]))!.id;
}
const members = async (eventId: number) => (await santa.listEvents(master)).find((e) => e.id === eventId)!.members;
const edit = (memberId: number, extra = {}) => ({ memberId: String(memberId), name: "Namn", phone: `07099${String(memberId).padStart(5, "0")}`, email: `namn${memberId}@exempel.se`, partnerId: "", ...extra });
const count = async (table: string) => (await get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;
const refused = { ok: false, error: "Du kan inte göra det här." };

describe("MUPP-048-R1 every parent can create an event", () => {
  test("MUPP-048-R1 a parent who is not master admin creates an event and administers it", async () => {
    const id = await event(emma, "Emmas jul");
    expect(await santa.listEvents(emma)).toMatchObject([{ id, name: "Emmas jul", ownerId: emma.id, ownerName: "Emma", members: [] }]);
    await person(emma, id, "Anna");
    expect(await santa.saveEvent(emma, { id: String(id), name: "Emmas julafton" })).toEqual({ ok: true });
    expect((await members(id)).map((m) => m.name)).toEqual(["Anna"]);
    expect(await santa.removeEvent(emma, String(id))).toEqual({ ok: true });
    expect(await count("ss_event")).toBe(0);
  });

  test("MUPP-048-R1 nobody signed out can read or change anything", async () => {
    const id = await event(emma, "Emmas jul");
    const m = await person(emma, id, "Anna");
    expect(await santa.listEvents(null)).toEqual([]);
    expect(await santa.saveEvent(null, { name: "Ny" })).toEqual(refused);
    expect(await santa.saveEvent(null, { id: String(id), name: "Ny" })).toEqual(refused);
    expect(await santa.removeEvent(null, String(id))).toEqual(refused);
    expect(await santa.addMember(null, { eventId: String(id), name: "B", phone: "0701234567", email: "b@exempel.se" })).toEqual(refused);
    expect(await santa.saveMember(null, edit(m))).toEqual(refused);
    expect(await santa.removeMember(null, String(m))).toEqual(refused);
    expect(await count("ss_event")).toBe(1);
    expect(await count("ss_member")).toBe(1);
  });
});

describe("MUPP-048-R2 events and their names", () => {
  test("MUPP-048-R2 a name has 1 to 60 characters, is trimmed, and can be changed", async () => {
    expect(await santa.saveEvent(emma, { name: "  Julen 2026 " })).toEqual({ ok: true });
    expect((await santa.listEvents(emma))[0].name).toBe("Julen 2026");
    expect(await santa.saveEvent(emma, { name: "a".repeat(60) })).toEqual({ ok: true });
    for (const name of ["", "   ", "a".repeat(61), null]) expect(await santa.saveEvent(emma, { name }), String(name)).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await santa.saveEvent(emma, { id: "99999", name: "Finns inte" })).toMatchObject({ ok: false });
    expect(await count("ss_event")).toBe(2);
  });

  test("MUPP-048-R2 a name is unique among all events, ignoring case and spaces at the ends, also when renaming", async () => {
    const julen = await event(emma, "Julen 2026");
    const taken = { ok: false, fields: { name: "Det finns redan en grupp med det namnet." } };
    expect(await santa.saveEvent(erik, { name: "julen 2026 " })).toEqual(taken);
    expect(await santa.saveEvent(emma, { name: "JULEN 2026" })).toEqual(taken);
    const other = await event(erik, "Åke och vänner");
    expect(await santa.saveEvent(erik, { name: "åke OCH vänner" })).toEqual(taken);
    expect(await santa.saveEvent(erik, { id: String(other), name: "julen 2026" })).toEqual(taken);
    // Att spara om samma grupp med nästan samma namn är inte en dubblett
    expect(await santa.saveEvent(emma, { id: String(julen), name: "JULEN 2026" })).toEqual({ ok: true });
    expect(await count("ss_event")).toBe(2);
  });

  test("MUPP-048-R2 deleting an event removes its members and wish lists, and frees the name", async () => {
    const a = await event(emma, "Grupp A");
    const m = await person(emma, a, "Anna");
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [m]);
    expect(await santa.removeEvent(emma, String(a))).toEqual({ ok: true });
    expect(await count("ss_member")).toBe(0);
    expect(await count("ss_wish")).toBe(0);
    expect(await santa.removeEvent(emma, String(a))).toMatchObject({ ok: false });
    expect(await santa.removeEvent(emma, "abc")).toMatchObject({ ok: false });
    expect(await santa.saveEvent(emma, { name: "Grupp A" })).toEqual({ ok: true });
  });

  test("MUPP-048-R2 a parent who administers an event cannot be removed", async () => {
    await event(emma, "Emmas jul");
    expect(await family.removeParent(master, String(emma.id))).toEqual({ ok: false, error: "Föräldern administrerar Secret Santa-grupper. Ta bort grupperna först." });
    expect(await get("SELECT 1 FROM parent WHERE id = ?", [emma.id])).toBeDefined();
    expect(await family.removeParent(master, String(erik.id))).toEqual({ ok: true });
  });
});

describe("MUPP-048-R3 own events only", () => {
  test("MUPP-048-R3 a parent sees only their own events, the master admin sees all", async () => {
    await event(emma, "Emmas jul");
    await event(erik, "Eriks jul");
    expect((await santa.listEvents(emma)).map((e) => e.name)).toEqual(["Emmas jul"]);
    expect((await santa.listEvents(erik)).map((e) => e.name)).toEqual(["Eriks jul"]);
    expect((await santa.listEvents(master)).map((e) => e.name)).toEqual(["Emmas jul", "Eriks jul"]);
  });

  test("MUPP-048-R3 every change of someone else's event or member is refused and changes nothing", async () => {
    const id = await event(emma, "Emmas jul");
    const m = await person(emma, id, "Anna");
    const partner = await person(emma, id, "Bo");
    expect(await santa.saveEvent(erik, { id: String(id), name: "Eriks nu" })).toEqual(refused);
    expect(await santa.removeEvent(erik, String(id))).toEqual(refused);
    expect(await santa.addMember(erik, { eventId: String(id), name: "Cia", phone: "0701234567", email: "cia@exempel.se" })).toEqual(refused);
    expect(await santa.saveMember(erik, edit(m, { partnerId: String(partner) }))).toEqual(refused);
    expect(await santa.removeMember(erik, String(m))).toEqual(refused);
    expect(await all("SELECT name FROM ss_event")).toEqual([{ name: "Emmas jul" }]);
    expect(await members(id)).toMatchObject([{ name: "Anna", partnerId: null }, { name: "Bo", partnerId: null }]);
  });

  test("MUPP-048-R3 the master admin can change every event", async () => {
    const id = await event(emma, "Emmas jul");
    const m = await person(master, id, "Anna");
    expect(await santa.saveMember(master, edit(m, { name: "Anna" }))).toEqual({ ok: true });
    expect(await santa.saveEvent(master, { id: String(id), name: "Julen" })).toEqual({ ok: true });
    expect(await santa.removeMember(master, String(m))).toEqual({ ok: true });
    expect(await santa.removeEvent(master, String(id))).toEqual({ ok: true });
  });
});

describe("MUPP-038-R3 MUPP-048-R5 members", () => {
  test("MUPP-038-R3 a member needs a name, a phone written 07XXXXXXXX and an email", async () => {
    const f = await event(emma, "Grupp A");
    const input = { eventId: String(f), name: "Anna", phone: "0701234567", email: "anna@exempel.se" };
    expect(await santa.addMember(emma, { ...input, phone: "070 123 45 67" })).toEqual({ ok: false, fields: { phone: "Skriv numret som 07XXXXXXXX" } });
    expect(await santa.addMember(emma, { ...input, email: "anna" })).toMatchObject({ ok: false, fields: { email: expect.any(String) } });
    expect(await santa.addMember(emma, { ...input, name: "a".repeat(61) })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await santa.addMember(emma, { ...input, name: "", phone: "", email: "" })).toMatchObject({ ok: false, fields: { name: expect.any(String), phone: expect.any(String), email: expect.any(String) } });
    expect(await santa.addMember(emma, { ...input, eventId: "99999" })).toMatchObject({ ok: false });
    expect(await count("ss_member")).toBe(0);
    expect(await santa.addMember(emma, input)).toEqual({ ok: true });
    expect(await members(f)).toMatchObject([{ name: "Anna", phone: "0701234567", email: "anna@exempel.se", partnerId: null }]);
  });

  test("MUPP-048-R5 a phone number and an email belong to one member of an event, the email ignoring case", async () => {
    const f = await event(emma, "Grupp A");
    await person(emma, f, "Anna", "0701111111", "anna@exempel.se");
    const bo = await person(emma, f, "Bo", "0702222222", "bo@exempel.se");
    const base = { eventId: String(f), name: "Cia" };
    expect(await santa.addMember(emma, { ...base, phone: "0701111111", email: "cia@exempel.se" })).toMatchObject({ ok: false, fields: { phone: expect.any(String) } });
    expect(await santa.addMember(emma, { ...base, phone: "0703333333", email: "ANNA@exempel.se" })).toMatchObject({ ok: false, fields: { email: expect.any(String) } });
    expect(await santa.saveMember(emma, edit(bo, { phone: "0701111111", email: "bo@exempel.se" }))).toMatchObject({ ok: false, fields: { phone: expect.any(String) } });
    expect(await santa.saveMember(emma, edit(bo, { phone: "0702222222", email: "Anna@exempel.se" }))).toMatchObject({ ok: false, fields: { email: expect.any(String) } });
    // Sina egna uppgifter får man spara om
    expect(await santa.saveMember(emma, edit(bo, { phone: "0702222222", email: "bo@exempel.se" }))).toEqual({ ok: true });
    expect(await count("ss_member")).toBe(2);
  });

  test("MUPP-048-R5 the same phone and email can be in two events, as two separate members", async () => {
    const a = await event(emma, "Grupp A");
    const b = await event(erik, "Grupp B");
    const annaA = await person(emma, a, "Anna", "0701111111", "anna@exempel.se");
    const annaB = await person(erik, b, "Anna", "0701111111", "anna@exempel.se");
    expect(annaA).not.toBe(annaB);
    expect(await santa.saveMember(emma, edit(annaA, { name: "Anna Ny", phone: "0708888888", email: "ny@exempel.se" }))).toEqual({ ok: true });
    expect(await members(a)).toMatchObject([{ name: "Anna Ny", phone: "0708888888" }]);
    expect(await members(b)).toMatchObject([{ name: "Anna", phone: "0701111111", email: "anna@exempel.se" }]);
    expect(await santa.removeMember(emma, String(annaA))).toEqual({ ok: true });
    expect(await members(b)).toHaveLength(1);
  });

  test("MUPP-038-R3 removing a member removes their wish list, and a second time says it is gone", async () => {
    const f = await event(emma, "Grupp A");
    const anna = await person(emma, f, "Anna");
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [anna]);
    expect(await santa.removeMember(emma, String(anna))).toEqual({ ok: true });
    expect(await count("ss_member")).toBe(0);
    expect(await count("ss_wish")).toBe(0);
    expect(await santa.removeMember(emma, String(anna))).toMatchObject({ ok: false });
  });
});

describe("MUPP-038-R5 partner", () => {
  const partnersOf = async (eventId: number) => Object.fromEntries((await members(eventId)).map((m) => [m.name, m.partnerId]));

  test("MUPP-038-R5 the partner link goes both ways, and changing or clearing it updates both", async () => {
    const f = await event(emma, "Grupp A");
    const [anna, bo, cia, dan] = [await person(emma, f, "Anna"), await person(emma, f, "Bo"), await person(emma, f, "Cia"), await person(emma, f, "Dan")];

    expect(await santa.saveMember(emma, edit(anna, { name: "Anna", partnerId: String(bo) }))).toEqual({ ok: true });
    expect(await partnersOf(f)).toEqual({ Anna: bo, Bo: anna, Cia: null, Dan: null });

    // Anna får en ny partner: Bo blir ensam
    await santa.saveMember(emma, edit(anna, { name: "Anna", partnerId: String(cia) }));
    expect(await partnersOf(f)).toEqual({ Anna: cia, Bo: null, Cia: anna, Dan: null });

    // Dan väljer Cia: Annas par släpps, så att ingen har en partner som har en annan
    await santa.saveMember(emma, edit(dan, { name: "Dan", partnerId: String(cia) }));
    expect(await partnersOf(f)).toEqual({ Anna: null, Bo: null, Cia: dan, Dan: cia });

    await santa.saveMember(emma, edit(dan, { name: "Dan", partnerId: "" }));
    expect(await partnersOf(f)).toEqual({ Anna: null, Bo: null, Cia: null, Dan: null });
  });

  test("MUPP-038-R5 the partner is another member of the same event, never the member themself", async () => {
    const a = await event(emma, "Grupp A");
    const b = await event(emma, "Grupp B");
    const anna = await person(emma, a, "Anna");
    await person(emma, a, "Bo");
    const other = await person(emma, b, "Cia");
    const bad = { ok: false, fields: { partnerId: "Välj en av de andra i gruppen." } };
    expect(await santa.saveMember(emma, edit(anna, { partnerId: String(anna) }))).toEqual(bad);
    expect(await santa.saveMember(emma, edit(anna, { partnerId: String(other) }))).toEqual(bad);
    expect(await santa.saveMember(emma, edit(anna, { partnerId: "99999" }))).toEqual(bad);
    expect(await santa.saveMember(emma, edit(anna, { partnerId: "abc" }))).toEqual(bad);
    expect(await partnersOf(a)).toEqual({ Anna: null, Bo: null });
  });

  test("MUPP-038-R5 removing a member frees their partner", async () => {
    const f = await event(emma, "Grupp A");
    const anna = await person(emma, f, "Anna");
    const bo = await person(emma, f, "Bo");
    await santa.saveMember(emma, edit(anna, { name: "Anna", partnerId: String(bo) }));
    await santa.removeMember(emma, String(bo));
    expect(await partnersOf(f)).toEqual({ Anna: null });
  });

  test("MUPP-038-R5 deleting an event leaves no partner link behind", async () => {
    const f = await event(emma, "Grupp A");
    const anna = await person(emma, f, "Anna");
    const bo = await person(emma, f, "Bo");
    await santa.saveMember(emma, edit(anna, { name: "Anna", partnerId: String(bo) }));
    await santa.removeEvent(emma, String(f));
    expect(await count("ss_member")).toBe(0);
  });
});
