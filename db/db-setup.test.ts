import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { describe, expect, test } from "vitest";
import { openUnitDb, queryUnitDb } from "./test-db";

describe("databasen", () => {
  test("TECH-001-R3 byggs från schema, seed och migreringar med schema_migrations", async () => {
    const tables = await queryUnitDb<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
    );
    expect(tables).toHaveLength(1);
  });
});

describe("MUPP-003-R7 the family tables", () => {
  const columns = async (table: string) =>
    (await queryUnitDb<{ name: string }>(`SELECT name FROM pragma_table_info('${table}')`)).map((c) => c.name);

  test("MUPP-003-R7 the migration creates parent, child, wishlist and wishlist_item with the columns of the card", async () => {
    expect(await columns("parent")).toEqual(["id", "name", "is_master_admin"]);
    expect(await columns("child")).toEqual(["id", "parent_id", "name", "birthdate", "picture", "size_clothes", "size_shoes", "size_head", "size_gloves"]);
    expect(await columns("wishlist")).toEqual(["id", "child_id", "occasion"]);
    expect(await columns("wishlist_item")).toEqual(["id", "wishlist_id", "title", "description", "size", "url", "unlimited", "claimed_by", "claimed_at", "added_at"]);
    const applied = await queryUnitDb<{ name: string }>("SELECT name FROM schema_migrations WHERE name = '003_family.sql'");
    expect(applied).toHaveLength(1);
  });

  test("MUPP-003-R7 the foreign keys point where they should", async () => {
    const keys = async (table: string) =>
      (await queryUnitDb<{ table: string; from: string; on_delete: string }>(`SELECT "table", "from", on_delete FROM pragma_foreign_key_list('${table}')`)).map(
        (k) => `${k.from}->${k.table} ${k.on_delete}`,
      );
    expect(await keys("child")).toEqual(["parent_id->parent NO ACTION"]);
    expect(await keys("wishlist")).toEqual(["child_id->child CASCADE"]);
    expect(await keys("wishlist_item")).toEqual(["wishlist_id->wishlist CASCADE"]);
  });

  // Fungerar med checkarna, en rad i taget, i en transaktion som alltid rullas tillbaka
  test("MUPP-003-R7 the constraints refuse a bad occasion, a second list per kid and occasion, a bad date and a missing name", async () => {
    const db = openUnitDb();
    try {
      const tx = await db.transaction("write");
      await tx.execute("PRAGMA foreign_keys = ON");
      await tx.execute("INSERT INTO parent (id, name) VALUES (9001, 'Påhittad förälder')");
      await tx.execute("INSERT INTO child (id, parent_id, name, birthdate) VALUES (9001, 9001, 'Påhittat barn', '2020-01-01')");
      await tx.execute("INSERT INTO wishlist (child_id, occasion) VALUES (9001, 'birthday')");

      const refused = async (sql: string) => {
        await expect(tx.execute(sql), sql).rejects.toThrow(/constraint failed/i);
      };
      await refused("INSERT INTO wishlist (child_id, occasion) VALUES (9001, 'easter')");
      await refused("INSERT INTO wishlist (child_id, occasion) VALUES (9001, 'birthday')");
      await refused("INSERT INTO child (parent_id, name, birthdate) VALUES (9001, 'Barn', 'igår')");
      await refused("INSERT INTO child (parent_id, name, birthdate) VALUES (9001, '', '2020-01-01')");
      await refused("INSERT INTO child (parent_id, name, birthdate) VALUES (777777, 'Barn', '2020-01-01')");
      await refused("INSERT INTO parent (name) VALUES ('')");
      await refused("INSERT INTO wishlist_item (wishlist_id, title) VALUES (1, '')");
      await refused("INSERT INTO wishlist_item (wishlist_id, title, unlimited) VALUES (1, 'Lego', 2)");
      await tx.rollback();
    } finally {
      db.close();
    }
  });
});

