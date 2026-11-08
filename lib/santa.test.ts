import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const santa = await import("./santa");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_person");
  await run("DELETE FROM ss_family");
};
beforeEach(clear);
afterAll(clear);

// Påhittade personer och nummer
const master: Parent = { id: 1, name: "Chef", isMasterAdmin: true };
const parent: Parent = { id: 2, name: "Förälder", isMasterAdmin: false };
let counter = 0;

async function family(name: string) {
  return (await run("INSERT INTO ss_family (name) VALUES (?)", [name])).lastId;
}
async function person(familyId: number, name: string, phone = `070000${String(++counter).padStart(4, "0")}`) {
  const outcome = await santa.addNewMember(master, { familyId: String(familyId), name, phone, email: `${name.toLowerCase()}@exempel.se` });
  expect(outcome).toEqual({ ok: true });
  return (await get<{ id: number }>("SELECT m.id FROM ss_member m JOIN ss_person p ON p.id = m.person_id WHERE m.family_id = ? AND p.name = ?", [familyId, name]))!.id;
}
const members = async (familyId: number) => (await santa.listFamilies(master)).families.find((f) => f.id === familyId)!.members;
const edit = (memberId: number, extra = {}) => ({ memberId: String(memberId), name: "Namn", phone: `07099${String(memberId).padStart(5, "0")}`, email: "namn@exempel.se", partnerId: "", ...extra });
const count = async (table: string) => (await get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;

describe("MUPP-038-R1 only the master admin", () => {
  test("MUPP-038-R1 every read and change is refused for a parent who is not master admin, and for nobody", async () => {
    const f = await family("Familj A");
    const m = await person(f, "Anna");
    for (const actor of [parent, null]) {
      expect(await santa.listFamilies(actor)).toEqual({ families: [], people: [] });
      const refused = { ok: false, error: "Du kan inte göra det här." };
      expect(await santa.saveFamily(actor, { name: "Ny" })).toEqual(refused);
      expect(await santa.saveFamily(actor, { id: String(f), name: "Ny" })).toEqual(refused);
      expect(await santa.removeFamily(actor, String(f))).toEqual(refused);
      expect(await santa.addNewMember(actor, { familyId: String(f), name: "B", phone: "0701234567", email: "b@exempel.se" })).toEqual(refused);
      expect(await santa.joinFamily(actor, { familyId: String(f), personId: "1" })).toEqual(refused);
      expect(await santa.saveMember(actor, edit(m))).toEqual(refused);
      expect(await santa.removeMember(actor, String(m))).toEqual(refused);
    }
    expect(await count("ss_family")).toBe(1);
    expect(await count("ss_member")).toBe(1);
    expect((await get<{ name: string }>("SELECT name FROM ss_person"))!.name).toBe("Anna");
  });
});

describe("MUPP-038-R2 families", () => {
  test("MUPP-038-R2 a family is created with a name of 1 to 60 characters, renamed and listed", async () => {
    expect(await santa.saveFamily(master, { name: "  Familj A " })).toEqual({ ok: true });
    expect((await santa.listFamilies(master)).families).toMatchObject([{ name: "Familj A", members: [] }]);
    const id = (await santa.listFamilies(master)).families[0].id;
    expect(await santa.saveFamily(master, { id: String(id), name: "Familj B" })).toEqual({ ok: true });
    expect((await santa.listFamilies(master)).families[0].name).toBe("Familj B");
    expect(await santa.saveFamily(master, { name: "a".repeat(60) })).toEqual({ ok: true });
    for (const name of ["", "   ", "a".repeat(61), null]) expect(await santa.saveFamily(master, { name }), String(name)).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await santa.saveFamily(master, { id: "99999", name: "Finns inte" })).toMatchObject({ ok: false });
    expect(await count("ss_family")).toBe(2);
  });

  test("MUPP-038-R2 deleting a family removes its members, and the people who are in no other family", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const anna = await person(a, "Anna");
    await person(a, "Bo");
    const annaPerson = (await get<{ person_id: number }>("SELECT person_id FROM ss_member WHERE id = ?", [anna]))!.person_id;
    expect(await santa.joinFamily(master, { familyId: String(b), personId: String(annaPerson) })).toEqual({ ok: true });

    expect(await santa.removeFamily(master, String(a))).toEqual({ ok: true });
    expect(await all("SELECT name FROM ss_family")).toEqual([{ name: "Familj B" }]);
    expect(await all("SELECT name FROM ss_person")).toEqual([{ name: "Anna" }]);
    expect(await count("ss_member")).toBe(1);
    expect(await santa.removeFamily(master, String(a))).toMatchObject({ ok: false });
    expect(await santa.removeFamily(master, "abc")).toMatchObject({ ok: false });
  });
});

