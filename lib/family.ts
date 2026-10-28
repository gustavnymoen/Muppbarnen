import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import type { DeckInput, Wishes } from "./deck";
import { collect, parseBirthdate, parseId, parseLink, parseOccasion, parseText, type Occasion } from "./form-input";

// Föräldrar, barn och önskelistor: frågorna och reglerna (MUPP-003). Allt som ändrar
// något tar emot vem som gör det (actor, läst ur databasen vid varje förfrågan) och
// kontrollerar både rättigheten och indatan här, oavsett vad sidan skickar.

export type Parent = { id: number; name: string; isMasterAdmin: boolean };
export type Child = {
  id: number;
  parentId: number;
  name: string;
  birthdate: string;
  picture: string;
  sizes: { clothes: string; shoes: string; head: string; gloves: string };
};
export type WishlistItem = { id: number; title: string; description: string; size: string; url: string; unlimited: boolean };

// ok: det gick bra; annars ett meddelande för hela formuläret och/eller per fält
export type Outcome<T = object> = ({ ok: true } & T) | { ok: false; error?: string; fields?: Record<string, string> };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;
const NO_SUCH_PARENT = { ok: false, error: "Föräldern finns inte längre. Ladda om sidan." } as const;

// ---- Läsa

type ParentRow = { id: number; name: string; is_master_admin: number };
const toParent = (row: ParentRow): Parent => ({ id: row.id, name: row.name, isMasterAdmin: row.is_master_admin === 1 });

export async function findParent(id: number) {
  const row = await get<ParentRow>("SELECT id, name, is_master_admin FROM parent WHERE id = ?", [id]);
  return row && toParent(row);
}

export async function listParents() {
  return (await all<ParentRow>("SELECT id, name, is_master_admin FROM parent ORDER BY name, id")).map(toParent);
}

type ChildRow = {
  id: number;
  parent_id: number;
  name: string;
  birthdate: string;
  picture: string;
  size_clothes: string;
  size_shoes: string;
  size_head: string;
  size_gloves: string;
};
const CHILD_COLUMNS = "id, parent_id, name, birthdate, picture, size_clothes, size_shoes, size_head, size_gloves";
const toChild = (row: ChildRow): Child => ({
  id: row.id,
  parentId: row.parent_id,
  name: row.name,
  birthdate: row.birthdate,
  picture: row.picture,
  sizes: { clothes: row.size_clothes, shoes: row.size_shoes, head: row.size_head, gloves: row.size_gloves },
});

export async function findChild(id: number) {
  const row = await get<ChildRow>(`SELECT ${CHILD_COLUMNS} FROM child WHERE id = ?`, [id]);
  return row && toChild(row);
}

// Äldst först
export async function listChildren(parentId?: number) {
  const rows =
    parentId === undefined
      ? await all<ChildRow>(`SELECT ${CHILD_COLUMNS} FROM child ORDER BY birthdate, id`)
      : await all<ChildRow>(`SELECT ${CHILD_COLUMNS} FROM child WHERE parent_id = ? ORDER BY birthdate, id`, [parentId]);
  return rows.map(toChild);
}

export async function listWishlists(childId: number) {
  const rows = await all<{ occasion: Occasion } & Record<string, string | number>>(
    `SELECT w.occasion, i.id, i.title, i.description, i.size, i.url, i.unlimited
     FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id
     WHERE w.child_id = ? ORDER BY i.id`,
    [childId],
  );
  const lists: Record<Occasion, WishlistItem[]> = { birthday: [], christmas: [] };
  for (const row of rows) {
    lists[row.occasion].push({
      id: row.id as number,
      title: row.title as string,
      description: row.description as string,
      size: row.size as string,
      url: row.url as string,
      unlimited: row.unlimited === 1,
    });
  }
  return lists;
}

// Barnen och rubrikerna på önskningarna till kortleken på startsidan (MUPP-004), i listans ordning
export async function listDeckInput(): Promise<{ children: DeckInput[]; wishes: Wishes }> {
  const children = (await listChildren()).map((c) => ({ id: c.id, parentId: c.parentId, name: c.name, birthdate: c.birthdate, hasPicture: c.picture !== "" }));
  const rows = await all<{ child_id: number; occasion: Occasion; id: number; title: string }>(
    `SELECT w.child_id, w.occasion, i.id, i.title
     FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id ORDER BY i.id`,
  );
  const wishes: Wishes = new Map();
  for (const row of rows) {
    const lists = wishes.get(row.child_id) ?? { birthday: [], christmas: [] };
    lists[row.occasion].push({ id: row.id, title: row.title });
    wishes.set(row.child_id, lists);
  }
  return { children, wishes };
}

// Huvudadministratören kan ändra allt; en förälder bara sina egna barn
export const canManage = (actor: Parent | null, child: Pick<Child, "parentId">) =>
  actor !== null && (actor.isMasterAdmin || child.parentId === actor.id);