describe("MUPP-031-R4 the migration that dates items", () => {
  const migration = (name: string) => readFileSync(path.join(import.meta.dirname, "migrations", name), "utf8");

  // På en kopia i minnet: tabellerna som 003 gör, med påhittade rader, och sedan 004
  test("MUPP-031-R4 existing items get the migration date and nothing else in them or in the kids changes", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      await db.executeMultiple(migration("003_family.sql"));
      await db.executeMultiple(`
        INSERT INTO parent (id, name) VALUES (1, 'Påhittad förälder');
        INSERT INTO child (id, parent_id, name, birthdate, size_clothes) VALUES (1, 1, 'Påhittat barn', '2020-01-01', '122');
        INSERT INTO wishlist (id, child_id, occasion) VALUES (1, 1, 'birthday');
        INSERT INTO wishlist_item (id, wishlist_id, title, description, size, url, unlimited, claimed_by, claimed_at)
          VALUES (1, 1, 'Cykel', 'Blå', '20', 'https://exempel.se', 0, 'Moster', '2026-01-15');`);
      const before = (await db.execute("SELECT * FROM wishlist_item")).rows[0];
      await db.executeMultiple(migration("004_added_at.sql"));
      const today = (await db.execute("SELECT date('now') AS d")).rows[0].d;
      const after = (await db.execute("SELECT * FROM wishlist_item")).rows[0];
      expect({ ...after }).toEqual({ ...before, added_at: today });
      expect({ ...(await db.execute("SELECT name, birthdate, size_clothes FROM child")).rows[0] }).toEqual({ name: "Påhittat barn", birthdate: "2020-01-01", size_clothes: "122" });
    } finally {
      db.close();
    }
  });
});

describe("MUPP-048-R7 the migration that turns families into events", () => {
  const migration = (name: string) => readFileSync(path.join(import.meta.dirname, "migrations", name), "utf8");

  // Påhittad data i tabellerna som 003, 005 och 006 gör, som i en riktig databas (främmande nycklar på, som i skriptet)
  test("MUPP-048-R7 the family becomes an event owned by the master admin, and members, partners, wishes and ids are kept", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      await db.execute("PRAGMA foreign_keys = ON");
      for (const name of ["003_family.sql", "005_secret_santa.sql", "006_secret_santa_wishes.sql"]) await db.executeMultiple(migration(name));
      await db.executeMultiple(`
        INSERT INTO parent (id, name, is_master_admin) VALUES (1, 'Emma', 0), (2, 'Chef', 1);
        INSERT INTO ss_family (id, name) VALUES (1, 'Familjen A'), (2, 'Familjen B'), (3, ' familjen a '), (4, '   ');
        INSERT INTO ss_person (id, name, phone, email) VALUES (1, 'Anna', '0701111111', 'Anna@Exempel.se'), (2, 'Bo', '0702222222', 'bo@exempel.se');
        INSERT INTO ss_member (id, family_id, person_id, partner_member_id) VALUES (10, 1, 1, NULL), (11, 1, 2, NULL), (12, 2, 1, NULL);
        UPDATE ss_member SET partner_member_id = 11 WHERE id = 10;
        UPDATE ss_member SET partner_member_id = 10 WHERE id = 11;
        INSERT INTO ss_wish (id, member_id, title, description, size, url) VALUES (100, 10, 'Bok', 'Spänning', 'M', 'https://exempel.se'), (101, 12, 'Hos B', '', '', '');`);
      await db.executeMultiple(migration("007_secret_santa_events.sql"));

      // Alla grupper ägs av huvudadministratören; en dubblett av ett namn (versaler och mellanslag) får sitt id efter namnet
      expect((await db.execute("SELECT id, owner_id, name FROM ss_event ORDER BY id")).rows.map((r) => ({ ...r }))).toEqual([
        { id: 1, owner_id: 2, name: "Familjen A" },
        { id: 2, owner_id: 2, name: "Familjen B" },
        { id: 3, owner_id: 2, name: "familjen a (3)" },
        { id: 4, owner_id: 2, name: "Grupp 4" },
      ]);
      // Varje grupp har sin egen kopia av personen, med samma uppgifter och samma id som medlemskapet hade
      expect((await db.execute("SELECT id, event_id, name, phone, email, partner_member_id FROM ss_member ORDER BY id")).rows.map((r) => ({ ...r }))).toEqual([
        { id: 10, event_id: 1, name: "Anna", phone: "0701111111", email: "Anna@Exempel.se", partner_member_id: 11 },
        { id: 11, event_id: 1, name: "Bo", phone: "0702222222", email: "bo@exempel.se", partner_member_id: 10 },
        { id: 12, event_id: 2, name: "Anna", phone: "0701111111", email: "Anna@Exempel.se", partner_member_id: null },
      ]);
      expect((await db.execute("SELECT id, member_id, title, description, size, url FROM ss_wish ORDER BY id")).rows.map((r) => ({ ...r }))).toEqual([
        { id: 100, member_id: 10, title: "Bok", description: "Spänning", size: "M", url: "https://exempel.se" },
        { id: 101, member_id: 12, title: "Hos B", description: "", size: "", url: "" },
      ]);
      const tables = (await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE 'ss_%' OR name LIKE 'tmp_%') ORDER BY name")).rows.map((r) => r.name);
      expect(tables).toEqual(["ss_event", "ss_member", "ss_wish"]);

      // Reglerna gäller efteråt: ägare och telefon, och önskelistan följer gruppen
      await expect(db.execute("INSERT INTO ss_event (owner_id, name) VALUES (99, 'Utan ägare')")).rejects.toThrow(/constraint failed/i);
      await expect(db.execute("INSERT INTO ss_event (owner_id, name) VALUES (1, ' FAMILJEN b')")).rejects.toThrow(/constraint failed/i);
      await expect(db.execute("INSERT INTO ss_member (event_id, name, phone, email) VALUES (1, 'Cia', '0701111111', 'c@exempel.se')")).rejects.toThrow(/constraint failed/i);
      await db.execute("DELETE FROM ss_event WHERE id = 2");
      expect((await db.execute("SELECT COUNT(*) AS n FROM ss_wish")).rows[0].n).toBe(1);
    } finally {
      db.close();
    }
  });

  test("MUPP-048-R7 a database without any family migrates to empty tables", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      await db.execute("PRAGMA foreign_keys = ON");
      for (const name of ["003_family.sql", "005_secret_santa.sql", "006_secret_santa_wishes.sql", "007_secret_santa_events.sql"]) await db.executeMultiple(migration(name));
      expect((await db.execute("SELECT (SELECT COUNT(*) FROM ss_event) + (SELECT COUNT(*) FROM ss_member) + (SELECT COUNT(*) FROM ss_wish) AS n")).rows[0].n).toBe(0);
    } finally {
      db.close();
    }
  });
});

