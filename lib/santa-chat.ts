import "server-only";
import { all, get, run, type Executor } from "./db";
import { sendMail, type Mail } from "./mail";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type ChatResult, type ChatSide } from "./santa-chat-shared";
import { messageFromGiverMail, messageFromReceiverMail } from "./santa-mail";

// Samtalet mellan en givare och hens mottagare (MUPP-043). Ett samtal hör till ett par ur den senaste dragningen i en startad grupp.
// Varje funktion tar bara medlemmen ur inloggningskakan och vilken sida hen står på, aldrig ett id ur ett formulär: paret läses ur
// dragningen, så ingen kan be om någon annans samtal (R4). Det som lämnar den här filen till sidan är bara { mine, text }: inget id,
// ingen tid och inget namn, så mottagaren inte kan se vem givaren är (R3, MUPP-042-R2). Designen: wiki/system/secret-santa-chat.md.

// Meddelanden inom så här lång tid från det första som väntar ger ett enda mejl
export const MAIL_WAIT_MS = 10 * 60 * 1000;

const NOT_ALLOWED = { ok: false, error: "Du kan inte göra det här." } as const;

export const parseSide = (raw: unknown): ChatSide | null => (raw === "giver" || raw === "receiver" ? raw : null);

type Pair = { giverId: number; receiverId: number; eventId: number };

// Paret som medlemmen ingår i på den sidan, bara i en startad grupp
async function pairOf(memberId: number, side: ChatSide): Promise<Pair | undefined> {
  const column = side === "giver" ? "d.giver_id" : "d.receiver_id";
  const row = await get<{ giver_id: number; receiver_id: number; event_id: number }>(
    `SELECT d.giver_id, d.receiver_id, d.event_id
     FROM ss_draw d JOIN ss_event e ON e.id = d.event_id
     WHERE ${column} = ? AND e.status = 'started' AND d.year = (SELECT MAX(year) FROM ss_draw WHERE event_id = d.event_id)`,
    [memberId],
  );
  return row && { giverId: row.giver_id, receiverId: row.receiver_id, eventId: row.event_id };
}

const readAll = async (pair: Pair, side: ChatSide): Promise<ChatMessage[]> =>
  (await all<{ from_giver: number; text: string }>("SELECT from_giver, text FROM ss_message WHERE giver_id = ? AND receiver_id = ? ORDER BY id", [pair.giverId, pair.receiverId])).map((m) => ({
    mine: (m.from_giver === 1) === (side === "giver"),
    text: m.text,
  }));

// Det som den andra sidan skrivit och den här inte sett än
const unreadFrom = (side: ChatSide) => (side === "giver" ? 0 : 1);

// Meddelandena utan att märka något som läst: sidan skickar dem med, så att samtalet syns direkt när kortet öppnas
export async function peekChat(memberId: number, side: ChatSide): Promise<ChatMessage[]> {
  const pair = await pairOf(memberId, side);
  return pair ? readAll(pair, side) : [];
}

// Öppnar samtalet: alla meddelanden, och det som den andra sidan skrivit märks lästa (R5)
export async function openChat(memberId: number, side: ChatSide, now = Date.now()): Promise<ChatResult> {
  const pair = await pairOf(memberId, side);
  if (!pair) return NOT_ALLOWED;
  await run("UPDATE ss_message SET read_at = ? WHERE giver_id = ? AND receiver_id = ? AND from_giver = ? AND read_at IS NULL", [now, pair.giverId, pair.receiverId, unreadFrom(side)]);
  return { ok: true, messages: await readAll(pair, side) };
}

// Ett nytt meddelande (R1, R2): 1 till 500 tecken, från vilken sida som helst och när som helst, flera i rad
export async function sendMessage(memberId: number, side: ChatSide, rawText: unknown, now = Date.now()): Promise<ChatResult> {
  const pair = await pairOf(memberId, side);
  if (!pair) return NOT_ALLOWED;
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (text === "") return { ok: false, error: "Skriv ett meddelande." };
  if (text.length > MAX_MESSAGE_LENGTH) return { ok: false, error: `Meddelandet får vara högst ${MAX_MESSAGE_LENGTH} tecken.` };
  await run("INSERT INTO ss_message (event_id, giver_id, receiver_id, from_giver, text, created_at) VALUES (?, ?, ?, ?, ?, ?)", [pair.eventId, pair.giverId, pair.receiverId, side === "giver" ? 1 : 0, text, now]);
  return { ok: true, messages: await readAll(pair, side) };
}

