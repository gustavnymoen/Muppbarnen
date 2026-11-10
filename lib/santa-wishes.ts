import "server-only";
import { all, get, run } from "./db";
import { parseId, parseWish } from "./form-input";
import type { Outcome } from "./family";
import { markListChanged } from "./santa-changes";

// Secret Santa-önskelistan (MUPP-040): en lista per medlem (ss_member), alltså en per person och grupp.
// Allt tar emot medlemmen ur inloggningskakan (aldrig ett id från formuläret) och kontrollerar att
// önskningen är hens egen. Listan läses av ingen annan (MUPP-040-R4).

export type SantaWish = { id: number; title: string; description: string; size: string; url: string };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;

const CLOSED = { ok: false, error: "Önskelistan är stängd just nu." } as const;

// Önskelistor skrivs bara när gruppen förbereder eller är startad (MUPP-051-R4); en inaktiv grupp behåller sina önskningar
async function listIsOpen(memberId: number) {
  const row = await get<{ status: string }>("SELECT e.status FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE m.id = ?", [memberId]);
  return row !== undefined && row.status !== "inactive";
}

// Medlemmens önskelista
export const listOwn = (memberId: number) =>
  all<SantaWish>("SELECT id, title, description, size, url FROM ss_wish WHERE member_id = ? ORDER BY id", [memberId]);

// Ny önskning (inget wishId) i medlemmens lista, eller ändring av en egen önskning
export async function saveWish(memberId: number, input: { wishId?: unknown; title: unknown; size: unknown; description: unknown; url: unknown }): Promise<Outcome> {
  if (!(await listIsOpen(memberId))) return CLOSED;
  const checked = parseWish(input);
  const isNew = input.wishId === undefined || input.wishId === "";
  const wish = isNew ? null : await ownWish(memberId, input.wishId);
  if (!isNew && !wish) return NOT_ALLOWED;
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { title, size, description, url } = checked.values;
  if (wish) await run("UPDATE ss_wish SET title = ?, description = ?, size = ?, url = ? WHERE id = ?", [title, description, size, url, wish.id]);
  else await run("INSERT INTO ss_wish (member_id, title, description, size, url) VALUES (?, ?, ?, ?, ?)", [memberId, title, description, size, url]);
  await markListChanged(memberId);
  return { ok: true };
}

export async function removeWish(memberId: number, rawId: unknown): Promise<Outcome> {
  if (!(await listIsOpen(memberId))) return CLOSED;
  const wish = await ownWish(memberId, rawId);
  if (!wish) return NOT_ALLOWED;
  await run("DELETE FROM ss_wish WHERE id = ?", [wish.id]);
  await markListChanged(memberId);
  return { ok: true };
}

// Önskningen, bara om den ligger i medlemmens egen lista
async function ownWish(memberId: number, rawId: unknown) {
  const id = parseId(rawId);
  return id === null ? undefined : get<{ id: number }>("SELECT id FROM ss_wish WHERE id = ? AND member_id = ?", [id, memberId]);
}
