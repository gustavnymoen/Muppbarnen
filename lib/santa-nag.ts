import "server-only";
import { all, run } from "./db";
import { sendMail, type Mail } from "./mail";
import { nagListMail } from "./santa-mail";

// Tjat om en tom önskelista (MUPP-071). Givaren trycker på en knapp; tjatet bara märks (nag_requested_at på mottagarens rad), och samma
// jobb som mejlar ändrade listor (app/api/santa-mails/route.ts) skickar mejlet, men först när tjatet legat en timme (NAG_DELAY_MS), så att det inte plingar hos den tjatade strax efter att givaren tryckt. Knappen är låst medan mejlet väntar och
// en timme efter att det skickats, så ingen kan spamma. Märkningen sparas i databasen, så inget går förlorat mellan två körningar.

export const NAG_LOCK_MS = 60 * 60 * 1000;
// Hur länge ett tjat väntar innan mejlet går, så att det inte plingar hos den tjatade medan givaren sitter bredvid
export const NAG_DELAY_MS = 60 * 60 * 1000;

export type NagState = "free" | "queued" | "recent";

export const nagState = (row: { nag_requested_at: number | null; nag_mailed_at: number | null }, now = Date.now()): NagState =>
  row.nag_requested_at !== null ? "queued" : row.nag_mailed_at !== null && row.nag_mailed_at > now - NAG_LOCK_MS ? "recent" : "free";

// Givaren tjatar på sin matchning. Mottagaren läses ur dragningen med givarens eget id, aldrig ur anropet. En enda sats kontrollerar allt
// (startad grupp, tom lista, ingenting väntar, ingen nyss skickad), så två samtidiga tryck ger ett tjat. Svaret säger inget om varför.
export async function requestNag(giverId: number, now = Date.now()): Promise<{ ok: boolean }> {
  const result = await run(
    `UPDATE ss_member SET nag_requested_at = ?
     WHERE id = (
       SELECT d.receiver_id FROM ss_draw d JOIN ss_event e ON e.id = d.event_id
       WHERE d.giver_id = ? AND e.status = 'started' AND d.year = (SELECT MAX(year) FROM ss_draw WHERE event_id = d.event_id))
       AND nag_requested_at IS NULL AND (nag_mailed_at IS NULL OR nag_mailed_at <= ?)
       AND NOT EXISTS (SELECT 1 FROM ss_wish WHERE member_id = ss_member.id)`,
    [now, giverId, now - NAG_LOCK_MS],
  );
  return { ok: result.changes > 0 };
}

type Pending = { id: number; nag_requested_at: number; nag_mailed_at: number | null; email: string; event_name: string };

// Skickar tjat-mejlet för varje mottagare vars tjat väntat minst en timme. Ett tjat som inte längre behövs (listan har fått en önskan, eller gruppen är inte startad)
// tas bort utan mejl. Svaret är bara antal, aldrig vem det gällde.
export async function sendNagMails(now = Date.now(), send: (to: string, mail: Mail) => Promise<{ ok: boolean }> = sendMail) {
  await run(
    `UPDATE ss_member SET nag_requested_at = NULL
     WHERE nag_requested_at IS NOT NULL
       AND (EXISTS (SELECT 1 FROM ss_wish WHERE member_id = ss_member.id) OR event_id NOT IN (SELECT id FROM ss_event WHERE status = 'started'))`,
  );
  const pending = await all<Pending>(
    "SELECT m.id, m.nag_requested_at, m.nag_mailed_at, m.email, e.name AS event_name FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE m.nag_requested_at IS NOT NULL AND m.nag_requested_at <= ? ORDER BY m.id",
    [now - NAG_DELAY_MS],
  );
  let sent = 0;
  let failed = 0;
  for (const item of pending) {
    // Märkningen tas först, så att två samtidiga körningar inte mejlar två gånger; går mejlet inte iväg sätts den tillbaka
    const claim = await run("UPDATE ss_member SET nag_requested_at = NULL, nag_mailed_at = ? WHERE id = ? AND nag_requested_at = ?", [now, item.id, item.nag_requested_at]);
    if (claim.changes === 0) continue;
    const delivered = await send(item.email, nagListMail(item.event_name)).then((r) => r.ok, () => false);
    if (delivered) {
      sent++;
    } else {
      failed++;
      // Hann en önskan skrivas under tiden släpper nästa körning begäran utan mejl
      await run("UPDATE ss_member SET nag_requested_at = ?, nag_mailed_at = ? WHERE id = ?", [item.nag_requested_at, item.nag_mailed_at, item.id]);
    }
  }
  return { sent, failed };
}
