import "server-only";
import { all, get, run } from "./db";
import { parseId, parseWish } from "./form-input";
import type { Outcome } from "./family";

// Secret Santa-önskelistan (MUPP-040): en lista per medlemskap (ss_member), alltså en per person och familj.
// Allt tar emot personen ur inloggningskakan (aldrig ett id från formuläret) och kontrollerar att
// medlemskapet eller önskningen är hens egen. Listan läses av ingen annan (MUPP-040-R4).

export type SantaWish = { id: number; title: string; description: string; size: string; url: string };
export type SantaList = { memberId: number; familyId: number; familyName: string; wishes: SantaWish[] };

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;

// Personens listor, en per familj hen är med i
export async function listOwn(personId: number): Promise<SantaList[]> {
  const members = await all<{ id: number; family_id: number; name: string }>(
    "SELECT m.id, m.family_id, f.name FROM ss_member m JOIN ss_family f ON f.id = m.family_id WHERE m.person_id = ? ORDER BY f.name, f.id",
    [personId],
  );
  const wishes = await all<SantaWish & { member_id: number }>(
    "SELECT w.id, w.member_id, w.title, w.description, w.size, w.url FROM ss_wish w JOIN ss_member m ON m.id = w.member_id WHERE m.person_id = ? ORDER BY w.id",
    [personId],
  );
  return members.map((m) => ({
    memberId: m.id,
    familyId: m.family_id,
    familyName: m.name,
    wishes: wishes.filter((w) => w.member_id === m.id).map(({ id, title, description, size, url }) => ({ id, title, description, size, url })),
  }));
}

// Ny önskning (inget wishId) i personens lista i familjen, eller ändring av en egen önskning
export async function saveWish(
  personId: number,
  input: { familyId: unknown; wishId?: unknown; title: unknown; size: unknown; description: unknown; url: unknown },
): Promise<Outcome> {
  const checked = parseWish(input);
  if (input.wishId === undefined || input.wishId === "") {
    const familyId = parseId(input.familyId);
    const member = familyId === null ? undefined : await get<{ id: number }>("SELECT id FROM ss_member WHERE family_id = ? AND person_id = ?", [familyId, personId]);
    if (!member) return NOT_ALLOWED;
    if (!checked.ok) return { ok: false, fields: checked.errors };
    const { title, size, description, url } = checked.values;
    await run("INSERT INTO ss_wish (member_id, title, description, size, url) VALUES (?, ?, ?, ?, ?)", [member.id, title, description, size, url]);
    return { ok: true };
  }
  const wish = await ownWish(personId, input.wishId);
  if (!wish) return NOT_ALLOWED;
  if (!checked.ok) return { ok: false, fields: checked.errors };
  const { title, size, description, url } = checked.values;
  await run("UPDATE ss_wish SET title = ?, description = ?, size = ?, url = ? WHERE id = ?", [title, description, size, url, wish.id]);
  return { ok: true };
}

export async function removeWish(personId: number, rawId: unknown): Promise<Outcome> {
  const wish = await ownWish(personId, rawId);
  if (!wish) return NOT_ALLOWED;
  await run("DELETE FROM ss_wish WHERE id = ?", [wish.id]);
  return { ok: true };
}

// Önskningen, bara om den ligger i en lista som personen äger
async function ownWish(personId: number, rawId: unknown) {
  const id = parseId(rawId);
  return id === null ? undefined : get<{ id: number }>("SELECT w.id FROM ss_wish w JOIN ss_member m ON m.id = w.member_id WHERE w.id = ? AND m.person_id = ?", [id, personId]);
}