// Barnet om aktören får ändra det, annars undefined (också när barnet inte finns,
// så att svaret inte avslöjar vilka id som finns)
async function manageableChild(actor: Parent | null, rawId: unknown) {
  const id = parseId(rawId);
  const child = id === null ? undefined : await findChild(id);
  return child && canManage(actor, child) ? child : undefined;
}

// ---- Första huvudadministratören

// Bara medan det inte finns några föräldrar alls; kontrollen och skrivningen sker i
// samma transaktion, så två samtidiga anrop kan inte båda lyckas
export async function createFirstMaster(rawName: unknown): Promise<Outcome<{ id: number }>> {
  const name = parseText(rawName, 60, true);
  if (!name.ok) return { ok: false, fields: { name: name.error } };
  return withTransaction(async (tx) => {
    if (await get("SELECT 1 FROM parent LIMIT 1", [], tx)) return { ok: false, error: "Det finns redan en huvudadministratör." };
    const { lastId } = await run("INSERT INTO parent (name, is_master_admin) VALUES (?, 1)", [name.value], tx);
    return { ok: true, id: lastId };
  });
}

// ---- Föräldrar (bara huvudadministratören)

export async function saveParent(actor: Parent | null, input: { id?: unknown; name: unknown; isMasterAdmin: boolean }): Promise<Outcome> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const checked = collect({ name: parseText(input.name, 60, true) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name } = checked.values;
  const flag = input.isMasterAdmin ? 1 : 0;

  if (input.id === undefined || input.id === "") {
    await run("INSERT INTO parent (name, is_master_admin) VALUES (?, ?)", [name, flag]);
    return { ok: true };
  }
  const id = parseId(input.id);
  return withTransaction(async (tx) => {
    const current = id === null ? undefined : await get<ParentRow>("SELECT id, name, is_master_admin FROM parent WHERE id = ?", [id], tx);
    if (!current) return NO_SUCH_PARENT;
    if (current.is_master_admin === 1 && flag === 0 && (await otherMasters(current.id, tx)) === 0) return LAST_MASTER;
    await run("UPDATE parent SET name = ?, is_master_admin = ? WHERE id = ?", [name, flag, current.id], tx);
    return { ok: true };
  });
}

const LAST_MASTER = { ok: false, error: "Det måste finnas minst en huvudadministratör." } as const;

async function otherMasters(id: number, tx: Executor) {
  const row = await get<{ n: number }>("SELECT COUNT(*) AS n FROM parent WHERE is_master_admin = 1 AND id <> ?", [id], tx);
  return row?.n ?? 0;
}

export async function removeParent(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const id = parseId(rawId);
  return withTransaction(async (tx) => {
    const current = id === null ? undefined : await get<ParentRow>("SELECT id, name, is_master_admin FROM parent WHERE id = ?", [id], tx);
    if (!current) return NO_SUCH_PARENT;
    if (await get("SELECT 1 FROM child WHERE parent_id = ? LIMIT 1", [current.id], tx)) {
      return { ok: false, error: "Föräldern har barn. Flytta eller ta bort barnen först." };
    }
    if (current.is_master_admin === 1 && (await otherMasters(current.id, tx)) === 0) return LAST_MASTER;
    await run("DELETE FROM parent WHERE id = ?", [current.id], tx);
    return { ok: true };
  });
}

// ---- Barn (bara huvudadministratören)

export async function saveChild(actor: Parent | null, input: { id?: unknown; name: unknown; birthdate: unknown; parentId: unknown }): Promise<Outcome> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const parentId = parseId(input.parentId);
  const checked = collect({
    name: parseText(input.name, 60, true),
    birthdate: parseBirthdate(input.birthdate),
    parentId: parentId === null || !(await findParent(parentId)) ? { ok: false as const, error: "Välj en förälder." } : { ok: true as const, value: parentId },
  });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name, birthdate } = checked.values;

  if (input.id === undefined || input.id === "") {
    await run("INSERT INTO child (parent_id, name, birthdate) VALUES (?, ?, ?)", [checked.values.parentId, name, birthdate]);
    return { ok: true };
  }
  const child = await manageableChild(actor, input.id);
  if (!child) return NOT_ALLOWED;
  await run("UPDATE child SET parent_id = ?, name = ?, birthdate = ? WHERE id = ?", [checked.values.parentId, name, birthdate, child.id]);
  return { ok: true };
}

// Barnet, dess listor och önskningar tas bort; bilden som låg på barnet lämnas tillbaka så att filen kan tas bort
export async function removeChild(actor: Parent | null, rawId: unknown): Promise<Outcome<{ picture: string }>> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const child = await manageableChild(actor, rawId);
  if (!child) return NOT_ALLOWED;
  // Listorna och önskningarna tas bort här och inte bara av ON DELETE CASCADE: en transaktion
  // behåller inte alltid inställningen för främmande nycklar på en lokal databasfil
  await withTransaction(async (tx) => {
    await run("DELETE FROM wishlist_item WHERE wishlist_id IN (SELECT id FROM wishlist WHERE child_id = ?)", [child.id], tx);
    await run("DELETE FROM wishlist WHERE child_id = ?", [child.id], tx);
    await run("DELETE FROM child WHERE id = ?", [child.id], tx);
  });
  return { ok: true, picture: child.picture };
}

