import { createClient } from "@libsql/client";
import { testDbFile } from "../lib/local-db.mjs";
import { dateIn } from "./helpers";

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

// addedAt: the day the wish was added (MUPP-031-R4), today unless the test says otherwise
type WishDetails = { description?: string; size?: string; url?: string; unlimited?: boolean; claimedBy?: string; addedAt?: string };

export const addWish = (childId: number, occasion: "birthday" | "christmas", title: string, details: WishDetails = {}) =>
  withDb(async (db) => {
    await db.execute({ sql: "INSERT OR IGNORE INTO wishlist (child_id, occasion) VALUES (?, ?)", args: [childId, occasion] });
    const list = await db.execute({ sql: "SELECT id FROM wishlist WHERE child_id = ? AND occasion = ?", args: [childId, occasion] });
    await db.execute({
      sql: "INSERT INTO wishlist_item (wishlist_id, title, description, size, url, unlimited, claimed_by, claimed_at, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [list.rows[0].id, title, details.description ?? "", details.size ?? "", details.url ?? "", details.unlimited ? 1 : 0, details.claimedBy ?? null, details.claimedBy ? "2026-01-15" : null, details.addedAt ?? dateIn(0)],
    });
  });

// Who has claimed a wish, as the database holds it (null: nobody)
export const claimedByOf = (title: string) =>
  withDb(async (db) => {
    const row = (await db.execute({ sql: "SELECT claimed_by FROM wishlist_item WHERE title = ?", args: [title] })).rows[0];
    return row ? (row.claimed_by as string | null) : undefined;
  });

// Another visitor claims a wish while the page is open
export const claimDirectly = (title: string, name: string) =>
  withDb((db) => db.execute({ sql: "UPDATE wishlist_item SET claimed_by = ?, claimed_at = '2026-01-15' WHERE title = ?", args: [name, title] }));

// Another visitor removes a claim while the page is open
export const unclaimDirectly = (title: string) =>
  withDb((db) => db.execute({ sql: "UPDATE wishlist_item SET claimed_by = NULL, claimed_at = NULL WHERE title = ?", args: [title] }));

export const setMasterFlag = (parentId: number, master: boolean) =>
  withDb((db) => db.execute({ sql: "UPDATE parent SET is_master_admin = ? WHERE id = ?", args: [master ? 1 : 0, parentId] }));

export const removeParentRow = (parentId: number) => withDb((db) => db.execute({ sql: "DELETE FROM parent WHERE id = ?", args: [parentId] }));

export const countRows = (table: "parent" | "child" | "wishlist" | "wishlist_item") =>
  withDb(async (db) => Number((await db.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n));

export const pictureOf = (childId: number) =>
  withDb(async (db) => String((await db.execute({ sql: "SELECT picture FROM child WHERE id = ?", args: [childId] })).rows[0].picture));

export const setPicture = (childId: number, name: string) =>
  withDb((db) => db.execute({ sql: "UPDATE child SET picture = ? WHERE id = ?", args: [name, childId] }));

// Everything the tests made. The test database is only theirs, so it is all removed.
// The Secret Santa tables first: an event is owned by a parent, and a parent who owns one cannot be deleted
async function clearSantaTables(db: ReturnType<typeof createClient>) {
  await db.execute("DELETE FROM ss_wish");
  await db.execute("DELETE FROM ss_member");
  await db.execute("DELETE FROM ss_event");
}

export const clearFamily = () =>
  withDb(async (db) => {
    await clearSantaTables(db);
    await db.execute("DELETE FROM wishlist_item");
    await db.execute("DELETE FROM wishlist");
    await db.execute("DELETE FROM child");
    await db.execute("DELETE FROM parent");
  });

export const childIdOf = (name: string) =>
  withDb(async (db) => Number((await db.execute({ sql: "SELECT id FROM child WHERE name = ?", args: [name] })).rows[0].id));

// A kid's sizes, as the admin page would save them
export const setSizes = (childId: number, sizes: { clothes?: string; shoes?: string; head?: string; gloves?: string }) =>
  withDb((db) =>
    db.execute({
      sql: "UPDATE child SET size_clothes = ?, size_shoes = ?, size_head = ?, size_gloves = ? WHERE id = ?",
      args: [sizes.clothes ?? "", sizes.shoes ?? "", sizes.head ?? "", sizes.gloves ?? "", childId],
    }),
  );

// Secret Santa (MUPP-038, MUPP-048): made-up events (groups) and members, made straight in the test database.
// An event has an owner, the parent who administers it; without one the helper makes a made-up parent that clearSanta removes again.
const SANTA_OWNER = "Santa-testförälder";

export const addSantaEvent = (name: string, ownerId?: number) =>
  withDb(async (db) => {
    let owner = ownerId;
    if (owner === undefined) {
      const found = await db.execute({ sql: "SELECT id FROM parent WHERE name = ?", args: [SANTA_OWNER] });
      owner = found.rows[0] ? Number(found.rows[0].id) : Number((await db.execute({ sql: "INSERT INTO parent (name) VALUES (?)", args: [SANTA_OWNER] })).lastInsertRowid);
    }
    return Number((await db.execute({ sql: "INSERT INTO ss_event (owner_id, name) VALUES (?, ?)", args: [owner, name] })).lastInsertRowid);
  });

// The Secret Santa cookie holds the member id
export const addSantaMember = (eventId: number, name: string, phone: string, email: string) =>
  withDb(async (db) => Number((await db.execute({ sql: "INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", args: [eventId, name, phone, email] })).lastInsertRowid));

// Secret Santa wish lists (MUPP-040): made straight in the test database, read back as the database holds them
export const addSantaWish = (memberId: number, title: string) =>
  withDb(async (db) => Number((await db.execute({ sql: "INSERT INTO ss_wish (member_id, title) VALUES (?, ?)", args: [memberId, title] })).lastInsertRowid));

export const santaWishes = (memberId: number) =>
  withDb(async (db) => (await db.execute({ sql: "SELECT title, description, size, url FROM ss_wish WHERE member_id = ? ORDER BY id", args: [memberId] })).rows.map((r) => ({ ...r })));

export const clearSanta = () =>
  withDb(async (db) => {
    await clearSantaTables(db);
    await db.execute({ sql: "DELETE FROM parent WHERE name = ?", args: [SANTA_OWNER] });
  });

export const countSanta = (table: "ss_event" | "ss_member") =>
  withDb(async (db) => Number((await db.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n));

// The events of the test database by name, in name order
export const santaEventNames = () => withDb(async (db) => (await db.execute("SELECT name FROM ss_event ORDER BY name")).rows.map((r) => String(r.name)));
