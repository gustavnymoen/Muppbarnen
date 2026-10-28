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
    expect(await columns("wishlist_item")).toEqual(["id", "wishlist_id", "title", "description", "size", "url", "unlimited", "claimed_by", "claimed_at"]);
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