// Barnet som bilden ska läggas på, om aktören får det (bara huvudadministratören)
export async function childForPicture(actor: Parent | null, rawId: unknown) {
  return actor?.isMasterAdmin ? manageableChild(actor, rawId) : undefined;
}

export async function setChildPicture(childId: number, picture: string) {
  await run("UPDATE child SET picture = ? WHERE id = ?", [picture, childId]);
}

// Tar bort barnets bild (MUPP-010-R4): fältet töms, och namnet på filen lämnas tillbaka så att
// den kan tas bort ur lagret när databasen är uppdaterad. Bara huvudadministratören; utan bild
// händer ingenting (picture är då tom).
export async function clearChildPicture(actor: Parent | null, rawId: unknown): Promise<Outcome<{ picture: string }>> {
  const child = await childForPicture(actor, rawId);
  if (!child) return NOT_ALLOWED;
  if (child.picture) await setChildPicture(child.id, "");
  return { ok: true, picture: child.picture };
}

// ---- Storlekar (barnets förälder eller huvudadministratören)

export async function saveSizes(
  actor: Parent | null,
  rawChildId: unknown,
  input: { clothes: unknown; shoes: unknown; head: unknown; gloves: unknown },
): Promise<Outcome> {
  const child = await manageableChild(actor, rawChildId);
  if (!child) return NOT_ALLOWED;
  const checked = collect({
    clothes: parseText(input.clothes, 40),
    shoes: parseText(input.shoes, 40),
    head: parseText(input.head, 40),
    gloves: parseText(input.gloves, 40),
  });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { clothes, shoes, head, gloves } = checked.values;
  await run("UPDATE child SET size_clothes = ?, size_shoes = ?, size_head = ?, size_gloves = ? WHERE id = ?", [clothes, shoes, head, gloves, child.id]);
  return { ok: true };
}

// ---- Önskningar (barnets förälder eller huvudadministratören)

export async function saveItem(
  actor: Parent | null,
  input: { childId: unknown; occasion: unknown; itemId?: unknown; title: unknown; size: unknown; description: unknown; url: unknown; unlimited: boolean },
): Promise<Outcome> {
  const occasion = parseOccasion(input.occasion);
  const checked = collect({
    title: parseText(input.title, 120, true),
    size: parseText(input.size, 40),
    description: parseText(input.description, 500),
    url: parseLink(input.url),
  });

  if (input.itemId === undefined || input.itemId === "") {
    const child = await manageableChild(actor, input.childId);
    if (!child || !occasion) return NOT_ALLOWED;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { title, size, description, url } = checked.values;
    await withTransaction(async (tx) => {
      // Listan skapas när första önskningen läggs till
      await run("INSERT OR IGNORE INTO wishlist (child_id, occasion) VALUES (?, ?)", [child.id, occasion], tx);
      const list = await get<{ id: number }>("SELECT id FROM wishlist WHERE child_id = ? AND occasion = ?", [child.id, occasion], tx);
      await run(
        "INSERT INTO wishlist_item (wishlist_id, title, description, size, url, unlimited) VALUES (?, ?, ?, ?, ?, ?)",
        [list!.id, title, description, size, url, input.unlimited ? 1 : 0],
        tx,
      );
    });
    return { ok: true };
  }

  const item = await manageableItem(actor, input.itemId);
  if (!item) return NOT_ALLOWED;
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { title, size, description, url } = checked.values;
  await run("UPDATE wishlist_item SET title = ?, description = ?, size = ?, url = ?, unlimited = ? WHERE id = ?", [title, description, size, url, input.unlimited ? 1 : 0, item.id]);
  return { ok: true };
}

// Önskningen om aktören får ändra barnets lista
async function manageableItem(actor: Parent | null, rawId: unknown) {
  const id = parseId(rawId);
  const row =
    id === null
      ? undefined
      : await get<{ id: number; child_id: number }>(
          "SELECT i.id, w.child_id FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id WHERE i.id = ?",
          [id],
        );
  return row && (await manageableChild(actor, String(row.child_id))) ? row : undefined;
}

export async function removeItem(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  const item = await manageableItem(actor, rawId);
  if (!item) return NOT_ALLOWED;
  await run("DELETE FROM wishlist_item WHERE id = ?", [item.id]);
  return { ok: true };
}

export async function clearList(actor: Parent | null, rawChildId: unknown, rawOccasion: unknown): Promise<Outcome> {
  const child = await manageableChild(actor, rawChildId);
  const occasion = parseOccasion(rawOccasion);
  if (!child || !occasion) return NOT_ALLOWED;
  await run(
    "DELETE FROM wishlist_item WHERE wishlist_id IN (SELECT id FROM wishlist WHERE child_id = ? AND occasion = ?)",
    [child.id, occasion],
  );
  return { ok: true };
}
