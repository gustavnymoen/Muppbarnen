import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run } = await import("./db");
const { matchOf } = await import("./santa-match");

const clear = async () => {
  await run("DELETE FROM ss_draw");
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};
let ownerId: number;
beforeEach(async () => {
  await clear();
  ownerId = (await run("INSERT INTO parent (name, is_master_admin) VALUES ('Chef', 1)")).lastId;
});
afterAll(clear);

const thisYear = new Date().getFullYear();
let counter = 0;
const event = async (status = "started") => (await run("INSERT INTO ss_event (owner_id, name, status) VALUES (?, ?, ?)", [ownerId, `Grupp ${++counter}`, status])).lastId;
const member = async (eventId: number, name: string) =>
  (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, 'p@exempel.se')", [eventId, name, `070002${String(++counter).padStart(4, "0")}`])).lastId;
const draw = (eventId: number, giver: number, receiver: number, year = thisYear) =>
  run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?)", [eventId, year, giver, receiver]);
const wish = (memberId: number, title: string) => run("INSERT INTO ss_wish (member_id, title) VALUES (?, ?)", [memberId, title]);

describe("MUPP-042-R1 R2 your person and only your person", () => {
  test("MUPP-042-R1 a giver gets the name and the wishes of the one they drew, in order", async () => {
    const e = await event();
    const [anna, bo] = [await member(e, "Anna"), await member(e, "Bo")];
    await draw(e, anna, bo);
    await draw(e, bo, anna);
    await wish(bo, "Bok");
    await wish(bo, "Boll");
    await wish(anna, "Hemlig");
    expect(await matchOf(anna)).toMatchObject({ name: "Bo", wishes: [{ title: "Bok" }, { title: "Boll" }] });
  });

  test("MUPP-042-R2 an asymmetric draw: A→B and B→C gives A only B and B only C, and nobody's answer holds their giver", async () => {
    const e = await event();
    const [a, b, c, d, f] = [await member(e, "Anna"), await member(e, "Bo"), await member(e, "Cia"), await member(e, "Dan"), await member(e, "Eva")];
    for (const [giver, receiver] of [[a, b], [b, c], [c, a], [d, f], [f, d]]) await draw(e, giver, receiver);
    const names = async (id: number) => (await matchOf(id))!.name;
    expect([await names(a), await names(b), await names(c), await names(d), await names(f)]).toEqual(["Bo", "Cia", "Anna", "Eva", "Dan"]);
    // Bo drog Cia och drogs av Anna: svaret nämner Cia, aldrig Anna
    expect(JSON.stringify(await matchOf(b))).not.toContain("Anna");
    expect(Object.keys((await matchOf(a))!).sort()).toEqual(["name", "wishes"]);
  });

  test("MUPP-042-R1 nothing before the start: a preparing or inactive event, or no row in the draw, gives no match", async () => {
    for (const status of ["preparing", "inactive"]) {
      const e = await event(status);
      const [a, b] = [await member(e, "Anna"), await member(e, "Bo")];
      await draw(e, a, b);
      expect(await matchOf(a), status).toBeUndefined();
    }
    const started = await event();
    expect(await matchOf(await member(started, "Utan dragning"))).toBeUndefined();
    expect(await matchOf(99999)).toBeUndefined();
  });

  test("MUPP-042-R1 only this year's draw counts, not last year's rows", async () => {
    const e = await event();
    const [a, b, c] = [await member(e, "Anna"), await member(e, "Bo"), await member(e, "Cia")];
    await draw(e, a, b, thisYear - 1);
    await draw(e, a, c);
    expect((await matchOf(a))!.name).toBe("Cia");
  });
});
