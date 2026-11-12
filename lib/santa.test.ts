import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";
import { swedishToday } from "./deck";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const santa = await import("./santa");
const family = await import("./family");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM ss_draw");
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
  expect(outcome).toMatchObject({ ok: true });
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
    expect(await santa.saveMember(master, edit(m, { name: "Anna" }))).toMatchObject({ ok: true });
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
    expect(await santa.addMember(emma, input)).toMatchObject({ ok: true });
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
    expect(await santa.saveMember(emma, edit(bo, { phone: "0702222222", email: "bo@exempel.se" }))).toMatchObject({ ok: true });
    expect(await count("ss_member")).toBe(2);
  });

  test("MUPP-048-R5 the same phone and email can be in two events, as two separate members", async () => {
    const a = await event(emma, "Grupp A");
    const b = await event(erik, "Grupp B");
    const annaA = await person(emma, a, "Anna", "0701111111", "anna@exempel.se");
    const annaB = await person(erik, b, "Anna", "0701111111", "anna@exempel.se");
    expect(annaA).not.toBe(annaB);
    expect(await santa.saveMember(emma, edit(annaA, { name: "Anna Ny", phone: "0708888888", email: "ny@exempel.se" }))).toEqual({ ok: true, newEmail: "ny@exempel.se" });
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

    expect(await santa.saveMember(emma, edit(anna, { name: "Anna", partnerId: String(bo) }))).toMatchObject({ ok: true });
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

// ---- MUPP-051 status

const statusOf = async (eventId: number) => (await get<{ status: string }>("SELECT status FROM ss_event WHERE id = ?", [eventId]))!.status;
const setStatus = (eventId: number, status: string) => run("UPDATE ss_event SET status = ? WHERE id = ?", [status, eventId]);

describe("MUPP-051-R1 three statuses, inactive first", () => {
  test("MUPP-051-R1 a new event is inactive and listed with its status", async () => {
    const id = await event(emma, "Emmas jul");
    expect(await statusOf(id)).toBe("inactive");
    expect(await santa.listEvents(emma)).toMatchObject([{ id, status: "inactive" }]);
  });

  test("MUPP-051-R1 the database refuses any other status", async () => {
    const id = await event(emma, "Emmas jul");
    await expect(setStatus(id, "paused")).rejects.toThrow(/constraint/i);
  });
});

describe("MUPP-051-R2 activate and deactivate", () => {
  test("MUPP-051-R2 inactive → preparing → inactive, and the answer lists every member with an address, for the mail", async () => {
    const id = await event(emma, "Emmas jul");
    await person(emma, id, "Anna");
    await person(emma, id, "Bo");
    expect(await santa.activateEvent(emma, String(id))).toEqual({
      ok: true,
      eventName: "Emmas jul",
      adminName: "Emma",
      recipients: [
        { name: "Anna", email: "anna@exempel.se" },
        { name: "Bo", email: "bo@exempel.se" },
      ],
    });
    expect(await statusOf(id)).toBe("preparing");
    expect(await santa.deactivateEvent(emma, String(id))).toMatchObject({ ok: true, recipients: [{ name: "Anna" }, { name: "Bo" }] });
    expect(await statusOf(id)).toBe("inactive");
  });

  test("MUPP-051-R2 each change is allowed from one status only: a second activation or deactivation is refused and changes nothing", async () => {
    const id = await event(emma, "Emmas jul");
    const stale = { ok: false, error: "Gruppens status har redan ändrats. Ladda om sidan." };
    expect(await santa.deactivateEvent(emma, String(id))).toEqual(stale);
    await santa.activateEvent(emma, String(id));
    expect(await santa.activateEvent(emma, String(id))).toEqual(stale);
    expect(await statusOf(id)).toBe("preparing");
  });

  test("MUPP-051-R2 a started event cannot be deactivated or activated: it must be stopped first", async () => {
    const id = await event(emma, "Emmas jul");
    await setStatus(id, "started");
    const outcome = { ok: false, error: "Gruppen är startad. Dragningen måste stoppas först." };
    expect(await santa.deactivateEvent(emma, String(id))).toEqual(outcome);
    expect(await santa.activateEvent(emma, String(id))).toEqual(outcome);
    expect(await statusOf(id)).toBe("started");
  });

  test("MUPP-051-R2 only the owner and the master admin change the status; a missing or forged id is refused", async () => {
    const id = await event(emma, "Emmas jul");
    expect(await santa.activateEvent(erik, String(id))).toEqual(refused);
    expect(await santa.activateEvent(null, String(id))).toEqual(refused);
    expect(await statusOf(id)).toBe("inactive");
    expect(await santa.activateEvent(emma, "99999")).toMatchObject({ ok: false });
    expect(await santa.activateEvent(emma, "abc")).toMatchObject({ ok: false });
    expect(await santa.activateEvent(master, String(id))).toMatchObject({ ok: true });
    expect(await statusOf(id)).toBe("preparing");
  });
});

describe("MUPP-051-R3 members only while the event is inactive or preparing", () => {
  test("MUPP-051-R3 a member is added, changed and removed while inactive and while preparing", async () => {
    const id = await event(emma, "Emmas jul");
    for (const status of ["inactive", "preparing"]) {
      await setStatus(id, status);
      const member = await person(emma, id, `Anna${status}`);
      expect(await santa.saveMember(emma, edit(member, { name: "Nytt namn" }))).toMatchObject({ ok: true });
      expect(await santa.removeMember(emma, String(member))).toEqual({ ok: true });
    }
  });

  test("MUPP-051-R3 MUPP-060-R2 a started event refuses adding, a partner and removing, also for the master admin, and keeps its members as they were", async () => {
    const id = await event(emma, "Emmas jul");
    const anna = await person(emma, id, "Anna");
    const bo = await person(emma, id, "Bo");
    await setStatus(id, "started");
    const closed = { ok: false, error: "Gruppen är startad. Deltagare kan inte läggas till eller tas bort nu." };
    const partnerLocked = { ok: false, error: "Gruppen är startad. Partnern kan inte ändras nu." };
    for (const actor of [emma, master]) {
      expect(await santa.addMember(actor, { eventId: String(id), name: "Ny", phone: "0700099999", email: "ny@exempel.se" })).toEqual(closed);
      expect(await santa.saveMember(actor, edit(anna, { partnerId: String(bo) }))).toEqual(partnerLocked);
      expect(await santa.removeMember(actor, String(anna))).toEqual(closed);
    }
    expect((await members(id)).map((m) => [m.name, m.partnerId])).toEqual([["Anna", null], ["Bo", null]]);
  });

  test("MUPP-051-R3 the rights come before the status: someone else's started event says they may not", async () => {
    const id = await event(emma, "Emmas jul");
    const anna = await person(emma, id, "Anna");
    await setStatus(id, "started");
    expect(await santa.removeMember(erik, String(anna))).toEqual(refused);
  });

  test("MUPP-051-R3 an added member answers with what the welcome mail needs: the address, the event, the administrator and the status", async () => {
    const id = await event(emma, "Emmas jul");
    const input = (n: number) => ({ eventId: String(id), name: `Ny ${n}`, phone: `070009999${n}`, email: `ny${n}@exempel.se` });
    expect(await santa.addMember(master, input(1))).toEqual({ ok: true, name: "Ny 1", email: "ny1@exempel.se", eventName: "Emmas jul", adminName: "Emma", status: "inactive" });
    await santa.activateEvent(emma, String(id));
    expect(await santa.addMember(emma, input(2))).toMatchObject({ ok: true, status: "preparing" });
  });

  test("MUPP-051-R3 an input error adds no member and no mail data", async () => {
    const id = await event(emma, "Emmas jul");
    expect(await santa.addMember(emma, { eventId: String(id), name: "", phone: "1", email: "x" })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await count("ss_member")).toBe(0);
  });
});

// Påhittade rader i dragningen: en tidigare dragning (år, givare → mottagare)
const addDraw = (eventId: number, year: number, giver: number, receiver: number) =>
  run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?)", [eventId, year, giver, receiver]);
const drawRows = (eventId: number) => all<{ year: number; giver_id: number; receiver_id: number }>("SELECT year, giver_id, receiver_id FROM ss_draw WHERE event_id = ? ORDER BY giver_id", [eventId]);
const thisYear = swedishToday().year;

async function preparing(owner: Parent, names: string[], eventName = "Emmas jul") {
  const id = await event(owner, eventName);
  const ids = [];
  for (const name of names) ids.push(await person(owner, id, name));
  await santa.activateEvent(owner, String(id));
  return { id, ids };
}

describe("MUPP-041-R2 R3 R4 start the draw", () => {
  test("MUPP-041-R2 R4 a preparing event is drawn once: one row per giver for this year, the event is started, and the answer has the mail data but no pair", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    const outcome = await santa.startDraw(emma, String(id));
    expect(outcome).toEqual({ ok: true, eventName: "Emmas jul", adminName: "Emma", setAside: [], recipients: [{ name: "Anna", email: "anna@exempel.se" }, { name: "Bo", email: "bo@exempel.se" }, { name: "Cia", email: "cia@exempel.se" }] });
    expect(await statusOf(id)).toBe("started");
    const rows = await drawRows(id);
    expect(rows.map((r) => r.giver_id)).toEqual(ids);
    expect(rows.every((r) => r.year === thisYear && r.giver_id !== r.receiver_id)).toBe(true);
    expect(rows.map((r) => r.receiver_id).sort()).toEqual(ids);
  });

  test("MUPP-041-R2 only a preparing event is started: inactive and started are refused and nothing is saved, and only the owner or the master admin may", async () => {
    const id = await event(emma, "Emmas jul");
    await person(emma, id, "Anna");
    await person(emma, id, "Bo");
    expect(await santa.startDraw(emma, String(id))).toEqual({ ok: false, error: "Gruppens status har redan ändrats. Ladda om sidan." });
    await santa.activateEvent(emma, String(id));
    expect(await santa.startDraw(erik, String(id))).toEqual(refused);
    expect(await santa.startDraw(null, String(id))).toEqual(refused);
    expect(await santa.startDraw(emma, "abc")).toMatchObject({ ok: false });
    expect(await drawRows(id)).toEqual([]);
    expect(await santa.startDraw(master, String(id))).toMatchObject({ ok: true });
    expect(await santa.startDraw(emma, String(id))).toMatchObject({ ok: false });
    expect(await drawRows(id)).toHaveLength(2);
  });

  test("MUPP-041-R3 a draw with one participant saves and changes nothing and says why", async () => {
    const { id } = await preparing(emma, ["Anna"]);
    expect(await santa.startDraw(emma, String(id))).toEqual({ ok: false, error: "Dragningen går inte att göra: det behövs minst två deltagare." });
    expect(await statusOf(id)).toBe("preparing");
    expect(await drawRows(id)).toEqual([]);
  });

  test("MUPP-041-R3 partners are not drawn together, and when that is impossible the admin is told which rule was set aside, never who drew whom", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia", "Dan"]);
    await santa.saveMember(emma, edit(ids[0], { partnerId: String(ids[1]) }));
    for (let run = 0; run < 20; run++) {
      await santa.startDraw(emma, String(id));
      const rows = await drawRows(id);
      expect(rows.find((r) => r.giver_id === ids[0])!.receiver_id).not.toBe(ids[1]);
      expect(rows.find((r) => r.giver_id === ids[1])!.receiver_id).not.toBe(ids[0]);
      await santa.stopDraw(emma, String(id));
    }
    const pair = await preparing(erik, ["Eva", "Fia"], "Eriks jul");
    await santa.saveMember(erik, edit(pair.ids[0], { partnerId: String(pair.ids[1]) }));
    expect(await santa.startDraw(erik, String(pair.id))).toMatchObject({ ok: true, setAside: ["lastYear", "partner"] });
  });

  test("MUPP-041-R3 R4 next year's draw reads last year's rows: nobody gets the person they had", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    // Förra året gav Anna till Bo, Bo till Cia och Cia till Anna; i år går bara den andra cirkeln
    await addDraw(id, thisYear - 1, ids[0], ids[1]);
    await addDraw(id, thisYear - 1, ids[1], ids[2]);
    await addDraw(id, thisYear - 1, ids[2], ids[0]);
    expect(await santa.startDraw(emma, String(id))).toMatchObject({ ok: true, setAside: [] });
    expect((await drawRows(id)).filter((r) => r.year === thisYear).map((r) => [r.giver_id, r.receiver_id])).toEqual([[ids[0], ids[2]], [ids[1], ids[0]], [ids[2], ids[1]]]);
    // Förra årets rader finns kvar som historik
    expect((await drawRows(id)).filter((r) => r.year === thisYear - 1)).toHaveLength(3);
  });

  test("MUPP-067-R1 the year of a draw is the Swedish year: just after midnight on New Year's Day the rows get the new year and last year's rows still count as last year's", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    // 23:30 UTC den 31 december är redan 00:30 den 1 januari i Sverige
    const newYear = swedishToday(new Date(Date.UTC(thisYear, 11, 31, 23, 30)));
    expect(newYear.year).toBe(thisYear + 1);
    await addDraw(id, thisYear, ids[0], ids[1]);
    await addDraw(id, thisYear, ids[1], ids[2]);
    await addDraw(id, thisYear, ids[2], ids[0]);
    expect(await santa.startDraw(emma, String(id), newYear)).toMatchObject({ ok: true, setAside: [] });
    const rows = await drawRows(id);
    expect(rows.filter((r) => r.year === thisYear + 1).map((r) => [r.giver_id, r.receiver_id])).toEqual([[ids[0], ids[2]], [ids[1], ids[0]], [ids[2], ids[1]]]);
    expect(rows.filter((r) => r.year === thisYear)).toHaveLength(3);
  });
});

