import "server-only";
import { get, run } from "./db";

// Spärr mot gissning av lösenord, gemensam för sajtlösenordet och adminlösenordet
// (TECH-005): fler än 5 fel lösenord på 15 minuter spärrar adressen i 20 minuter.
// Rätta lösenord räknas inte. Designen: wiki/system/security.md.
export const MAX_WRONG = 5;
export const WINDOW_SECONDS = 15 * 60;
export const BLOCK_SECONDS = 20 * 60;

const seconds = (ms: number) => Math.floor(ms / 1000);

// Försöket skrivs in innan lösenordet kontrolleras och tas bort om det var rätt.
// Då kan inte många samtidiga gissningar alla slinka förbi spärren, och ett rätt
// lösenord blir aldrig räknat. Kastar åtgärden ett fel mitt i räknas försöket som fel (säkra sidan). Ger försökets id, eller null om adressen är spärrad.
export async function beginAttempt(ip: string, nowMs = Date.now()) {
  const now = seconds(nowMs);
  await run("DELETE FROM login_attempts WHERE attempted_at <= ?", [now - WINDOW_SECONDS]);
  await run("DELETE FROM login_blocks WHERE blocked_until <= ?", [now]);
  if (await get("SELECT 1 FROM login_blocks WHERE ip = ?", [ip])) return null;

  const { lastId } = await run("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)", [ip, now]);
  // Det här försöket räknas själv med: 5 fel plus detta får göras, fler samtidiga inte
  if ((await countAttempts(ip, now)) > MAX_WRONG + 1) {
    await block(ip, now);
    return null;
  }
  return lastId;
}

// Lösenordet var rätt: försöket räknas inte
export async function clearAttempt(id: number) {
  await run("DELETE FROM login_attempts WHERE id = ?", [id]);
}

// Lösenordet var fel: är det fler än 5 fel i fönstret spärras adressen
export async function registerWrong(ip: string, nowMs = Date.now()) {
  const now = seconds(nowMs);
  if ((await countAttempts(ip, now)) > MAX_WRONG) await block(ip, now);
}

async function countAttempts(ip: string, now: number) {
  const row = await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?", [
    ip,
    now - WINDOW_SECONDS,
  ]);
  return row?.n ?? 0;
}

async function block(ip: string, now: number) {
  await run(
    "INSERT INTO login_blocks (ip, blocked_until) VALUES (?, ?) ON CONFLICT (ip) DO UPDATE SET blocked_until = excluded.blocked_until",
    [ip, now + BLOCK_SECONDS],
  );
}
