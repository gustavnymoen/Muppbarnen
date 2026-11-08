import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const wishes = await import("./santa-wishes");
const santa = await import("./santa");

const clear = async () => {
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_person");
  await run("DELETE FROM ss_family");
};
beforeEach(clear);
afterAll(clear);

// Påhittade personer
let counter = 0;
const family = async (name: string) => (await run("INSERT INTO ss_family (name) VALUES (?)", [name])).lastId;
async function join(familyId: number, personId?: number) {
  const id = personId ?? (await run("INSERT INTO ss_person (name, phone, email) VALUES (?, ?, ?)", [`Person ${++counter}`, `070001${String(counter).padStart(4, "0")}`, "p@exempel.se"])).lastId;
  const member = (await run("INSERT INTO ss_member (family_id, person_id) VALUES (?, ?)", [familyId, id])).lastId;
  return { personId: Number(id), memberId: Number(member), familyId };
}
const add = (personId: number, familyId: number, title: unknown = "Bok", extra = {}) =>
  wishes.saveWish(personId, { familyId: String(familyId), title, size: "", description: "", url: "", ...extra });
const titles = async () => (await all<{ title: string }>("SELECT title FROM ss_wish ORDER BY id")).map((w) => w.title);

describe("MUPP-040-R1 add a wish", () => {
  test("MUPP-040-R1 a wish needs a title and keeps the optional parts, trimmed", async () => {
    const a = await join(await family("F"));
    expect(await add(a.personId, a.familyId, "  Bok ", { description: "Spänning", size: "M", url: "https://exempel.se/bok" })).toEqual({ ok: true });
    expect((await wishes.listOwn(a.personId))[0].wishes).toMatchObject([{ title: "Bok", description: "Spänning", size: "M", url: "https://exempel.se/bok" }]);
  });

  test("MUPP-040-R1 the limits are those of the kids' wishes: title 60, description 100, size 40, link http(s) up to 500", async () => {
    const a = await join(await family("F"));
    expect(await add(a.personId, a.familyId, "a".repeat(60), { description: "b".repeat(100), size: "c".repeat(40), url: `https://e.se/${"d".repeat(486)}` })).toEqual({ ok: true });
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
      expect(await add(a.personId, a.familyId, "Titel", bad), JSON.stringify(bad)).toMatchObject({ ok: false, fields: { [field]: expect.any(String) } });
    }
    expect(await titles()).toEqual(["a".repeat(60)]);
  });
});

describe("MUPP-040-R2 edit and delete", () => {
  test("MUPP-040-R2 a wish is changed and deleted by its owner", async () => {
    const a = await join(await family("F"));
    await add(a.personId, a.familyId, "Bok");
    const id = (await get<{ id: number }>("SELECT id FROM ss_wish"))!.id;
    expect(await wishes.saveWish(a.personId, { familyId: String(a.familyId), wishId: String(id), title: "Ny bok", size: "L", description: "", url: "" })).toEqual({ ok: true });
    expect((await wishes.listOwn(a.personId))[0].wishes).toMatchObject([{ title: "Ny bok", size: "L" }]);
    expect(await wishes.saveWish(a.personId, { familyId: String(a.familyId), wishId: String(id), title: "", size: "", description: "", url: "" })).toMatchObject({ ok: false, fields: { title: expect.any(String) } });
    expect(await wishes.removeWish(a.personId, String(id))).toEqual({ ok: true });
    expect(await titles()).toEqual([]);
    expect(await wishes.removeWish(a.personId, String(id))).toMatchObject({ ok: false });
  });
});

describe("MUPP-040-R3 own list only, one list per family", () => {
  test("MUPP-040-R3 another member's wish cannot be changed or deleted, nor a wish added to their list", async () => {
    const f = await family("F");
    const a = await join(f);
    const b = await join(f);
    await add(b.personId, f, "Bs önskning");
    const id = (await get<{ id: number }>("SELECT id FROM ss_wish"))!.id;
    const refused = { ok: false, error: "Du kan inte göra det här." };
    expect(await wishes.saveWish(a.personId, { familyId: String(f), wishId: String(id), title: "Kapad", size: "", description: "", url: "" })).toEqual(refused);
    expect(await wishes.removeWish(a.personId, String(id))).toEqual(refused);
    expect(await wishes.removeWish(a.personId, "abc")).toEqual(refused);
    expect(await add(a.personId, 99999)).toEqual(refused);
    expect(await titles()).toEqual(["Bs önskning"]);
  });

  test("MUPP-040-R3 a person in two families has a list in each, and a change in one does not touch the other", async () => {
    const [f1, f2] = [await family("F1"), await family("F2")];
    const a = await join(f1);
    await join(f2, a.personId);
    await add(a.personId, f1, "Hos F1");
    await add(a.personId, f2, "Hos F2");
    const lists = await wishes.listOwn(a.personId);
    expect(lists.map((l) => [l.familyName, l.wishes.map((w) => w.title)])).toEqual([["F1", ["Hos F1"]], ["F2", ["Hos F2"]]]);
    const inF1 = (await get<{ id: number }>("SELECT id FROM ss_wish WHERE member_id = ?", [a.memberId]))!.id;
    await wishes.removeWish(a.personId, String(inF1));
    expect(await titles()).toEqual(["Hos F2"]);
  });

  test("MUPP-040-R3 a wish list goes with the member and the family, and is not read for anyone else", async () => {
    const f = await family("F");
    const g = await family("G");
    const a = await join(f);
    const b = await join(f);
    const inG = await join(g, a.personId);
    await add(a.personId, f, "A1");
    await add(a.personId, g, "A2");
    await add(b.personId, f, "B1");
    expect((await wishes.listOwn(b.personId))[0].wishes.map((w) => w.title)).toEqual(["B1"]);
    const master = { id: 1, name: "Chef", isMasterAdmin: true };
    expect(await santa.removeMember(master, String(inG.memberId))).toEqual({ ok: true });
    expect(await titles()).toEqual(["A1", "B1"]);
    expect(await santa.removeFamily(master, String(f))).toEqual({ ok: true });
    expect(await titles()).toEqual([]);
  });
});