describe("MUPP-041-R5 the result is secret", () => {
  test("MUPP-041-R5 nothing that lists events or members, for any administrator, holds who drew whom", async () => {
    const { id } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    await santa.startDraw(emma, String(id));
    expect(await drawRows(id)).toHaveLength(3);
    for (const actor of [emma, master]) expect(JSON.stringify(await santa.listEvents(actor))).not.toMatch(/giver|receiver|draw/i);
  });
});

describe("MUPP-041-R7 stop the draw", () => {
  test("MUPP-041-R7 stopping deletes this year's rows, keeps the wishes and last year's rows, and returns the event to preparing with the mail data", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo"]);
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [ids[0]]);
    await addDraw(id, thisYear - 1, ids[0], ids[1]);
    await addDraw(id, thisYear - 1, ids[1], ids[0]);
    await santa.startDraw(emma, String(id));
    expect(await santa.stopDraw(emma, String(id))).toMatchObject({ ok: true, eventName: "Emmas jul", recipients: [{ name: "Anna" }, { name: "Bo" }] });
    expect(await statusOf(id)).toBe("preparing");
    expect((await drawRows(id)).map((r) => r.year)).toEqual([thisYear - 1, thisYear - 1]);
    expect(await count("ss_wish")).toBe(1);
    // Ett nytt försök är en ny dragning; det stoppade försökets rader räknas inte som förra året
    expect(await santa.startDraw(emma, String(id))).toMatchObject({ ok: true });
    expect(await santa.addMember(emma, { eventId: String(id), name: "Ny", phone: "0700099999", email: "ny@exempel.se" })).toMatchObject({ ok: false });
  });

  test("MUPP-041-R7 only a started event is stopped, and only by its owner or the master admin", async () => {
    const { id } = await preparing(emma, ["Anna", "Bo"]);
    expect(await santa.stopDraw(emma, String(id))).toMatchObject({ ok: false });
    await santa.startDraw(emma, String(id));
    expect(await santa.stopDraw(erik, String(id))).toEqual(refused);
    expect(await santa.stopDraw(null, String(id))).toEqual(refused);
    expect(await statusOf(id)).toBe("started");
    expect(await drawRows(id)).toHaveLength(2);
    expect(await santa.stopDraw(master, String(id))).toMatchObject({ ok: true });
  });

  test("MUPP-041-R4 removing a participant or the event removes their draw rows, so an id used again never inherits history", async () => {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    await addDraw(id, thisYear - 1, ids[0], ids[1]);
    await addDraw(id, thisYear - 1, ids[1], ids[2]);
    await addDraw(id, thisYear - 1, ids[2], ids[0]);
    await santa.removeMember(emma, String(ids[2]));
    expect((await drawRows(id)).map((r) => [r.giver_id, r.receiver_id])).toEqual([[ids[0], ids[1]]]);
    await santa.removeEvent(emma, String(id));
    expect(await count("ss_draw")).toBe(0);
  });
});