describe("MUPP-038-R3 members", () => {
  test("MUPP-038-R3 a member needs a name, a phone written 07XXXXXXXX and an email", async () => {
    const f = await family("Familj A");
    const input = { familyId: String(f), name: "Anna", phone: "0701234567", email: "anna@exempel.se" };
    expect(await santa.addNewMember(master, { ...input, phone: "070 123 45 67" })).toEqual({ ok: false, fields: { phone: "Skriv numret som 07XXXXXXXX" } });
    expect(await santa.addNewMember(master, { ...input, email: "anna" })).toMatchObject({ ok: false, fields: { email: expect.any(String) } });
    expect(await santa.addNewMember(master, { ...input, name: "a".repeat(61) })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await santa.addNewMember(master, { ...input, name: "", phone: "", email: "" })).toMatchObject({ ok: false, fields: { name: expect.any(String), phone: expect.any(String), email: expect.any(String) } });
    expect(await santa.addNewMember(master, { ...input, familyId: "99999" })).toMatchObject({ ok: false });
    expect(await count("ss_person")).toBe(0);
    expect(await santa.addNewMember(master, input)).toEqual({ ok: true });
    expect(await members(f)).toMatchObject([{ name: "Anna", phone: "0701234567", email: "anna@exempel.se", partnerId: null }]);
  });

  test("MUPP-038-R3 a phone number belongs to one person", async () => {
    const f = await family("Familj A");
    await person(f, "Anna", "0701111111");
    const bo = await person(f, "Bo", "0702222222");
    expect(await santa.addNewMember(master, { familyId: String(f), name: "Cia", phone: "0701111111", email: "cia@exempel.se" })).toMatchObject({ ok: false, fields: { phone: expect.any(String) } });
    expect(await santa.saveMember(master, edit(bo, { phone: "0701111111" }))).toMatchObject({ ok: false, fields: { phone: expect.any(String) } });
    expect(await santa.saveMember(master, edit(bo, { phone: "0702222222" }))).toEqual({ ok: true });
    expect(await count("ss_person")).toBe(2);
  });

  test("MUPP-038-R3 editing the details of a member in two families changes both: one person, not two copies", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const anna = await person(a, "Anna");
    const personId = (await get<{ person_id: number }>("SELECT person_id FROM ss_member WHERE id = ?", [anna]))!.person_id;
    await santa.joinFamily(master, { familyId: String(b), personId: String(personId) });
    expect(await santa.saveMember(master, edit(anna, { name: "Anna Ny", phone: "0708888888", email: "ny@exempel.se" }))).toEqual({ ok: true });
    for (const id of [a, b]) expect(await members(id)).toMatchObject([{ name: "Anna Ny", phone: "0708888888", email: "ny@exempel.se" }]);
    expect(await count("ss_person")).toBe(1);
  });

  test("MUPP-038-R3 removing a member from one family keeps them in the others; from the last family deletes them", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const annaA = await person(a, "Anna");
    const personId = (await get<{ person_id: number }>("SELECT person_id FROM ss_member WHERE id = ?", [annaA]))!.person_id;
    await santa.joinFamily(master, { familyId: String(b), personId: String(personId) });

    expect(await santa.removeMember(master, String(annaA))).toEqual({ ok: true });
    expect(await members(a)).toEqual([]);
    expect(await members(b)).toMatchObject([{ name: "Anna" }]);
    expect(await count("ss_person")).toBe(1);

    expect(await santa.removeMember(master, String((await members(b))[0].id))).toEqual({ ok: true });
    expect(await count("ss_person")).toBe(0);
    expect(await count("ss_member")).toBe(0);
    expect(await santa.removeMember(master, String(annaA))).toMatchObject({ ok: false });
  });
});

describe("MUPP-038-R4 one person in several families", () => {
  test("MUPP-038-R4 a known person is added to another family once, and offered only for families they are not in", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const anna = await person(a, "Anna");
    const personId = (await get<{ person_id: number }>("SELECT person_id FROM ss_member WHERE id = ?", [anna]))!.person_id;

    const known = (await santa.listFamilies(master)).people;
    expect(known).toEqual([{ id: personId, name: "Anna", familyIds: [a] }]);
    expect(await santa.joinFamily(master, { familyId: String(a), personId: String(personId) })).toMatchObject({ ok: false });
    expect(await santa.joinFamily(master, { familyId: String(b), personId: String(personId) })).toEqual({ ok: true });
    expect((await santa.listFamilies(master)).people[0].familyIds.sort()).toEqual([a, b].sort());
    expect(await count("ss_person")).toBe(1);
    expect(await count("ss_member")).toBe(2);
    expect(await santa.joinFamily(master, { familyId: String(b), personId: "99999" })).toMatchObject({ ok: false });
    expect(await santa.joinFamily(master, { familyId: "99999", personId: String(personId) })).toMatchObject({ ok: false });
  });
});

