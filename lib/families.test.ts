import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const families = await import("./families");
const family = await import("./family");
const santa = await import("./santa");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
  await run("DELETE FROM family");
};

let master: Parent;
let emma: Parent;
let x: number;
let y: number;
async function newFamily(name: string) {
  expect(await families.saveFamily(master, { name, description: "" })).toEqual({ ok: true });
  return (await get<{ id: number }>("SELECT id FROM family WHERE name = ?", [name]))!.id;
}
beforeEach(async () => {
  await clear();
  await run("INSERT INTO family (name) VALUES ('Standard')");
  master = { id: (await run("INSERT INTO parent (name, is_master_admin) VALUES ('Chef', 1)")).lastId, name: "Chef", isMasterAdmin: true };
  emma = { id: (await run("INSERT INTO parent (name) VALUES ('Emma')")).lastId, name: "Emma", isMasterAdmin: false };
  [x, y] = [await newFamily("Familjen X"), await newFamily("Familjen Y")];
});
afterAll(clear);

const familyIdsOf = async (parentId: number) => (await all<{ family_id: number }>("SELECT family_id FROM parent_family WHERE parent_id = ? ORDER BY family_id", [parentId])).map((r) => r.family_id);
const ids = (...n: number[]) => n.map(String);

describe("MUPP-073-R1 manage families", () => {
  test("MUPP-073-R1 a family gets a name and a description of at most 30 characters", async () => {
    expect(await families.saveFamily(master, { name: "Mormor", description: "x".repeat(30) })).toEqual({ ok: true });
    expect(await families.saveFamily(master, { name: "Morfar", description: "x".repeat(31) })).toMatchObject({ ok: false, fields: { description: expect.any(String) } });
    expect(await families.saveFamily(master, { name: " ", description: "" })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
  });

  test("MUPP-073-R1 the name is unique ignoring case and surrounding spaces, also when renaming", async () => {
    expect(await families.saveFamily(master, { name: " familjen x ", description: "" })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await families.saveFamily(master, { id: String(y), name: "FAMILJEN X", description: "" })).toMatchObject({ ok: false });
    expect(await families.saveFamily(master, { id: String(x), name: "Familjen X", description: "ny" })).toEqual({ ok: true });
    expect(await families.saveFamily(master, { id: "999999", name: "Finns inte", description: "" })).toMatchObject({ ok: false });
  });

  test("MUPP-073-R1 a family with parents or groups is not deleted, an empty one is", async () => {
    expect(await family.saveParent(master, { name: "Pelle", isMasterAdmin: false, familyIds: ids(x) })).toEqual({ ok: true });
    expect(await families.removeFamily(master, String(x))).toMatchObject({ ok: false, error: expect.stringContaining("föräldrar") });
    await run("DELETE FROM parent_family WHERE family_id = ?", [y]);
    await run("INSERT INTO ss_event (owner_id, name, family_id) VALUES (?, 'Jul', ?)", [emma.id, y]);
    expect(await families.removeFamily(master, String(y))).toMatchObject({ ok: false, error: expect.stringContaining("Secret Santa") });
    await run("DELETE FROM ss_event");
    expect(await families.removeFamily(master, String(y))).toEqual({ ok: true });
  });

  test("MUPP-073-R4 only the master admin changes families", async () => {
    const refused = { ok: false, error: "Du kan inte göra det här." };
    expect(await families.saveFamily(emma, { name: "Ny", description: "" })).toEqual(refused);
    expect(await families.saveFamily(null, { name: "Ny", description: "" })).toEqual(refused);
    expect(await families.removeFamily(emma, String(x))).toEqual(refused);
    expect(await family.saveParent(emma, { name: "Ny", isMasterAdmin: false, familyIds: ids(x) })).toEqual(refused);
  });
});

describe("MUPP-073-R2 parents belong to families", () => {
  test("MUPP-073-R2 a parent can be in several families, but needs at least one that exists", async () => {
    expect(await family.saveParent(master, { name: "Pelle", isMasterAdmin: false, familyIds: ids(x, y) })).toEqual({ ok: true });
    const pelle = (await get<{ id: number }>("SELECT id FROM parent WHERE name = 'Pelle'"))!.id;
    expect(await familyIdsOf(pelle)).toEqual([x, y]);
    expect(await family.saveParent(master, { id: String(pelle), name: "Pelle", isMasterAdmin: false, familyIds: [] })).toMatchObject({ ok: false, fields: { families: expect.any(String) } });
    expect(await family.saveParent(master, { name: "Ny", isMasterAdmin: false, familyIds: [] })).toMatchObject({ ok: false, fields: { families: expect.any(String) } });
    expect(await family.saveParent(master, { id: String(pelle), name: "Pelle", isMasterAdmin: false, familyIds: ["999999"] })).toMatchObject({ ok: false });
    expect(await family.saveParent(master, { id: String(pelle), name: "Pelle", isMasterAdmin: false, familyIds: ["x"] })).toMatchObject({ ok: false });
    expect(await familyIdsOf(pelle)).toEqual([x, y]);
    expect(await family.saveParent(master, { id: String(pelle), name: "Pelle", isMasterAdmin: false, familyIds: ids(y) })).toEqual({ ok: true });
    expect(await familyIdsOf(pelle)).toEqual([y]);
  });

  test("MUPP-073-R2 a new parent added without a family choice (a script, a test) gets the first family", async () => {
    const standard = (await get<{ id: number }>("SELECT id FROM family WHERE name = 'Standard'"))!.id;
    expect(await familyIdsOf(emma.id)).toEqual([standard]);
  });
});

describe("MUPP-073-R3 a Secret Santa group belongs to one family", () => {
  const familyOf = async (name: string) => (await get<{ family_id: number }>("SELECT family_id FROM ss_event WHERE name = ?", [name]))!.family_id;
  const inFamilies = (parent: Parent, ...family: number[]) => run("DELETE FROM parent_family WHERE parent_id = ?", [parent.id]).then(() => Promise.all(family.map((f) => run("INSERT INTO parent_family VALUES (?, ?)", [parent.id, f]))));

  test("MUPP-073-R3 an admin in several families must choose one of them", async () => {
    await inFamilies(emma, x, y);
    expect(await santa.saveEvent(emma, { name: "Jul" })).toMatchObject({ ok: false, fields: { familyId: expect.any(String) } });
    expect(await santa.saveEvent(emma, { name: "Jul", familyId: "999999" })).toMatchObject({ ok: false, fields: { familyId: expect.any(String) } });
    const standard = (await get<{ id: number }>("SELECT id FROM family WHERE name = 'Standard'"))!.id;
    expect(await santa.saveEvent(emma, { name: "Jul", familyId: String(standard) })).toMatchObject({ ok: false });
    expect(await santa.saveEvent(emma, { name: "Jul", familyId: String(y) })).toEqual({ ok: true });
    expect(await familyOf("Jul")).toBe(y);
    expect((await santa.listEvents(emma))[0]).toMatchObject({ familyId: y, familyName: "Familjen Y" });
  });

  test("MUPP-073-R3 an admin in one family gets it without choosing", async () => {
    await inFamilies(emma, x);
    expect(await santa.saveEvent(emma, { name: "Jul" })).toEqual({ ok: true });
    expect(await familyOf("Jul")).toBe(x);
  });

  test("MUPP-073-R3 the master admin can set any family, and a change without a choice keeps the family", async () => {
    expect(await santa.saveEvent(master, { name: "Jul", familyId: String(y) })).toEqual({ ok: true });
    const id = (await get<{ id: number }>("SELECT id FROM ss_event WHERE name = 'Jul'"))!.id;
    expect(await santa.saveEvent(master, { id: String(id), name: "Julafton" })).toEqual({ ok: true });
    expect(await familyOf("Julafton")).toBe(y);
    expect(await santa.saveEvent(master, { id: String(id), name: "Julafton", familyId: String(x) })).toEqual({ ok: true });
    expect(await familyOf("Julafton")).toBe(x);
  });

  test("MUPP-073-R3 an admin without any family cannot create a group, and a group made without a family gets the first", async () => {
    await run("DELETE FROM parent_family WHERE parent_id = ?", [emma.id]);
    expect(await santa.saveEvent(emma, { name: "Jul" })).toMatchObject({ ok: false, error: expect.stringContaining("familj") });
    await run("INSERT INTO ss_event (owner_id, name) VALUES (?, 'Direkt')", [emma.id]);
    expect(await familyOf("Direkt")).not.toBeNull();
  });
});

describe("MUPP-073-R5 the migration puts everything in one default family", () => {
  test("MUPP-073-R5 existing parents and groups all get the default family, and nothing is left without one", async () => {
    const dir = path.join(import.meta.dirname, "..", "db");
    const db = createClient({ url: ":memory:" });
    await db.execute("PRAGMA foreign_keys = ON");
    await db.executeMultiple(readFileSync(path.join(dir, "schema.sql"), "utf8"));
    const files = readdirSync(path.join(dir, "migrations")).filter((f) => f.endsWith(".sql")).sort();
    const before = files.filter((f) => f < "016");
    for (const file of before) await db.executeMultiple(readFileSync(path.join(dir, "migrations", file), "utf8"));
    await db.execute("INSERT INTO parent (id, name) VALUES (1, 'A'), (2, 'B')");
    await db.execute("INSERT INTO ss_event (owner_id, name) VALUES (1, 'Jul'), (2, 'Påsk')");
    await db.executeMultiple(readFileSync(path.join(dir, "migrations", "016_families.sql"), "utf8"));
    expect((await db.execute("SELECT name FROM family")).rows.map((r) => r.name)).toEqual(["Familj"]);
    expect((await db.execute("SELECT parent_id FROM parent_family ORDER BY parent_id")).rows.map((r) => r.parent_id)).toEqual([1, 2]);
    expect((await db.execute("SELECT COUNT(*) AS n FROM ss_event WHERE family_id IS NULL")).rows[0].n).toBe(0);
    db.close();
  });
});
