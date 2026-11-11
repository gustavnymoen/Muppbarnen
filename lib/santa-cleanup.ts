import "server-only";
import { all, get, run, withTransaction } from "./db";
import { swedishToday, type Today } from "./deck";
import { clearMessages } from "./santa-chat";

// Den årliga rensningen (MUPP-044): en månad efter julafton tas alla gruppers önskelistor och samtal (MUPP-043) bort och
// grupperna blir inaktiva. Grupperna, deltagarna och dragningsraderna (ss_draw, historiken som "inte förra årets"-regeln
// läser) finns kvar. Designen: wiki/system/secret-santa-cleanup.md.

// 24 januari: en månad efter julafton, som barnens listor (MUPP-031, DAYS_AFTER)
const CLEANUP_MONTH = 1;
const CLEANUP_DAY = 24;

// Är det dags? Första gången på eller efter 24 januari ett år då rensningen inte gjorts än.
export const cleanupDue = (today: Today, lastYear: number) =>
  lastYear < today.year && (today.month > CLEANUP_MONTH || (today.month === CLEANUP_MONTH && today.day >= CLEANUP_DAY));

// Året då rensningen senast gjordes; det som står i inloggningskakan (lib/santa-session.ts)
export async function cleanupYear() {
  return (await get<{ year: number }>("SELECT year FROM ss_cleanup WHERE id = 1"))!.year;
}

// Rensar om det är dags. En transaktion per grupp, så inget blir halvt borttaget. Året sparas sist: går något fel körs rensningen om
// nästa dag, och den som redan är rensad rensas om utan skada.
export async function runCleanup(today: Today = swedishToday()) {
  const lastYear = await cleanupYear();
  if (!cleanupDue(today, lastYear)) return { cleaned: 0 };
  const events = await all<{ id: number }>("SELECT id FROM ss_event");
  for (const { id } of events) {
    await withTransaction(async (tx) => {
      await run("DELETE FROM ss_wish WHERE member_id IN (SELECT id FROM ss_member WHERE event_id = ?)", [id], tx);
      await clearMessages(id, tx);
      // En ändring som väntar på sitt mejl (MUPP-042) ska inte mejlas efter rensningen
      await run("UPDATE ss_member SET list_changed_at = NULL WHERE event_id = ?", [id], tx);
      await run("UPDATE ss_event SET status = 'inactive' WHERE id = ?", [id], tx);
    });
  }
  await run("UPDATE ss_cleanup SET year = ? WHERE id = 1", [today.year]);
  return { cleaned: events.length };
}