describe("MUPP-038-R5 partner", () => {
  const partnersOf = async (familyId: number) => Object.fromEntries((await members(familyId)).map((m) => [m.name, m.partnerId]));

  test("MUPP-038-R5 the partner link goes both ways, and changing or clearing it updates both", async () => {
    const f = await family("Familj A");
    const [anna, bo, cia, dan] = [await person(f, "Anna"), await person(f, "Bo"), await person(f, "Cia"), await person(f, "Dan")];

    expect(await santa.saveMember(master, edit(anna, { name: "Anna", partnerId: String(bo) }))).toEqual({ ok: true });
    expect(await partnersOf(f)).toEqual({ Anna: bo, Bo: anna, Cia: null, Dan: null });

    // Anna får en ny partner: Bo blir ensam
    await santa.saveMember(master, edit(anna, { name: "Anna", partnerId: String(cia) }));
    expect(await partnersOf(f)).toEqual({ Anna: cia, Bo: null, Cia: anna, Dan: null });

    // Dan väljer Cia: Annas par släpps, så att ingen har en partner som har en annan
    await santa.saveMember(master, edit(dan, { name: "Dan", partnerId: String(cia) }));
    expect(await partnersOf(f)).toEqual({ Anna: null, Bo: null, Cia: dan, Dan: cia });

    await santa.saveMember(master, edit(dan, { name: "Dan", partnerId: "" }));
    expect(await partnersOf(f)).toEqual({ Anna: null, Bo: null, Cia: null, Dan: null });
  });

  test("MUPP-038-R5 the partner is another member of the same family, never the member themself", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const anna = await person(a, "Anna");
    const bo = await person(a, "Bo");
    const other = await person(b, "Cia");
    const refused = { ok: false, fields: { partnerId: "Välj en av de andra i familjen." } };
    expect(await santa.saveMember(master, edit(anna, { partnerId: String(anna) }))).toEqual(refused);
    expect(await santa.saveMember(master, edit(anna, { partnerId: String(other) }))).toEqual(refused);
    expect(await santa.saveMember(master, edit(anna, { partnerId: "99999" }))).toEqual(refused);
    expect(await santa.saveMember(master, edit(anna, { partnerId: "abc" }))).toEqual(refused);
    expect(await partnersOf(a)).toEqual({ Anna: null, Bo: null });
    expect(bo).toBeGreaterThan(0);
  });

  test("MUPP-038-R5 the same person can have different partners in different families", async () => {
    const a = await family("Familj A");
    const b = await family("Familj B");
    const annaA = await person(a, "Anna", "0701111111");
    const bo = await person(a, "Bo");
    const personId = (await get<{ person_id: number }>("SELECT person_id FROM ss_member WHERE id = ?", [annaA]))!.person_id;
    await santa.joinFamily(master, { familyId: String(b), personId: String(personId) });
    const cia = await person(b, "Cia");
    const annaB = (await members(b)).find((m) => m.name === "Anna")!.id;

    await santa.saveMember(master, edit(annaA, { name: "Anna", phone: "0701111111", partnerId: String(bo) }));
    await santa.saveMember(master, edit(annaB, { name: "Anna", phone: "0701111111", partnerId: String(cia) }));
    expect(await partnersOf(a)).toEqual({ Anna: bo, Bo: annaA });
    expect(await partnersOf(b)).toEqual({ Anna: cia, Cia: annaB });
  });

  test("MUPP-038-R5 removing a member frees their partner", async () => {
    const f = await family("Familj A");
    const anna = await person(f, "Anna");
    const bo = await person(f, "Bo");
    await santa.saveMember(master, edit(anna, { name: "Anna", partnerId: String(bo) }));
    await santa.removeMember(master, String(bo));
    expect(await partnersOf(f)).toEqual({ Anna: null });
  });

  test("MUPP-038-R5 deleting a family leaves no partner link behind", async () => {
    const f = await family("Familj A");
    const anna = await person(f, "Anna");
    const bo = await person(f, "Bo");
    await santa.saveMember(master, edit(anna, { name: "Anna", partnerId: String(bo) }));
    await santa.removeFamily(master, String(f));
    expect(await count("ss_member")).toBe(0);
  });
});
