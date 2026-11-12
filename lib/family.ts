import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import { isArchived, isoDate, occasionOf, parseDate, swedishToday, type DeckInput, type Sizes, type Today, type Wishes } from "./deck";
import { collect, parseBirthdate, parseId, parseOccasion, parseText, parseWish, type Occasion } from "./form-input";

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
  sizes: Sizes;
};
export type WishlistItem = { id: number; title: string; description: string; size: string; url: string; unlimited: boolean };
// En önskning på adminsidan, med vem som paxat den och när (MUPP-007)
export type AdminItem = WishlistItem & { claimedBy: string | null; claimedAt: string | null };
// Ett tillfälle i arkivet (MUPP-031-R5): "Födelsedag 2025" och önskningarna, med vem som paxat dem
export type ArchiveGroup = { key: string; date: string; name: string; items: AdminItem[] };

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

type ItemRow = { id: number; title: string; description: string; size: string; url: string; unlimited: number };
const toItem = (row: ItemRow): WishlistItem => ({ id: row.id, title: row.title, description: row.description, size: row.size, url: row.url, unlimited: row.unlimited === 1 });
const toAdminItem = (row: ItemRow & { claimed_by: string | null; claimed_at: string | null }): AdminItem => ({ ...toItem(row), claimedBy: row.claimed_by, claimedAt: row.claimed_at });

const ARCHIVE_NAMES: Record<Occasion, string> = { birthday: "Födelsedag", christmas: "Julafton" };

// Barnets två listor, utan det som är arkiverat, och arkivet: ett tillfälle per grupp, det senaste först (MUPP-031-R4, R5).
// Julafton heter efter sitt eget år, också när den arkiveras i januari.
export async function listWishlists(child: Child, today = swedishToday()) {
  const rows = await all<{ occasion: Occasion; added_at: string; claimed_by: string | null; claimed_at: string | null } & ItemRow>(
    `SELECT w.occasion, i.id, i.title, i.description, i.size, i.url, i.unlimited, i.added_at, i.claimed_by, i.claimed_at
     FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id
     WHERE w.child_id = ? ORDER BY i.id`,
    [child.id],
  );
  const lists: Record<Occasion, AdminItem[]> = { birthday: [], christmas: [] };
  const archive = new Map<string, ArchiveGroup>();
  for (const row of rows) {
    if (!isArchived(child, row.occasion, row.added_at, today)) {
      lists[row.occasion].push(toAdminItem(row));
      continue;
    }
    const date = isoDate(occasionOf(child, row.occasion, parseDate(row.added_at)));
    const key = `${row.occasion}-${date}`;
    const group = archive.get(key) ?? { key, date, name: `${ARCHIVE_NAMES[row.occasion]} ${date.slice(0, 4)}`, items: [] };
    group.items.push(toAdminItem(row));
    archive.set(key, group);
  }
  return { ...lists, archive: [...archive.values()].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key)) };
}

// Barnen, deras storlekar (MUPP-014) och önskningarna till kortleken på startsidan (MUPP-004, MUPP-005), i listans ordning;
// det arkiverade kommer inte med (MUPP-031-R4)
export async function listDeckInput(today = swedishToday()): Promise<{ children: DeckInput[]; wishes: Wishes }> {
  const children = await listChildren();
  const kids = new Map(children.map((c) => [c.id, c]));
  const rows = await all<{ child_id: number; occasion: Occasion; added_at: string; claimed_by: string | null; claimed_at: string | null } & ItemRow>(
    `SELECT w.child_id, w.occasion, i.id, i.title, i.description, i.size, i.url, i.unlimited, i.added_at, i.claimed_by, i.claimed_at
     FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id ORDER BY i.id`,
  );
  const wishes: Wishes = new Map();
  for (const row of rows) {
    if (isArchived(kids.get(row.child_id)!, row.occasion, row.added_at, today)) continue;
    const lists = wishes.get(row.child_id) ?? { birthday: [], christmas: [] };
    lists[row.occasion].push({ ...toItem(row), claimedBy: row.claimed_by, claimedAt: row.claimed_at });
    wishes.set(row.child_id, lists);
  }
  return { children, wishes };
}

// En önskning med det som avgör om den är arkiverad: listans tillfälle och barnets födelsedatum (MUPP-031-R4)
type ItemFacts = ItemRow & { occasion: Occasion; added_at: string; child_id: number; birthdate: string };

async function findItem(rawId: unknown) {
  const id = parseId(typeof rawId === "number" ? String(rawId) : rawId);
  return id === null
    ? undefined
    : get<ItemFacts>(
        `SELECT i.id, i.title, i.description, i.size, i.url, i.unlimited, i.added_at, w.occasion, w.child_id, c.birthdate
         FROM wishlist_item i JOIN wishlist w ON w.id = i.wishlist_id JOIN child c ON c.id = w.child_id WHERE i.id = ?`,
        [id],
      );
}

const archived = (item: ItemFacts, today: Today) => isArchived(item, item.occasion, item.added_at, today);

// ---- Paxa (MUPP-005): vem som helst med sajtlösenordet

const MAX_CLAIMS = 50;

// claimed: hur många som paxades; notClaimed: rubrikerna på de som inte gick att paxa (redan paxade, kan köpas flera gånger),
// och missing: hur många som inte fanns (eller är arkiverade, MUPP-031-R4)
export type ClaimResult = { ok: boolean; error?: string; claimed: number; notClaimed: string[]; missing: number };

