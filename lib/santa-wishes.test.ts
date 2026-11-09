import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const wishes = await import("./santa-wishes");
const santa = await import("./santa");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};
let owner: Parent;
beforeEach(async () => {
  await clear();
  const { lastId } = await run("INSERT INTO parent (name, is_master_admin) VALUES ('Chef', 1)");
  owner = { id: lastId, name: "Chef", isMasterAdmin: true };
});
afterAll(clear);

// Påhittade medlemmar
let counter = 0;
const event = async (name: string) => (await run("INSERT INTO ss_event (owner_id, name) VALUES (?, ?)", [owner.id, name])).lastId;
async function join(eventId: number) {
  counter++;
  return (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, 'p@exempel.se')", [eventId, `Person ${counter}`, `070001${String(counter).padStart(4, "0")}`])).lastId;
}
const add = (memberId: number, title: unknown = "Bok", extra = {}) => wishes.saveWish(memberId, { title, size: "", description: "", url: "", ...extra });
const titles = async () => (await all<{ title: string }>("SELECT title FROM ss_wish ORDER BY id")).map((w) => w.title);
const listed = async (memberId: number) => (await wishes.listOwn(memberId)).map((w) => w.title);

describe("MUPP-040-R1 add a wish", () => {
  test("MUPP-040-R1 a wish needs a title and keeps the optional parts, trimmed", async () => {
    const a = await join(await event("F"));
    expect(await add(a, "  Bok ", { description: "Spänning", size: "M", url: "https://exempel.se/bok" })).toEqual({ ok: true });
    expect(await wishes.listOwn(a)).toMatchObject([{ title: "Bok", description: "Spänning", size: "M", url: "https://exempel.se/bok" }]);
  });

  test("MUPP-040-R1 the limits are those of the kids' wishes: title 60, description 100, size 40, link http(s) up to 500", async () => {
    const a = await join(await event("F"));
    expect(await add(a, "a".repeat(60), { description: "b".repeat(100), size: "c".repeat(40), url: `https://e.se/${"d".repeat(486)}` })).toEqual({ ok: true });
    for (const [bad, field] of [
      [{ title: "" }, "title"],
      [{ title: "   " }, "title"],
      [{ title: "a".repeat(61) }, "title"],
      [{ description: "b".repeat(101) }, "description"],
      [{ size: "c".repeat(41) }, "size"],
      [{ url: "javascript:alert(1)" }, "url"],
      [{ url: "ftp://exempel.se" }, "url"],
      [{ url: "exempel.se" }, "url"],
    ] as const) {
      expect(await add(a, "Titel", bad), JSON.stringify(bad)).toMatchObject({ ok: false, fields: { [field]: expect.any(String) } });
    }
    expect(await titles()).toEqual(["a".repeat(60)]);
  });
});

describe("MUPP-040-R2 edit and delete", () => {
  test("MUPP-040-R2 a wish is changed and deleted by its owner", async () => {
    const a = await join(await event("F"));
    await add(a, "Bok");
    const id = (await get<{ id: number }>("SELECT id FROM ss_wish"))!.id;
    expect(await wishes.saveWish(a, { wishId: String(id), title: "Ny bok", size: "L", description: "", url: "" })).toEqual({ ok: true });
    expect(await wishes.listOwn(a)).toMatchObject([{ title: "Ny bok", size: "L" }]);
    expect(await wishes.saveWish(a, { wishId: String(id), title: "", size: "", description: "", url: "" })).toMatchObject({ ok: false, fields: { title: expect.any(String) } });
    expect(await wishes.removeWish(a, String(id))).toEqual({ ok: true });
    expect(await titles()).toEqual([]);
    expect(await wishes.removeWish(a, String(id))).toMatchObject({ ok: false });
  });
});

describe("MUPP-040-R3 MUPP-048-R5 own list only, one list per member", () => {
  test("MUPP-040-R3 another member's wish cannot be changed or deleted", async () => {
    const f = await event("F");
    const [a, b] = [await join(f), await join(f)];
    await add(b, "Bs önskning");
    const id = (await get<{ id: number }>("SELECT id FROM ss_wish"))!.id;
    const refused = { ok: false, error: "Du kan inte göra det här." };
    expect(await wishes.saveWish(a, { wishId: String(id), title: "Kapad", size: "", description: "", url: "" })).toEqual(refused);
    expect(await wishes.removeWish(a, String(id))).toEqual(refused);
    expect(await wishes.removeWish(a, "abc")).toEqual(refused);
    expect(await titles()).toEqual(["Bs önskning"]);
  });

  test("MUPP-048-R5 the same person in two events is two members with a list each, and a change in one does not touch the other", async () => {
    const [a, b] = [await join(await event("F1")), await join(await event("F2"))];
    await add(a, "Hos F1");
    await add(b, "Hos F2");
    expect(await listed(a)).toEqual(["Hos F1"]);
    expect(await listed(b)).toEqual(["Hos F2"]);
    const inF1 = (await get<{ id: number }>("SELECT id FROM ss_wish WHERE member_id = ?", [a]))!.id;
    expect(await wishes.removeWish(b, String(inF1))).toMatchObject({ ok: false });
    await wishes.removeWish(a, String(inF1));
    expect(await titles()).toEqual(["Hos F2"]);
  });

  test("MUPP-040-R3 a wish list goes with the member and the event, and is not read for anyone else", async () => {
    const f = await event("F");
    const [a, b] = [await join(f), await join(f)];
    await add(a, "A1");
    await add(b, "B1");
    expect(await listed(b)).toEqual(["B1"]);
    expect(await santa.removeMember(owner, String(a))).toEqual({ ok: true });
    expect(await titles()).toEqual(["B1"]);
    expect(await santa.removeEvent(owner, String(f))).toEqual({ ok: true });
    expect(await titles()).toEqual([]);
  });
});
