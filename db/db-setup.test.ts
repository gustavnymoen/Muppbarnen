import { readFileSync } from "node:fs";
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