describe("MUPP-051-R1 the status of an event", () => {
  const migration = (name: string) => readFileSync(path.join(import.meta.dirname, "migrations", name), "utf8");
  test("MUPP-051-R1 the existing events become inactive, and a new one is inactive too", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      await db.execute("PRAGMA foreign_keys = ON");
      // Alla migreringar före 008, i ordning
      for (const name of readdirSync(path.join(import.meta.dirname, "migrations")).sort().filter((n) => n < "008")) await db.executeMultiple(migration(name));
      await db.executeMultiple("INSERT INTO parent (id, name, is_master_admin) VALUES (1, 'Chef', 1); INSERT INTO ss_event (id, owner_id, name) VALUES (1, 1, 'Gammal grupp');");
      await db.executeMultiple(migration("008_santa_event_status.sql"));
      await db.execute("INSERT INTO ss_event (id, owner_id, name) VALUES (2, 1, 'Ny grupp')");
      expect((await db.execute("SELECT id, status FROM ss_event ORDER BY id")).rows.map((r) => ({ ...r }))).toEqual([
        { id: 1, status: "inactive" },
        { id: 2, status: "inactive" },
      ]);
    } finally {
      db.close();
    }
  });

  test("MUPP-041-R4 the draw table keeps one row per giver and year, and a receiver once a year, and never draws a person themself", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      for (const name of readdirSync(path.join(import.meta.dirname, "migrations")).sort()) await db.executeMultiple(migration(name));
      const draw = (giver: number, receiver: number, year = 2026) => db.execute({ sql: "INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (1, ?, ?, ?)", args: [year, giver, receiver] });
      await draw(1, 2);
      await draw(2, 1);
      await draw(1, 2, 2025);
      await expect(draw(1, 3)).rejects.toThrow(/constraint/i);
      await expect(draw(3, 2)).rejects.toThrow(/constraint/i);
      await expect(draw(3, 3)).rejects.toThrow(/constraint/i);
    } finally {
      db.close();
    }
  });
});
