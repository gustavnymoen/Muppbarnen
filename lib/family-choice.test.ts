import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { parseChoice, resolveChoice, serializeChoice } from "./family-choice";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run } = await import("./db");
const family = await import("./family");
const { entranceEvents } = await import("./santa-auth");

describe("MUPP-080-R6 the cookie", () => {
  test("MUPP-080-R6 'all', ids and nothing else are read; anything odd is no choice", () => {
    expect(parseChoice("all")).toBe("all");
    expect(parseChoice("3")).toEqual([3]);
    expect(parseChoice("1,3,3")).toEqual([1, 3]);
    for (const odd of [undefined, "", "0", "1,", ",1", "a", "1;2", "1,x", "-1", "ALL", "all,1", "9".repeat(16)]) expect(parseChoice(odd), String(odd)).toBeNull();
  });

  test("MUPP-080-R6 what is written is what is read", () => {
    expect(parseChoice(serializeChoice("all"))).toBe("all");
    expect(parseChoice(serializeChoice([2, 5]))).toEqual([2, 5]);
  });
});

describe("MUPP-080-R2 R6 what a choice means with the families that exist", () => {
  test("MUPP-080-R2 with fewer than two families nothing is asked and nothing is filtered", () => {
    expect(resolveChoice(null, [1])).toEqual({ kind: "single" });
    expect(resolveChoice([7], [])).toEqual({ kind: "single" });
    expect(resolveChoice("all", [1])).toEqual({ kind: "single" });
  });

  test("MUPP-080-R2 with two or more and no choice, the visitor is asked", () => {
    expect(resolveChoice(null, [1, 2])).toEqual({ kind: "choose" });
  });

  test("MUPP-080-R1 Alla is no filter, a list is the chosen ids", () => {
    expect(resolveChoice("all", [1, 2])).toEqual({ kind: "chosen", ids: null, choice: "all" });
    expect(resolveChoice([2], [1, 2])).toEqual({ kind: "chosen", ids: [2], choice: [2] });
  });

  test("MUPP-080-R6 a family that no longer exists is ignored, and with none left the visitor is asked again", () => {
    expect(resolveChoice([2, 9], [1, 2])).toEqual({ kind: "chosen", ids: [2], choice: [2] });
    expect(resolveChoice([9], [1, 2])).toEqual({ kind: "choose" });
  });
});

describe("MUPP-080-R3 R4 what the chosen families show", () => {
  let x = 0;
  let y = 0;
  const clear = async () => {
    await run("DELETE FROM ss_event");
    await run("DELETE FROM child");
    await run("DELETE FROM parent");
    await run("DELETE FROM family");
  };
  beforeEach(async () => {
    await clear();
    x = (await run("INSERT INTO family (name) VALUES ('X')")).lastId;
    y = (await run("INSERT INTO family (name) VALUES ('Y')")).lastId;
    const parent = async (name: string, ...families: number[]) => {
      const { lastId } = await run("INSERT INTO parent (name) VALUES (?)", [name]);
      await run("DELETE FROM parent_family WHERE parent_id = ?", [lastId]);
      for (const f of families) await run("INSERT INTO parent_family VALUES (?, ?)", [lastId, f]);
      return lastId;
    };
    const [px, py, pxy] = [await parent("PX", x), await parent("PY", y), await parent("PXY", x, y)];
    for (const [owner, name] of [[px, "Kx"], [py, "Ky"], [pxy, "Kxy"]] as const) await run("INSERT INTO child (parent_id, name, birthdate) VALUES (?, ?, '2020-05-17')", [owner, name]);
    await run("INSERT INTO ss_event (owner_id, name, family_id) VALUES (?, 'Jul X', ?), (?, 'Jul Y', ?), (?, 'Påsk Y', ?)", [px, x, py, y, py, y]);
  });
  afterAll(clear);

  const names = async (ids: number[] | null) => (await family.listDeckInput(undefined, ids)).children.map((c) => c.name).sort();

  test("MUPP-080-R3 only the children whose parent is in a chosen family, once even when the parent is in both", async () => {
    expect(await names([x])).toEqual(["Kx", "Kxy"]);
    expect(await names([y])).toEqual(["Kxy", "Ky"]);
    expect(await names([x, y])).toEqual(["Kx", "Kxy", "Ky"]);
    expect(await names(null)).toEqual(["Kx", "Kxy", "Ky"]);
  });

  test("MUPP-080-R4 only the Secret Santa of the chosen families, also when it is the only one", async () => {
    expect((await entranceEvents([x])).map((e) => e.name)).toEqual(["Jul X"]);
    expect((await entranceEvents([y])).map((e) => e.name)).toEqual(["Jul Y", "Påsk Y"]);
    expect((await entranceEvents(null)).map((e) => e.name)).toEqual(["Jul X", "Jul Y", "Påsk Y"]);
  });
});
