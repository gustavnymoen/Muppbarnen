import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const { cleanupDue, cleanupYear, runCleanup } = await import("./santa-cleanup");

const clear = async () => {
  await run("DELETE FROM ss_draw");
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};
const day = (year: number, month: number, d: number) => ({ year, month, day: d });
const count = async (table: string) => (await get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))!.n;

// Två grupper med två deltagare var, önskelistor och förra årets dragning
async function seed() {
  const owner = (await run("INSERT INTO parent (name) VALUES ('Emma')")).lastId;
  const ids: number[][] = [];
  for (const [name, status] of [["Emmas jul", "started"], ["Släktens jul", "preparing"]] as const) {
    const event = (await run("INSERT INTO ss_event (owner_id, name, status) VALUES (?, ?, ?)", [owner, name, status])).lastId;
    const members = [];
    for (const [i, who] of ["Anna", "Bertil"].entries()) {
      const m = (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event, who, `070000${event}${i}00`.slice(0, 10), `${who}@exempel.invalid`])).lastId;
      await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Bok')", [m]);
      members.push(m);
    }
    await run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, 2025, ?, ?), (?, 2025, ?, ?)", [event, members[0], members[1], event, members[1], members[0]]);
    ids.push([event, ...members]);
  }
  return ids;
}

beforeEach(async () => {
  await clear();
  await run("UPDATE ss_cleanup SET year = 2025");
});
afterAll(async () => {
  await clear();
  await run("UPDATE ss_cleanup SET year = CAST(strftime('%Y', 'now') AS INTEGER)");
});

describe("MUPP-044-R1 the date rule", () => {
  test("MUPP-044-R1 nothing is due the day before 24 January, and everything is due on the day and after", () => {
    expect(cleanupDue(day(2026, 1, 23), 2025)).toBe(false);
    expect(cleanupDue(day(2026, 1, 24), 2025)).toBe(true);
    expect(cleanupDue(day(2026, 1, 25), 2025)).toBe(true);
    expect(cleanupDue(day(2026, 12, 24), 2025)).toBe(true);
  });

  test("MUPP-044-R1 it is done once a year: not again the same year, then again the next", () => {
    expect(cleanupDue(day(2026, 2, 1), 2026)).toBe(false);
    expect(cleanupDue(day(2027, 1, 24), 2026)).toBe(true);
  });

  test("MUPP-044-R1 the migration starts the year at the current year, so a new site is not wiped at once", async () => {
    await run("UPDATE ss_cleanup SET year = CAST(strftime('%Y', 'now') AS INTEGER)");
    expect(await cleanupYear()).toBe(new Date().getUTCFullYear());
  });
});

describe("MUPP-044-R1 R2 what the cleanup deletes and keeps", () => {
  test("MUPP-044-R1 before 24 January nothing is deleted or changed", async () => {
    await seed();
    expect(await runCleanup(day(2026, 1, 23))).toEqual({ cleaned: 0 });
    expect(await count("ss_wish")).toBe(4);
    expect(await all("SELECT status FROM ss_event ORDER BY id")).toEqual([{ status: "started" }, { status: "preparing" }]);
    expect(await cleanupYear()).toBe(2025);
  });

  test("MUPP-044-R1 on 24 January every event, whatever its status, is inactive without wishes", async () => {
    await run("INSERT INTO parent (id, name) VALUES (99, 'Erik')");
    await seed();
    await run("UPDATE ss_member SET list_changed_at = 1");
    await run("INSERT INTO ss_event (owner_id, name, status) VALUES (99, 'Redan inaktiv', 'inactive')");
    expect(await runCleanup(day(2026, 1, 24))).toEqual({ cleaned: 3 });
    expect(await count("ss_wish")).toBe(0);
    expect(await count("ss_member WHERE list_changed_at IS NOT NULL")).toBe(0);
    expect((await all<{ status: string }>("SELECT status FROM ss_event")).map((e) => e.status)).toEqual(["inactive", "inactive", "inactive"]);
    expect(await cleanupYear()).toBe(2026);
  });

  test("MUPP-044-R2 the log, the events and the members are unchanged", async () => {
    await seed();
    const draw = await all("SELECT * FROM ss_draw ORDER BY event_id, giver_id");
    const members = await all("SELECT * FROM ss_member ORDER BY id");
    await runCleanup(day(2026, 2, 1));
    expect(await all("SELECT * FROM ss_draw ORDER BY event_id, giver_id")).toEqual(draw);
    expect(await all("SELECT * FROM ss_member ORDER BY id")).toEqual(members);
    expect(await count("ss_event")).toBe(2);
  });

  test("MUPP-044-R1 a second run the same year changes nothing, so next year's lists are not wiped", async () => {
    const [[event, anna]] = await seed();
    await runCleanup(day(2026, 2, 1));
    await run("UPDATE ss_event SET status = 'preparing' WHERE id = ?", [event]);
    await run("INSERT INTO ss_wish (member_id, title) VALUES (?, 'Ny bok')", [anna]);
    expect(await runCleanup(day(2026, 11, 20))).toEqual({ cleaned: 0 });
    expect(await count("ss_wish")).toBe(1);
    expect((await get<{ status: string }>("SELECT status FROM ss_event WHERE id = ?", [event]))!.status).toBe("preparing");
  });
});