describe("MUPP-041-R1 who has written a wish", () => {
  test("MUPP-041-R1 a participant has wishes once at least one is written", async () => {
    const id = await event(emma, "Emmas jul");
    const anna = await person(emma, id, "Anna");
    expect((await members(id))[0].hasWishes).toBe(false);
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [anna]);
    expect((await members(id))[0].hasWishes).toBe(true);
  });
});

describe("MUPP-060 change a participant in a started group", () => {
  // En startad grupp med dragning, en önskelista och ett par: Anna och Bo är partner
  async function started() {
    const { id, ids } = await preparing(emma, ["Anna", "Bo", "Cia"]);
    await santa.saveMember(emma, edit(ids[0], { name: "Anna", phone: "0701111111", email: "anna@exempel.se", partnerId: String(ids[1]) }));
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [ids[0]]);
    await santa.startDraw(emma, String(id));
    return { id, ids };
  }
  // Som formuläret i en startad grupp: partnerId saknas helt (åtgärden gör det till null)
  const change = (memberId: number, extra = {}) => ({ memberId: String(memberId), name: "Anna", phone: "0701111111", email: "anna@exempel.se", partnerId: null, ...extra });

  test("MUPP-060-R1 name, phone and email change in an inactive, a preparing and a started group, and the partner stays as it was when started", async () => {
    const { id, ids } = await started();
    expect(await santa.saveMember(emma, change(ids[0], { name: "Anna Ny", phone: "0709999999", email: "ny@exempel.se" }))).toEqual({ ok: true, newEmail: "ny@exempel.se" });
    expect(await members(id)).toMatchObject([{ name: "Anna Ny", phone: "0709999999", email: "ny@exempel.se", partnerId: ids[1] }, { name: "Bo", partnerId: ids[0] }, { name: "Cia" }]);
    expect(await santa.saveMember(master, change(ids[2], { name: "Cia", phone: "0702222222", email: "cia@exempel.se" }))).toMatchObject({ ok: true });
  });

  test("MUPP-060-R1 a changed name or phone alone gives no new address; the same address in other letters is not a change", async () => {
    const { ids } = await started();
    expect(await santa.saveMember(emma, change(ids[0], { name: "Anna Ny", phone: "0709999999" }))).toMatchObject({ ok: true });
    expect(await santa.saveMember(emma, change(ids[0], { phone: "0709999999", email: "ANNA@exempel.se" }))).toMatchObject({ ok: true });
  });

  test("MUPP-060-R1 phone and email stay unique in a started group, and someone who may not manage it is refused", async () => {
    const { id, ids } = await started();
    const bo = (await members(id))[1];
    expect(await santa.saveMember(emma, change(ids[0], { phone: bo.phone }))).toMatchObject({ ok: false, fields: { phone: expect.any(String) } });
    expect(await santa.saveMember(emma, change(ids[0], { email: bo.email.toUpperCase() }))).toMatchObject({ ok: false, fields: { email: expect.any(String) } });
    expect(await santa.saveMember(erik, change(ids[0], { name: "Fel" }))).toEqual(refused);
    expect(await santa.saveMember(null, change(ids[0], { name: "Fel" }))).toEqual(refused);
  });

  test("MUPP-060-R2 a started group refuses any partner value, also an empty one, and nothing is changed; stopping the draw allows everything again", async () => {
    const { id, ids } = await started();
    const locked = { ok: false, error: "Gruppen är startad. Partnern kan inte ändras nu." };
    for (const partnerId of ["", String(ids[2]), "abc"]) expect(await santa.saveMember(emma, change(ids[0], { name: "Fel", partnerId }))).toEqual(locked);
    expect(await santa.addMember(emma, { eventId: String(id), name: "Ny", phone: "0700099999", email: "ny@exempel.se" })).toMatchObject({ ok: false });
    expect(await santa.removeMember(emma, String(ids[0]))).toMatchObject({ ok: false });
    expect(await members(id)).toMatchObject([{ name: "Anna", partnerId: ids[1] }, { name: "Bo", partnerId: ids[0] }, { name: "Cia", partnerId: null }]);
    await santa.stopDraw(emma, String(id));
    expect(await santa.saveMember(emma, change(ids[0], { partnerId: String(ids[2]) }))).toMatchObject({ ok: true });
    expect(await santa.removeMember(emma, String(ids[1]))).toEqual({ ok: true });
  });

  test("MUPP-060-R3 a change leaves the draw and the wishes as they were", async () => {
    const { id, ids } = await started();
    const before = await drawRows(id);
    await santa.saveMember(emma, change(ids[0], { name: "Anna Ny", phone: "0709999999", email: "ny@exempel.se" }));
    expect(await drawRows(id)).toEqual(before);
    expect(await count("ss_wish")).toBe(1);
  });

  test("MUPP-060-R4 the mail data is read from the saved address, per status, and only for someone who may manage the group", async () => {
    const { id, ids } = await started();
    await santa.saveMember(emma, change(ids[0], { email: "ny@exempel.se" }));
    expect(await santa.memberToMail(emma, String(ids[0]))).toEqual({ ok: true, name: "Anna", email: "ny@exempel.se", eventName: "Emmas jul", adminName: "Emma", status: "started" });
    expect(await santa.memberToMail(master, String(ids[0]))).toMatchObject({ ok: true });
    expect(await santa.memberToMail(erik, String(ids[0]))).toEqual(refused);
    expect(await santa.memberToMail(null, String(ids[0]))).toEqual(refused);
    expect(await santa.memberToMail(emma, "99999")).toMatchObject({ ok: false });
    await setStatus(id, "preparing");
    expect(await santa.memberToMail(emma, String(ids[0]))).toMatchObject({ ok: true, status: "preparing" });
  });
});