// Vilka sidor som har ett oläst meddelande (R5), för märket på korten och knapparna
export async function unreadSides(memberId: number): Promise<Record<ChatSide, boolean>> {
  const rows = await all<{ side: ChatSide }>(
    `SELECT DISTINCT CASE WHEN m.giver_id = ? THEN 'giver' ELSE 'receiver' END AS side
     FROM ss_message m JOIN ss_event e ON e.id = m.event_id
     WHERE e.status = 'started' AND m.read_at IS NULL
       AND ((m.giver_id = ? AND m.from_giver = 0) OR (m.receiver_id = ? AND m.from_giver = 1))`,
    [memberId, memberId, memberId],
  );
  return { giver: rows.some((r) => r.side === "giver"), receiver: rows.some((r) => r.side === "receiver") };
}

// Samtalen i en grupp tas bort när dragningen startas om eller stoppas, när gruppen tas bort och i den årliga rensningen (R7)
export const clearMessages = (eventId: number, tx: Executor) => run("DELETE FROM ss_message WHERE event_id = ?", [eventId], tx);

// ---- Mejlet (R6)

type Waiting = { giver_id: number; receiver_id: number; from_giver: number; event_name: string; email: string; unread: number; last_id: number };

// Mejlar den andra sidan om det som väntar: en grupp av meddelanden per samtal och riktning, när det äldsta har väntat tio minuter
// (jobbet körs var tionde minut, .github/workflows/santa-mails.yml). Märkningen tas först, så att två körningar inte mejlar två
// gånger, och bara de meddelanden som fanns när frågan ställdes (ett som kommer under tiden väntar på nästa körning); går mejlet inte iväg sätts den tillbaka. Är allt redan läst skickas inget. Svaret är bara antal.
export async function sendMessageMails(now = Date.now(), send: (to: string, mail: Mail) => Promise<{ ok: boolean }> = sendMail) {
  const waiting = await all<Waiting>(
    `SELECT m.giver_id, m.receiver_id, m.from_giver, e.name AS event_name, t.email,
            SUM(CASE WHEN m.read_at IS NULL THEN 1 ELSE 0 END) AS unread, MAX(m.id) AS last_id
     FROM ss_message m
     JOIN ss_event e ON e.id = m.event_id
     JOIN ss_member t ON t.id = CASE WHEN m.from_giver = 1 THEN m.receiver_id ELSE m.giver_id END
     WHERE e.status = 'started' AND m.mailed_at IS NULL
     GROUP BY m.giver_id, m.receiver_id, m.from_giver
     HAVING MIN(m.created_at) <= ?
     ORDER BY m.giver_id, m.receiver_id, m.from_giver`,
    [now - MAIL_WAIT_MS],
  );
  let sent = 0;
  let failed = 0;
  for (const item of waiting) {
    const claim = await run("UPDATE ss_message SET mailed_at = ? WHERE giver_id = ? AND receiver_id = ? AND from_giver = ? AND mailed_at IS NULL AND id <= ?", [
      now,
      item.giver_id,
      item.receiver_id,
      item.from_giver,
      item.last_id,
    ]);
    if (claim.changes === 0 || item.unread === 0) continue;
    const mail = item.from_giver === 1 ? messageFromGiverMail(item.event_name) : messageFromReceiverMail(item.event_name);
    const delivered = await send(item.email, mail).then((r) => r.ok, () => false);
    if (delivered) {
      sent++;
    } else {
      failed++;
      await run("UPDATE ss_message SET mailed_at = NULL WHERE giver_id = ? AND receiver_id = ? AND from_giver = ? AND mailed_at = ?", [item.giver_id, item.receiver_id, item.from_giver, now]);
    }
  }
  return { sent, failed };
}
