import "server-only";
import { all, get } from "./db";
import type { SantaWish } from "./santa-wishes";

// Den man ska handla åt (MUPP-042-R1, R2). Frågan tar bara givarens eget id (ur inloggningskakan) och ger bara hens mottagare:
// ingen funktion här ger en givare, så ingen sida kan visa vem som drog någon (R2). Bara en startad grupp har en matchning.
export type Match = { name: string; wishes: SantaWish[] };

export async function matchOf(giverId: number): Promise<Match | undefined> {
  const receiver = await get<{ id: number; name: string }>(
    `SELECT r.id, r.name
     FROM ss_member g
     JOIN ss_event e ON e.id = g.event_id
     JOIN ss_draw d ON d.event_id = g.event_id AND d.giver_id = g.id AND d.year = (SELECT MAX(year) FROM ss_draw WHERE event_id = g.event_id)
     JOIN ss_member r ON r.id = d.receiver_id
     WHERE g.id = ? AND e.status = 'started'`,
    [giverId],
  );
  if (!receiver) return undefined;
  const wishes = await all<SantaWish>("SELECT id, title, description, size, url FROM ss_wish WHERE member_id = ? ORDER BY id", [receiver.id]);
  return { name: receiver.name, wishes };
}
