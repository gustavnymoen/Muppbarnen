import { createClient } from "@libsql/client";
import { testDbFile } from "../lib/local-db.mjs";

// The admin tests make their data straight in the local test database (the one
// scripts/test-server.mjs rebuilds on every run, never the user's own) and remove it again.
// Only used when the tests run against the local test server.
async function withDb<T>(fn: (db: ReturnType<typeof createClient>) => Promise<T>) {
  const db = createClient({ url: `file:${testDbFile}` });
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

export const addParent = (name: string, master = false) =>
  withDb(async (db) => Number((await db.execute({ sql: "INSERT INTO parent (name, is_master_admin) VALUES (?, ?)", args: [name, master ? 1 : 0] })).lastInsertRowid));

export const addChild = (parentId: number, name: string, birthdate = "2020-05-17") =>
  withDb(async (db) =>
    Number((await db.execute({ sql: "INSERT INTO child (parent_id, name, birthdate) VALUES (?, ?, ?)", args: [parentId, name, birthdate] })).lastInsertRowid),
  );

export const setMasterFlag = (parentId: number, master: boolean) =>
  withDb((db) => db.execute({ sql: "UPDATE parent SET is_master_admin = ? WHERE id = ?", args: [master ? 1 : 0, parentId] }));

export const removeParentRow = (parentId: number) => withDb((db) => db.execute({ sql: "DELETE FROM parent WHERE id = ?", args: [parentId] }));

export const countRows = (table: "parent" | "child" | "wishlist" | "wishlist_item") =>
  withDb(async (db) => Number((await db.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n));

export const pictureOf = (childId: number) =>
  withDb(async (db) => String((await db.execute({ sql: "SELECT picture FROM child WHERE id = ?", args: [childId] })).rows[0].picture));

// Everything the tests made. The test database is only theirs, so it is all removed.
export const clearFamily = () =>
  withDb(async (db) => {
    await db.execute("DELETE FROM wishlist_item");
    await db.execute("DELETE FROM wishlist");
    await db.execute("DELETE FROM child");
    await db.execute("DELETE FROM parent");
  });

export const childIdOf = (name: string) =>
  withDb(async (db) => Number((await db.execute({ sql: "SELECT id FROM child WHERE name = ?", args: [name] })).rows[0].id));
