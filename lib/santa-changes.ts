import "server-only";
import { all, run, type Executor } from "./db";
import { sendMail, type Mail } from "./mail";
import { listChangedMail } from "./santa-mail";

// Ändrade önskelistor efter dragningen (MUPP-042-R3). En ändring bara märks (list_changed_at); ett jobb som körs var tionde minut
// (.github/workflows/santa-mails.yml, app/api/santa-mails/route.ts) mejlar givaren, men högst ett mejl i timmen per lista, så en
// ändring eller tio ger samma mejl. Märkningen sparas i databasen, så ingen ändring går förlorad mellan två körningar.

export const MAIL_INTERVAL_MS = 60 * 60 * 1000;

// Märker att deltagarens lista ändrats, men bara i en startad grupp: före dragningen finns ingen givare att berätta för
export const markListChanged = (memberId: number, now = Date.now()) =>
  run("UPDATE ss_member SET list_changed_at = ? WHERE id = ? AND event_id IN (SELECT id FROM ss_event WHERE status = 'started')", [now, memberId]);

// Dragningen startas eller stoppas: det som väntade (en ändrad lista, ett tjat, MUPP-071) hör till en annan dragning
export const clearListChanges = (eventId: number, tx: Executor) =>
  run("UPDATE ss_member SET list_changed_at = NULL, list_mailed_at = NULL, nag_requested_at = NULL, nag_mailed_at = NULL WHERE event_id = ?", [eventId], tx);

type Pending = { id: number; list_changed_at: number; list_mailed_at: number | null; email: string; event_name: string };

// Skickar mejlet för varje lista som väntar och inte fått något det senaste timmen. Svaret är bara antal, aldrig vem det gällde.
export async function sendListChangeMails(now = Date.now(), send: (to: string, mail: Mail) => Promise<{ ok: boolean }> = sendMail) {
  const pending = await all<Pending>(
    `SELECT r.id, r.list_changed_at, r.list_mailed_at, g.email, e.name AS event_name
     FROM ss_member r
     JOIN ss_event e ON e.id = r.event_id
     JOIN ss_draw d ON d.event_id = r.event_id AND d.receiver_id = r.id AND d.year = (SELECT MAX(year) FROM ss_draw WHERE event_id = r.event_id)
     JOIN ss_member g ON g.id = d.giver_id
     WHERE e.status = 'started' AND r.list_changed_at IS NOT NULL AND (r.list_mailed_at IS NULL OR r.list_mailed_at <= ?)
     ORDER BY r.id`,
    [now - MAIL_INTERVAL_MS],
  );
  let sent = 0;
  let failed = 0;
  for (const item of pending) {
    // Märkningen tas först, så att två samtidiga körningar inte mejlar två gånger; går mejlet inte iväg sätts den tillbaka
    const claim = await run("UPDATE ss_member SET list_changed_at = NULL, list_mailed_at = ? WHERE id = ? AND list_changed_at = ?", [now, item.id, item.list_changed_at]);
    if (claim.changes === 0) continue;
    // Ett undantag räknas som ett mejl som inte gick iväg, så att märkningen sätts tillbaka
    const delivered = await send(item.email, listChangedMail(item.event_name)).then((r) => r.ok, () => false);
    if (delivered) {
      sent++;
    } else {
      failed++;
      await run("UPDATE ss_member SET list_changed_at = COALESCE(list_changed_at, ?), list_mailed_at = ? WHERE id = ?", [item.list_changed_at, item.list_mailed_at, item.id]);
    }
  }
  return { sent, failed };
}
