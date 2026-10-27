import "server-only";
import { get, run } from "./db";

export const MAX_ATTEMPTS = 5;
export const WINDOW_SECONDS = 15 * 60;

// Räknar det här försöket och säger om det får göras. Försöket skrivs in
// innan lösenordet kontrolleras, så att också de som gissar rätt räknas, och
// så att två samtidiga försök inte båda slinker igenom på samma plats.
export async function registerAttempt(ip: string, nowMs = Date.now()) {
  const now = Math.floor(nowMs / 1000);
  await run("DELETE FROM login_attempts WHERE attempted_at <= ?", [now - WINDOW_SECONDS]);
  await run("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)", [ip, now]);
  const row = await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?", [
    ip,
    now - WINDOW_SECONDS,
  ]);
  return (row?.n ?? 0) <= MAX_ATTEMPTS;
}