// Varje önskan paxas med ett eget UPDATE som bara träffar en som är ledig, så att två som paxar samma önskan samtidigt
// aldrig skriver över varandra: databasen låter bara en av dem ändra raden.
export async function claimWishes(rawIds: unknown, rawName: unknown, today = swedishToday()): Promise<ClaimResult> {
  const name = parseText(rawName, 60, true);
  if (!name.ok) return { ok: false, error: name.error === "Fyll i det här fältet." ? "Skriv ditt namn." : name.error, claimed: 0, notClaimed: [], missing: 0 };
  const ids = Array.isArray(rawIds) ? [...new Set(rawIds.map((id) => parseId(typeof id === "number" ? String(id) : id)))] : [];
  if (ids.length === 0 || ids.length > MAX_CLAIMS || ids.includes(null)) return { ok: false, error: "Markera de presenter du vill paxa.", claimed: 0, notClaimed: [], missing: 0 };

  const claimedAt = isoDate(today);
  let claimed = 0;
  const notClaimed: string[] = [];
  let missing = 0;
  for (const id of ids as number[]) {
    const item = await findItem(id);
    if (!item || archived(item, today)) {
      missing++;
      continue;
    }
    const { changes } = await run("UPDATE wishlist_item SET claimed_by = ?, claimed_at = ? WHERE id = ? AND claimed_by IS NULL AND unlimited = 0", [name.value, claimedAt, id]);
    if (changes > 0) claimed++;
    else notClaimed.push(item.title);
  }
  return notClaimed.length === 0 && missing === 0 ? { ok: true, claimed, notClaimed, missing } : { ok: false, claimed, notClaimed, missing };
}

// Ta bort en paxning (MUPP-006): vem som helst med sajtlösenordet, en önskan i taget. ok är false om den redan var
// opaxad, inte finns, är arkiverad (MUPP-031-R4) eller kan köpas flera gånger; error bara när id:t är fel.
export type UnclaimResult = { ok: boolean; error?: string };

export async function unclaimWish(rawId: unknown, today = swedishToday()): Promise<UnclaimResult> {
  const id = parseId(typeof rawId === "number" ? String(rawId) : rawId);
  if (id === null) return { ok: false, error: "Det gick inte att ta bort paxningen. Ladda om sidan och försök igen." };
  const item = await findItem(id);
  if (!item || archived(item, today)) return { ok: false };
  const { changes } = await run("UPDATE wishlist_item SET claimed_by = NULL, claimed_at = NULL WHERE id = ? AND claimed_by IS NOT NULL AND unlimited = 0", [id]);
  return { ok: changes > 0 };
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
    if (await get("SELECT 1 FROM ss_event WHERE owner_id = ? LIMIT 1", [current.id], tx)) {
      return { ok: false, error: "Föräldern administrerar Secret Santa-grupper. Ta bort grupperna först." };
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
  today = swedishToday(),
): Promise<Outcome> {
  const occasion = parseOccasion(input.occasion);
  const checked = parseWish(input);

  if (input.itemId === undefined || input.itemId === "") {
    const child = await manageableChild(actor, input.childId);
    if (!child || !occasion) return NOT_ALLOWED;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    await addItem(child.id, occasion, { ...checked.values, unlimited: input.unlimited }, today);
    return { ok: true };
  }

  const item = await manageableItem(actor, input.itemId, today);
  if (!item) return NOT_ALLOWED;
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { title, size, description, url } = checked.values;
  await run("UPDATE wishlist_item SET title = ?, description = ?, size = ?, url = ?, unlimited = ? WHERE id = ?", [title, description, size, url, input.unlimited ? 1 : 0, item.id]);
  return { ok: true };
}

// En ny önskning i barnets lista, tillagd idag; listan skapas när första önskningen läggs till
async function addItem(childId: number, occasion: Occasion, item: Omit<WishlistItem, "id">, today: Today) {
  await withTransaction(async (tx) => {
    await run("INSERT OR IGNORE INTO wishlist (child_id, occasion) VALUES (?, ?)", [childId, occasion], tx);
    const list = await get<{ id: number }>("SELECT id FROM wishlist WHERE child_id = ? AND occasion = ?", [childId, occasion], tx);
    await run(
      "INSERT INTO wishlist_item (wishlist_id, title, description, size, url, unlimited, added_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [list!.id, item.title, item.description, item.size, item.url, item.unlimited ? 1 : 0, isoDate(today)],
      tx,
    );
  });
}

// Önskningen om aktören får ändra barnets lista och den inte är arkiverad (MUPP-031-R4)
async function manageableItem(actor: Parent | null, rawId: unknown, today: Today) {
  const item = await findItem(rawId);
  return item && !archived(item, today) && (await manageableChild(actor, String(item.child_id))) ? item : undefined;
}

export async function removeItem(actor: Parent | null, rawId: unknown, today = swedishToday()): Promise<Outcome> {
  const item = await manageableItem(actor, rawId, today);
  if (!item) return NOT_ALLOWED;
  await run("DELETE FROM wishlist_item WHERE id = ?", [item.id]);
  return { ok: true };
}

// Lägger en kopia av en arkiverad önskning i en av barnets listor (MUPP-031-R7). Kopian är opaxad och tillagd idag;
// arkivet behåller sin. Bara en önskning som är arkiverad, och bara för den som får ändra barnet.
export async function copyArchivedItem(actor: Parent | null, rawItemId: unknown, rawOccasion: unknown, today = swedishToday()): Promise<Outcome> {
  const occasion = parseOccasion(rawOccasion);
  const item = await findItem(rawItemId);
  if (!occasion || !item || !archived(item, today) || !(await manageableChild(actor, String(item.child_id)))) return NOT_ALLOWED;
  await addItem(item.child_id, occasion, toItem(item), today);
  return { ok: true };
}
