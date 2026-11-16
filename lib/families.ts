import "server-only";
import { all, get, run, withTransaction, type Executor } from "./db";
import { collect, parseId, parseText } from "./form-input";
import type { Outcome, Parent } from "./family";

// Familjer (MUPP-073): en förälder hör till en eller flera, en Secret Santa-grupp till exakt en. Bara huvudadministratören
// hanterar dem; en vanlig administratör väljer bland sina egna familjer när hen skapar en grupp.

export type Family = { id: number; name: string; description: string; parents: number; events: number };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;
const GONE = { ok: false, error: "Familjen finns inte längre. Ladda om sidan." } as const;
const NAME_TAKEN = { ok: false, fields: { name: "Det finns redan en familj med det namnet." } } as const;
export const NO_FAMILY = { ok: false, fields: { families: "Välj minst en familj." } } as const;

// Samma namn oavsett versaler och mellanslag i ändarna, som för grupperna (MUPP-048-R2)
const nameKey = (name: string) => name.trim().toLocaleLowerCase("sv");

type FamilyRow = { id: number; name: string; description: string; parents: number; events: number };

// Med antalet föräldrar och grupper, i namnordning
export async function listFamilies(tx?: Executor): Promise<Family[]> {
  return all<FamilyRow>(
    `SELECT f.id, f.name, f.description,
       (SELECT COUNT(*) FROM parent_family p WHERE p.family_id = f.id) AS parents,
       (SELECT COUNT(*) FROM ss_event e WHERE e.family_id = f.id) AS events
     FROM family f ORDER BY f.name, f.id`,
    [],
    tx,
  );
}

// Familjerna varje förälder hör till (förälderns id → familjernas id)
export async function listParentFamilies(tx?: Executor): Promise<Map<number, number[]>> {
  const rows = await all<{ parent_id: number; family_id: number }>("SELECT parent_id, family_id FROM parent_family ORDER BY family_id", [], tx);
  const byParent = new Map<number, number[]>();
  for (const row of rows) byParent.set(row.parent_id, [...(byParent.get(row.parent_id) ?? []), row.family_id]);
  return byParent;
}

// De familjer aktören får välja för en grupp: alla för huvudadministratören, annars de hen hör till
export async function familiesFor(actor: Parent | null, tx?: Executor): Promise<Family[]> {
  if (!actor) return [];
  const everyone = await listFamilies(tx);
  if (actor.isMasterAdmin) return everyone;
  const mine = (await listParentFamilies(tx)).get(actor.id) ?? [];
  return everyone.filter((f) => mine.includes(f.id));
}

// Familje-id:n ur ett formulär eller anrop: bara heltal som finns, utan dubbletter. null när något inte är en familj.
export async function checkFamilyIds(rawIds: unknown[], tx?: Executor): Promise<number[] | null> {
  const ids = [...new Set(rawIds.map((id) => parseId(id)))];
  if (ids.includes(null)) return null;
  const known = await all<{ id: number }>("SELECT id FROM family", [], tx);
  return (ids as number[]).every((id) => known.some((f) => f.id === id)) ? (ids as number[]) : null;
}

export async function saveFamily(actor: Parent | null, input: { id?: unknown; name: unknown; description: unknown }): Promise<Outcome> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const checked = collect({ name: parseText(input.name, 60, true), description: parseText(input.description, 30, false) });
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { name, description } = checked.values;
  const creating = input.id === undefined || input.id === "";
  const id = creating ? null : parseId(input.id);
  return withTransaction(async (tx) => {
    if (!creating && (id === null || !(await get("SELECT 1 FROM family WHERE id = ?", [id], tx)))) return GONE;
    const others = await all<{ id: number; name: string }>("SELECT id, name FROM family", [], tx);
    if (others.some((f) => f.id !== id && nameKey(f.name) === nameKey(name))) return NAME_TAKEN;
    try {
      if (creating) await run("INSERT INTO family (name, description) VALUES (?, ?)", [name, description], tx);
      else await run("UPDATE family SET name = ?, description = ? WHERE id = ?", [name, description, id], tx);
    } catch (error) {
      // Två som sparar samma namn samtidigt: indexet i databasen stoppar den andra
      if (/constraint/i.test(String(error))) return NAME_TAKEN;
      throw error;
    }
    return { ok: true };
  });
}

export async function removeFamily(actor: Parent | null, rawId: unknown): Promise<Outcome> {
  if (!actor?.isMasterAdmin) return NOT_ALLOWED;
  const id = parseId(rawId);
  return withTransaction(async (tx) => {
    if (id === null || !(await get("SELECT 1 FROM family WHERE id = ?", [id], tx))) return GONE;
    // Den sista familjen går alltså inte att ta bort så länge det finns en förälder: varje förälder har minst en
    if (await get("SELECT 1 FROM parent_family WHERE family_id = ? LIMIT 1", [id], tx)) return { ok: false, error: "Familjen har föräldrar. Flytta dem till en annan familj först." };
    if (await get("SELECT 1 FROM ss_event WHERE family_id = ? LIMIT 1", [id], tx)) return { ok: false, error: "Familjen har Secret Santa. Flytta dem till en annan familj först." };
    await run("DELETE FROM family WHERE id = ?", [id], tx);
    return { ok: true };
  });
}

// Sätter förälderns familjer (minst en). Anropas i förälderns transaktion, efter att föräldern finns.
export async function setParentFamilies(parentId: number, familyIds: number[], tx: Executor) {
  await run("DELETE FROM parent_family WHERE parent_id = ?", [parentId], tx);
  for (const familyId of familyIds) await run("INSERT INTO parent_family (parent_id, family_id) VALUES (?, ?)", [parentId, familyId], tx);
}
